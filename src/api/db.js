// On-device data layer. Replaces the hosted Base44 backend with IndexedDB so
// the app works offline and every record stays on the phone.
//
// Entities keep the Base44 call shape the screens were written against:
//   db.entities.X.list(sort?, limit?)        sort is a field, "-field" for desc
//   db.entities.X.filter(query, sort?, limit?)  equality match on each key
//   db.entities.X.get(id) / create(data) / update(id, patch) / delete(id)
// Every row carries id, created_date and updated_date like Base44 rows did.

const DB_NAME = "peak-system";
const DB_VERSION = 1;
const RECORDS = "records"; // one row per entity: { entity, rows: [] }
const FILES = "files"; // { id, blob, type, created_date }

export const ENTITY_NAMES = [
  "Profile",
  "DailyLog",
  "WeighIn",
  "WorkoutLog",
  "HabitLog",
  "MaintenanceHistory",
  "SessionCompletion",
  "WeeklySummary",
  "JourneyProgress",
  "ProgressPhoto",
];

const FILE_PREFIX = "local-file://";
const LS_PREFIX = "peak-system:";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(RECORDS)) idb.createObjectStore(RECORDS, { keyPath: "entity" });
        if (!idb.objectStoreNames.contains(FILES)) idb.createObjectStore(FILES, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      // Private windows on some browsers refuse IndexedDB; fall back to localStorage.
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDb().then(
    (idb) =>
      new Promise((resolve, reject) => {
        if (!idb) return resolve(undefined);
        const t = idb.transaction(store, mode);
        const result = fn(t.objectStore(store));
        t.oncomplete = () => resolve(result?.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

// ---- entity rows -----------------------------------------------------------

const cache = new Map(); // entity -> rows[]
const loading = new Map(); // entity -> Promise<rows[]>

function lsGet(entity) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + entity) || "[]");
  } catch {
    return [];
  }
}

function lsSet(entity, rows) {
  try {
    localStorage.setItem(LS_PREFIX + entity, JSON.stringify(rows));
  } catch {
    /* storage full or blocked — the in-memory copy still serves this session */
  }
}

async function loadRows(entity) {
  if (cache.has(entity)) return cache.get(entity);
  if (!loading.has(entity)) {
    loading.set(
      entity,
      (async () => {
        const idb = await openDb();
        let rows;
        if (idb) {
          const rec = await tx(RECORDS, "readonly", (s) => s.get(entity));
          rows = rec?.rows || [];
        } else {
          rows = lsGet(entity);
        }
        cache.set(entity, rows);
        return rows;
      })()
    );
  }
  return loading.get(entity);
}

// Writes are chained per entity so overlapping saves land in order.
const writeChains = new Map();

function saveRows(entity, rows) {
  cache.set(entity, rows);
  const prev = writeChains.get(entity) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      const idb = await openDb();
      if (idb) await tx(RECORDS, "readwrite", (s) => s.put({ entity, rows: cache.get(entity) }));
      else lsSet(entity, cache.get(entity));
    });
  writeChains.set(entity, next);
  return next;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  return Date.now().toString(16) + Math.random().toString(16).slice(2);
}

const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : 1;
    return desc ? -cmp : cmp;
  });
}

function shape(rows, sort, limit) {
  // Default order matches Base44: newest created first.
  let out = sortRows(rows, sort || "-created_date");
  if (limit) out = out.slice(0, limit);
  return clone(out);
}

function makeEntity(entity) {
  return {
    async list(sort, limit) {
      return shape(await loadRows(entity), sort, limit);
    },
    async filter(query = {}, sort, limit) {
      const rows = await loadRows(entity);
      const keys = Object.keys(query);
      return shape(
        rows.filter((r) => keys.every((k) => r[k] === query[k])),
        sort,
        limit
      );
    },
    async get(id) {
      const row = (await loadRows(entity)).find((r) => r.id === id);
      if (!row) throw Object.assign(new Error(`${entity} ${id} not found`), { status: 404 });
      return clone(row);
    },
    async create(data = {}) {
      const rows = await loadRows(entity);
      const now = new Date().toISOString();
      const row = { ...clone(data), id: newId(), created_date: now, updated_date: now };
      await saveRows(entity, [...rows, row]);
      return clone(row);
    },
    async update(id, patch = {}) {
      const rows = await loadRows(entity);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) throw Object.assign(new Error(`${entity} ${id} not found`), { status: 404 });
      const row = {
        ...rows[idx],
        ...clone(patch),
        id,
        created_date: rows[idx].created_date,
        updated_date: new Date().toISOString(),
      };
      const next = [...rows];
      next[idx] = row;
      await saveRows(entity, next);
      return clone(row);
    },
    async delete(id) {
      const rows = await loadRows(entity);
      await saveRows(
        entity,
        rows.filter((r) => r.id !== id)
      );
      return { id };
    },
  };
}

