import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { requestPersistentStorage } from '@/api/db'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

requestPersistentStorage();

// Offline support: cache the app shell so it opens without a connection.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
