"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { events as initialEvents } from "./mockData";
import type {
  Event, Todo, BudgetLineItem, EventBriefing, TimelineItem, ProgramItem, Status, NoteWindow,
} from "./types";

interface StoreContextType {
  events: Event[];
  // Event meta (header fields)
  updateEventMeta(eventId: number, updates: Partial<Pick<Event, "name" | "date" | "startTime" | "endTime" | "location" | "guests" | "type" | "status">>): void;
  // Program
  addProgramItem(eventId: number): void;
  updateProgramItem(eventId: number, index: number, updates: Partial<ProgramItem>): void;
  deleteProgramItem(eventId: number, index: number): void;
  reorderProgramItems(eventId: number, from: number, to: number): void;
  // Todos
  toggleTodo(eventId: number, todoId: number): void;
  addTodo(eventId: number, todo: Omit<Todo, "id">): void;
  updateTodo(eventId: number, todoId: number, updates: Partial<Omit<Todo, "id">>): void;
  deleteTodo(eventId: number, todoId: number): void;
  // Briefing
  updateBriefingField(eventId: number, field: keyof EventBriefing, value: string): void;
  // Budget
  updateTotalBudget(eventId: number, totalBudget: number): void;
  addBudgetCategory(eventId: number, name: string): void;
  renameBudgetCategory(eventId: number, categoryId: number, name: string): void;
  deleteBudgetCategory(eventId: number, categoryId: number): void;
  addBudgetItem(eventId: number, categoryId: number): void;
  updateBudgetItem(eventId: number, categoryId: number, itemId: number, updates: Partial<Omit<BudgetLineItem, "id">>): void;
  deleteBudgetItem(eventId: number, categoryId: number, itemId: number): void;
  // Note windows
  addNoteWindow(eventId: number, win: Omit<NoteWindow, "id">): void;
  updateNoteWindow(eventId: number, winId: number, updates: Partial<Omit<NoteWindow, "id">>): void;
  deleteNoteWindow(eventId: number, winId: number): void;
  // Timeline
  toggleTimelineItem(eventId: number, itemId: number): void;
  addTimelineItem(eventId: number, item: Omit<TimelineItem, "id">): void;
  updateTimelineItem(eventId: number, itemId: number, updates: Partial<Omit<TimelineItem, "id">>): void;
  deleteTimelineItem(eventId: number, itemId: number): void;
  adoptSuggestion(eventId: number, suggestion: Omit<TimelineItem, "id" | "type">): void;
}

const StoreContext = createContext<StoreContextType | null>(null);

