"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { events as initialEvents, suppliers as initialSuppliers, defaultEventLocatieSubcats, defaultSprekerSubcats } from "./mockData";
import type {
  Event, Todo, BudgetLineItem, EventBriefing, TimelineItem, ProgramItem, ProgramDay, Status, NoteWindow, Supplier,
} from "./types";

// Bump this to force localStorage reset when data structure changes
const STORAGE_VERSION = "4";

interface StoreContextType {
  events: Event[];
  // Event CRUD
  addEvent(event: Omit<Event, "id">): void;
  deleteEvent(eventId: number): void;
  // Event meta
  updateEventMeta(eventId: number, updates: Partial<Pick<Event, "name" | "date" | "startTime" | "endTime" | "location" | "guests" | "type" | "status">>): void;
  // Program days
  addProgramDay(eventId: number, label: string): void;
  removeProgramDay(eventId: number, dayId: number): void;
  renameProgramDay(eventId: number, dayId: number, label: string): void;
  // Program items (now scoped to a day)
  addProgramItem(eventId: number, dayId: number): void;
  updateProgramItem(eventId: number, dayId: number, index: number, updates: Partial<ProgramItem>): void;
  deleteProgramItem(eventId: number, dayId: number, index: number): void;
  reorderProgramItems(eventId: number, dayId: number, from: number, to: number): void;
  // Todos
  toggleTodo(eventId: number, todoId: number): void;
  addTodo(eventId: number, todo: Omit<Todo, "id">): void;
  updateTodo(eventId: number, todoId: number, updates: Partial<Omit<Todo, "id">>): void;
  deleteTodo(eventId: number, todoId: number): void;
  // Briefing
  updateBriefingField(eventId: number, field: keyof EventBriefing, value: string): void;
  updateBriefingOrder(eventId: number, order: Array<keyof EventBriefing>): void;
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
  // Suppliers
  suppliers: Supplier[];
  addSupplier(supplier: Omit<Supplier, "id">): void;
  updateSupplier(supplierId: number, updates: Partial<Omit<Supplier, "id">>): void;
  deleteSupplier(supplierId: number): void;
  // Supplier categories
  eventLocatieSubcats: string[];
  addEventLocatieSubcat(name: string): void;
  customSupplierCats: string[];
  addCustomSupplierCat(name: string): void;
  sprekerSubcats: string[];
  addSprekerSubcat(name: string): void;
}

const StoreContext = createContext<StoreContextType | null>(null);

