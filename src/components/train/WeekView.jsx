import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Check } from "lucide-react";

export default function WeekView({ week, todayIdx, custom, onReorder, onOpenDay, todayCompleted = false }) {
  function onDragEnd(res) {
    if (!res.destination || res.destination.index === res.source.index) return;
    onReorder(res.source.index, res.destination.index);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="week">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {week.map(({ weekday, day }, idx) => {
              const isToday = idx === todayIdx;
              return (
                <Draggable key={idx} draggableId={String(idx)} index={idx}>
                  {(prov, snap) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 transition-colors ${
                        snap.isDragging
                          ? "border-accent/40 bg-accent/[0.06]"
                          : isToday
                          ? "border-accent/25 bg-accent/[0.04]"
                          : "border-white/[0.05] bg-white/[0.015]"
                      }`}
                    >
                      <span
                        {...prov.dragHandleProps}
                        className="cursor-grab text-foreground/25 transition-colors hover:text-foreground/50"
                      >
                        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <button
                        onClick={() => onOpenDay(idx)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span className="w-8 font-mono text-xs text-foreground/40">{weekday}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-foreground/80">
                            {day ? day.title : "—"}
                          </span>
                          {day?.type === "retarget" && custom && (
                            <span className="block text-[11px] font-light text-accent/70">
                              {custom.areas.join(" + ")}
                            </span>
                          )}
                        </div>
                      </button>
                      {isToday && (
                        <div className="flex items-center gap-2">
                          {todayCompleted && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-accent">
                              <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> Done
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                            Today
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}