function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function updateEvent(events: Event[], eventId: number, updater: (e: Event) => Event): Event[] {
  return events.map((e) => (e.id === eventId ? updater(e) : e));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>(() => {
    if (typeof window === "undefined") return initialEvents;
    try {
      const stored = localStorage.getItem("eventhub-events");
      return stored ? JSON.parse(stored) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("eventhub-events", JSON.stringify(events));
    } catch { /* ignore */ }
  }, [events]);

  const updateEventMeta = useCallback((
    eventId: number,
    updates: Partial<Pick<Event, "name" | "date" | "startTime" | "endTime" | "location" | "guests" | "type" | "status">>
  ) => {
    setEvents((prev) => updateEvent(prev, eventId, (e) => ({ ...e, ...updates })));
  }, []);

  const addProgramItem = useCallback((eventId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: [...e.program, { time: "", title: "", notes: "" }],
      }))
    );
  }, []);

  const updateProgramItem = useCallback((eventId: number, index: number, updates: Partial<ProgramItem>) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => {
        const program = [...e.program];
        program[index] = { ...program[index], ...updates };
        return { ...e, program };
      })
    );
  }, []);

  const deleteProgramItem = useCallback((eventId: number, index: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.filter((_, i) => i !== index),
      }))
    );
  }, []);

  const reorderProgramItems = useCallback((eventId: number, from: number, to: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => {
        const program = [...e.program];
        const [moved] = program.splice(from, 1);
        program.splice(to, 0, moved);
        return { ...e, program };
      })
    );
  }, []);

  const toggleTodo = useCallback((eventId: number, todoId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        todos: e.todos.map((t) =>
          t.id === todoId ? { ...t, status: t.status === "done" ? "open" : "done" } : t
        ) as Todo[],
      }))
    );
  }, []);

  const addTodo = useCallback((eventId: number, todo: Omit<Todo, "id">) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        todos: [...e.todos, { ...todo, id: nextId(e.todos) }],
      }))
    );
  }, []);

  const updateTodo = useCallback((eventId: number, todoId: number, updates: Partial<Omit<Todo, "id">>) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        todos: e.todos.map((t) => (t.id === todoId ? { ...t, ...updates } : t)),
      }))
    );
  }, []);

  const deleteTodo = useCallback((eventId: number, todoId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        todos: e.todos.filter((t) => t.id !== todoId),
      }))
    );
  }, []);

  const updateBriefingField = useCallback((eventId: number, field: keyof EventBriefing, value: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        briefing: { ...e.briefing, [field]: value },
      }))
    );
  }, []);

  const updateTotalBudget = useCallback((eventId: number, totalBudget: number) => {
    setEvents((prev) => updateEvent(prev, eventId, (e) => ({ ...e, totalBudget })));
  }, []);

  const addBudgetCategory = useCallback((eventId: number, name: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: [...e.budgetCategories, { id: nextId(e.budgetCategories), name, items: [] }],
      }))
    );
  }, []);

  const renameBudgetCategory = useCallback((eventId: number, categoryId: number, name: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) => (c.id === categoryId ? { ...c, name } : c)),
      }))
    );
  }, []);

  const deleteBudgetCategory = useCallback((eventId: number, categoryId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.filter((c) => c.id !== categoryId),
      }))
    );
  }, []);

  const addBudgetItem = useCallback((eventId: number, categoryId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) =>
          c.id === categoryId
            ? { ...c, items: [...c.items, { id: nextId(c.items), description: "", amountExclVat: 0, vatRate: 21 }] }
            : c
        ),
      }))
    );
  }, []);

  const updateBudgetItem = useCallback((
    eventId: number, categoryId: number, itemId: number,
    updates: Partial<Omit<BudgetLineItem, "id">>
  ) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)) }
            : c
        ),
      }))
    );
  }, []);

  const deleteBudgetItem = useCallback((eventId: number, categoryId: number, itemId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) =>
          c.id === categoryId ? { ...c, items: c.items.filter((item) => item.id !== itemId) } : c
        ),
      }))
    );
  }, []);

  const addNoteWindow = useCallback((eventId: number, win: Omit<NoteWindow, "id">) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => {
        const windows = e.noteWindows ?? [];
        return { ...e, noteWindows: [...windows, { ...win, id: nextId(windows) }] };
      })
    );
  }, []);

  const updateNoteWindow = useCallback((eventId: number, winId: number, updates: Partial<Omit<NoteWindow, "id">>) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        noteWindows: (e.noteWindows ?? []).map((w) => (w.id === winId ? { ...w, ...updates } : w)),
      }))
    );
  }, []);

  const deleteNoteWindow = useCallback((eventId: number, winId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        noteWindows: (e.noteWindows ?? []).filter((w) => w.id !== winId),
      }))
    );
  }, []);

  const toggleTimelineItem = useCallback((eventId: number, itemId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: e.timeline.map((t) => (t.id === itemId ? { ...t, done: !t.done } : t)),
      }))
    );
  }, []);

  const addTimelineItem = useCallback((eventId: number, item: Omit<TimelineItem, "id">) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: [...e.timeline, { ...item, id: nextId(e.timeline) }],
      }))
    );
  }, []);

  const updateTimelineItem = useCallback((eventId: number, itemId: number, updates: Partial<Omit<TimelineItem, "id">>) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: e.timeline.map((t) => (t.id === itemId ? { ...t, ...updates } : t)),
      }))
    );
  }, []);

  const deleteTimelineItem = useCallback((eventId: number, itemId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: e.timeline.filter((t) => t.id !== itemId),
      }))
    );
  }, []);

  const adoptSuggestion = useCallback((eventId: number, suggestion: Omit<TimelineItem, "id" | "type">) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: [...e.timeline, { ...suggestion, id: nextId(e.timeline), type: "user" as const }],
      }))
    );
  }, []);

  return (
    <StoreContext.Provider value={{
      events,
      updateEventMeta,
      addProgramItem, updateProgramItem, deleteProgramItem, reorderProgramItems,
      toggleTodo, addTodo, updateTodo, deleteTodo,
      updateBriefingField,
      updateTotalBudget, addBudgetCategory, renameBudgetCategory, deleteBudgetCategory,
      addBudgetItem, updateBudgetItem, deleteBudgetItem,
      addNoteWindow, updateNoteWindow, deleteNoteWindow,
      toggleTimelineItem, addTimelineItem, updateTimelineItem, deleteTimelineItem, adoptSuggestion,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