const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, makeEntity(n)]));

// ---- progress photos ---------------------------------------------------------

const urlCache = new Map(); // file id -> object URL

// Phone cameras produce multi-MB images; shrink before storing so months of
// progress photos fit comfortably in device storage.
async function compressImage(file, maxDim = 1600, quality = 0.85) {
  if (typeof createImageBitmap === "undefined" || !file.type?.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob || file;
  } catch {
    return file;
  }
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function getFile(id) {
  const idb = await openDb();
  if (idb) return tx(FILES, "readonly", (s) => s.get(id));
  try {
    const dataUrl = localStorage.getItem(LS_PREFIX + "file:" + id);
    return dataUrl ? { id, dataUrl } : undefined;
  } catch {
    return undefined;
  }
}

async function putFile(rec) {
  const idb = await openDb();
  if (idb) return tx(FILES, "readwrite", (s) => s.put(rec));
  const dataUrl = rec.dataUrl || (await blobToDataUrl(rec.blob));
  localStorage.setItem(LS_PREFIX + "file:" + rec.id, dataUrl);
}

const photos = {
  // Store an image on the device; returns the file_uri to save on a ProgressPhoto.
  async upload(file) {
    const blob = await compressImage(file);
    const id = newId();
    await putFile({ id, blob, type: blob.type, created_date: new Date().toISOString() });
    return { file_uri: FILE_PREFIX + id };
  },

  // Map ProgressPhoto ids to displayable URLs (the old signPhotoUrls function).
  async urls(photoIds = []) {
    const rows = await loadRows("ProgressPhoto");
    const wanted = new Set(photoIds);
    const out = {};
    for (const ph of rows) {
      if (!wanted.has(ph.id)) continue;
      const uri = ph.file_url || "";
      if (!uri.startsWith(FILE_PREFIX)) {
        out[ph.id] = uri || null;
        continue;
      }
      const fid = uri.slice(FILE_PREFIX.length);
      if (!urlCache.has(fid)) {
        const rec = await getFile(fid);
        if (!rec) {
          out[ph.id] = null;
          continue;
        }
        urlCache.set(fid, rec.blob ? URL.createObjectURL(rec.blob) : rec.dataUrl);
      }
      out[ph.id] = urlCache.get(fid);
    }
    return out;
  },
};

// ---- backup / restore --------------------------------------------------------

async function exportAll() {
  const data = {};
  for (const n of ENTITY_NAMES) data[n] = await loadRows(n);
  const files = {};
  for (const ph of data.ProgressPhoto) {
    const uri = ph.file_url || "";
    if (!uri.startsWith(FILE_PREFIX)) continue;
    const fid = uri.slice(FILE_PREFIX.length);
    const rec = await getFile(fid);
    if (rec) files[fid] = rec.blob ? await blobToDataUrl(rec.blob) : rec.dataUrl;
  }
  return { app: "peak-system", version: 1, exported_at: new Date().toISOString(), entities: data, files };
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

async function importAll(backup) {
  if (!backup || backup.app !== "peak-system" || !backup.entities) {
    throw new Error("This file is not a Peak System backup.");
  }
  for (const [fid, dataUrl] of Object.entries(backup.files || {})) {
    const blob = await dataUrlToBlob(dataUrl);
    await putFile({ id: fid, blob, type: blob.type, created_date: new Date().toISOString() });
  }
  for (const n of ENTITY_NAMES) await saveRows(n, Array.isArray(backup.entities[n]) ? backup.entities[n] : []);
}

async function clearAll() {
  for (const n of ENTITY_NAMES) await saveRows(n, []);
  const idb = await openDb();
  if (idb) await tx(FILES, "readwrite", (s) => s.clear());
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LS_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  for (const url of urlCache.values()) if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  urlCache.clear();
}

// Ask the browser not to evict our data under storage pressure.
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      return await navigator.storage.persist();
    }
    return true;
  } catch {
    return false;
  }
}

export const db = { entities, photos, exportAll, importAll, clearAll };