function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function updateEvent(events: Event[], eventId: number, updater: (e: Event) => Event): Event[] {
  return events.map((e) => (e.id === eventId ? updater(e) : e));
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>(() => {
    if (typeof window === "undefined") return initialEvents;
    try {
      const version = localStorage.getItem("eventhub-version");
      if (version !== STORAGE_VERSION) return initialEvents;
      const stored = localStorage.getItem("eventhub-events");
      return stored ? JSON.parse(stored) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    if (typeof window === "undefined") return initialSuppliers;
    try {
      const version = localStorage.getItem("eventhub-version");
      if (version !== STORAGE_VERSION) return initialSuppliers;
      return loadFromStorage("eventhub-suppliers", initialSuppliers);
    } catch {
      return initialSuppliers;
    }
  });

  const [eventLocatieSubcats, setEventLocatieSubcats] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultEventLocatieSubcats;
    try {
      const version = localStorage.getItem("eventhub-version");
      if (version !== STORAGE_VERSION) return defaultEventLocatieSubcats;
      return loadFromStorage("eventhub-event-subcats", defaultEventLocatieSubcats);
    } catch {
      return defaultEventLocatieSubcats;
    }
  });

  const [customSupplierCats, setCustomSupplierCats] = useState<string[]>(() =>
    loadFromStorage("eventhub-custom-cats", [])
  );

  const [sprekerSubcats, setSprekerSubcats] = useState<string[]>(() =>
    loadFromStorage("eventhub-spreker-subcats", defaultSprekerSubcats)
  );

  useEffect(() => {
    try {
      localStorage.setItem("eventhub-version", STORAGE_VERSION);
      localStorage.setItem("eventhub-events", JSON.stringify(events));
      localStorage.setItem("eventhub-suppliers", JSON.stringify(suppliers));
      localStorage.setItem("eventhub-event-subcats", JSON.stringify(eventLocatieSubcats));
      localStorage.setItem("eventhub-custom-cats", JSON.stringify(customSupplierCats));
      localStorage.setItem("eventhub-spreker-subcats", JSON.stringify(sprekerSubcats));
    } catch { /* ignore */ }
  }, [events, suppliers, eventLocatieSubcats, customSupplierCats, sprekerSubcats]);

  // ─── Event CRUD ────────────────────────────────────────────────────────

  const addEvent = useCallback((event: Omit<Event, "id">) => {
    setEvents((prev) => [...prev, { ...event, id: nextId(prev) }]);
  }, []);

  const deleteEvent = useCallback((eventId: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  const updateEventMeta = useCallback((
    eventId: number,
    updates: Partial<Pick<Event, "name" | "date" | "startTime" | "endTime" | "location" | "guests" | "type" | "status">>
  ) => {
    setEvents((prev) => updateEvent(prev, eventId, (e) => ({ ...e, ...updates })));
  }, []);

  // ─── Program days ──────────────────────────────────────────────────────

  const addProgramDay = useCallback((eventId: number, label: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: [...e.program, { id: nextId(e.program), label, items: [] }],
      }))
    );
  }, []);

  const removeProgramDay = useCallback((eventId: number, dayId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.filter((d) => d.id !== dayId),
      }))
    );
  }, []);

  const renameProgramDay = useCallback((eventId: number, dayId: number, label: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.map((d) => (d.id === dayId ? { ...d, label } : d)),
      }))
    );
  }, []);

  // ─── Program items ─────────────────────────────────────────────────────

  const addProgramItem = useCallback((eventId: number, dayId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.map((d) =>
          d.id === dayId
            ? { ...d, items: [...d.items, { time: "", title: "", notes: "" }] }
            : d
        ),
      }))
    );
  }, []);

  const updateProgramItem = useCallback((eventId: number, dayId: number, index: number, updates: Partial<ProgramItem>) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.map((d) => {
          if (d.id !== dayId) return d;
          const items = [...d.items];
          items[index] = { ...items[index], ...updates };
          return { ...d, items };
        }),
      }))
    );
  }, []);

  const deleteProgramItem = useCallback((eventId: number, dayId: number, index: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.map((d) =>
          d.id === dayId ? { ...d, items: d.items.filter((_, i) => i !== index) } : d
        ),
      }))
    );
  }, []);

  const reorderProgramItems = useCallback((eventId: number, dayId: number, from: number, to: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        program: e.program.map((d) => {
          if (d.id !== dayId) return d;
          const items = [...d.items];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          return { ...d, items };
        }),
      }))
    );
  }, []);

  // ─── Todos ─────────────────────────────────────────────────────────────

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

  // ─── Briefing ──────────────────────────────────────────────────────────

  const updateBriefingField = useCallback((eventId: number, field: keyof EventBriefing, value: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        briefing: { ...e.briefing, [field]: value },
      }))
    );
  }, []);

  const updateBriefingOrder = useCallback((eventId: number, order: Array<keyof EventBriefing>) => {
    setEvents((prev) => updateEvent(prev, eventId, (e) => ({ ...e, briefingFieldOrder: order })));
  }, []);

  // ─── Budget ────────────────────────────────────────────────────────────

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

  // ─── Note windows ──────────────────────────────────────────────────────

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

  // ─── Timeline ──────────────────────────────────────────────────────────

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

  // ─── Suppliers ─────────────────────────────────────────────────────────

  const addSupplier = useCallback((supplier: Omit<Supplier, "id">) => {
    setSuppliers((prev) => [...prev, { ...supplier, id: nextId(prev) }]);
  }, []);

  const updateSupplier = useCallback((supplierId: number, updates: Partial<Omit<Supplier, "id">>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSupplier = useCallback((supplierId: number) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  }, []);

  const addEventLocatieSubcat = useCallback((name: string) => {
    setEventLocatieSubcats((prev) => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const addCustomSupplierCat = useCallback((name: string) => {
    setCustomSupplierCats((prev) => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const addSprekerSubcat = useCallback((name: string) => {
    setSprekerSubcats((prev) => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  return (
    <StoreContext.Provider value={{
      events,
      addEvent, deleteEvent, updateEventMeta,
      addProgramDay, removeProgramDay, renameProgramDay,
      addProgramItem, updateProgramItem, deleteProgramItem, reorderProgramItems,
      toggleTodo, addTodo, updateTodo, deleteTodo,
      updateBriefingField, updateBriefingOrder,
      updateTotalBudget, addBudgetCategory, renameBudgetCategory, deleteBudgetCategory,
      addBudgetItem, updateBudgetItem, deleteBudgetItem,
      addNoteWindow, updateNoteWindow, deleteNoteWindow,
      toggleTimelineItem, addTimelineItem, updateTimelineItem, deleteTimelineItem, adoptSuggestion,
      suppliers, addSupplier, updateSupplier, deleteSupplier,
      eventLocatieSubcats, addEventLocatieSubcat,
      customSupplierCats, addCustomSupplierCat,
      sprekerSubcats, addSprekerSubcat,
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
