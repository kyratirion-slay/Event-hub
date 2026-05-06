"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { events as initialEvents } from "./mockData";
import type {
  Event, Todo, BudgetCategory, BudgetLineItem, EventBriefing, TimelineItem,
} from "./types";

interface StoreContextType {
  events: Event[];
  // Todos
  toggleTodo(eventId: number, todoId: number): void;
  addTodo(eventId: number, todo: Omit<Todo, "id">): void;
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
  // Timeline
  toggleTimelineItem(eventId: number, itemId: number): void;
  addTimelineItem(eventId: number, item: Omit<TimelineItem, "id">): void;
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
    } catch {
      // ignore storage errors
    }
  }, [events]);

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
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({ ...e, totalBudget }))
    );
  }, []);

  const addBudgetCategory = useCallback((eventId: number, name: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: [
          ...e.budgetCategories,
          { id: nextId(e.budgetCategories), name, items: [] },
        ],
      }))
    );
  }, []);

  const renameBudgetCategory = useCallback((eventId: number, categoryId: number, name: string) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) =>
          c.id === categoryId ? { ...c, name } : c
        ),
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
            ? {
                ...c,
                items: [
                  ...c.items,
                  { id: nextId(c.items), description: "", amountExclVat: 0, vatRate: 21 },
                ],
              }
            : c
        ),
      }))
    );
  }, []);

  const updateBudgetItem = useCallback(
    (eventId: number, categoryId: number, itemId: number, updates: Partial<Omit<BudgetLineItem, "id">>) => {
      setEvents((prev) =>
        updateEvent(prev, eventId, (e) => ({
          ...e,
          budgetCategories: e.budgetCategories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  items: c.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : c
          ),
        }))
      );
    },
    []
  );

  const deleteBudgetItem = useCallback((eventId: number, categoryId: number, itemId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        budgetCategories: e.budgetCategories.map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
            : c
        ),
      }))
    );
  }, []);

  const toggleTimelineItem = useCallback((eventId: number, itemId: number) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: e.timeline.map((t) =>
          t.id === itemId ? { ...t, done: !t.done } : t
        ),
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

  const adoptSuggestion = useCallback((eventId: number, suggestion: Omit<TimelineItem, "id" | "type">) => {
    setEvents((prev) =>
      updateEvent(prev, eventId, (e) => ({
        ...e,
        timeline: [
          ...e.timeline,
          { ...suggestion, id: nextId(e.timeline), type: "user" as const },
        ],
      }))
    );
  }, []);

  return (
    <StoreContext.Provider
      value={{
        events,
        toggleTodo,
        addTodo,
        deleteTodo,
        updateBriefingField,
        updateTotalBudget,
        addBudgetCategory,
        renameBudgetCategory,
        deleteBudgetCategory,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        toggleTimelineItem,
        addTimelineItem,
        adoptSuggestion,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
