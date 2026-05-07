"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import EventCard from "@/components/EventCard";
import { useStore } from "@/lib/store";
import { Plus, Search, Bell, X, Circle, CheckCircle2, Trash2, CalendarClock } from "lucide-react";

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

const DUTCH_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
  januari: 0, februari: 1, maart: 2, april: 3, juni: 5,
  juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};

function parseEventDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(/\s+/);
  let day = 0, month = -1, year = new Date().getFullYear();
  for (const part of parts) {
    const dayMatch = part.match(/^(\d+)/);
    if (dayMatch) day = parseInt(dayMatch[1], 10);
    const monthIdx = DUTCH_MONTHS[part.toLowerCase()];
    if (monthIdx !== undefined) month = monthIdx;
    if (/^\d{4}$/.test(part)) year = parseInt(part, 10);
  }
  if (day === 0 || month === -1) return null;
  return new Date(year, month, day);
}

function parseDutchDeadline(deadline: string | undefined, eventDate: string): Date | null {
  if (!deadline) return null;
  const parts = deadline.trim().split(" ");
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const mon = DUTCH_MONTHS[parts[1].toLowerCase()];
  if (isNaN(day) || mon === undefined) return null;
  const eventParts = eventDate.split(" ");
  const year = eventParts.length >= 3 ? parseInt(eventParts[2], 10) : new Date().getFullYear();
  return new Date(year, mon, day);
}

// ─── GLOBAL TODOS WIDGET ──────────────────────────────────────────────────────

function GlobalTodosWidget() {
  const store = useStore();
  const [tab, setTab] = useState<"open" | "voltooid">("open");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [targetEventId, setTargetEventId] = useState<number | "">("");

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // "Komende week" tab: todos with deadline in next 7 days (open + done), plus a few open ones without deadline
  const upcoming = store.events
    .filter((e) => e.status !== "afgerond")
    .flatMap((e) =>
      e.todos
        .filter((t) => {
          const d = parseDutchDeadline(t.deadline, e.date);
          return d !== null && d >= today && d <= nextWeek;
        })
        .map((t) => ({ ...t, eventId: e.id, eventName: e.name, coverColor: e.coverColor }))
    )
    .sort((a, b) => {
      const da = parseDutchDeadline(a.deadline, "")?.getTime() ?? Infinity;
      const db = parseDutchDeadline(b.deadline, "")?.getTime() ?? Infinity;
      return da - db;
    });

  const allOpen = store.events
    .filter((e) => e.status !== "afgerond")
    .flatMap((e) =>
      e.todos
        .filter((t) => t.status === "open" && !t.deadline)
        .slice(0, 2)
        .map((t) => ({ ...t, eventId: e.id, eventName: e.name, coverColor: e.coverColor }))
    );

  const displayTodos = [...upcoming, ...allOpen].slice(0, 10);

  // "Voltooid" tab: all done todos across non-finished events
  const doneTodos = store.events
    .filter((e) => e.status !== "afgerond")
    .flatMap((e) =>
      e.todos
        .filter((t) => t.status === "done")
        .map((t) => ({ ...t, eventId: e.id, eventName: e.name, coverColor: e.coverColor }))
    );

  function addTodo() {
    if (!newText.trim() || !targetEventId) return;
    store.addTodo(Number(targetEventId), {
      text: newText.trim(),
      status: "open",
      deadline: newDeadline.trim() || undefined,
      category: "Algemeen",
    });
    setNewText(""); setNewDeadline(""); setTargetEventId(""); setAdding(false);
  }

  function TodoRow({ todo, i, total }: { todo: typeof displayTodos[0]; i: number; total: number }) {
    const done = todo.status === "done";
    return (
      <div
        key={`${todo.eventId}-${todo.id}`}
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: i < total - 1 ? "1px solid var(--border)" : "none" }}
      >
        <button
          onClick={() => store.toggleTodo(todo.eventId, todo.id)}
          className="shrink-0 transition-opacity hover:opacity-70"
        >
          {done
            ? <CheckCircle2 size={15} style={{ color: "#10b981" }} />
            : <Circle size={15} style={{ color: "var(--border)" }} />
          }
        </button>
        <span
          className="flex-1 text-sm truncate"
          style={{
            color: done ? "var(--muted)" : "var(--foreground)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {todo.text}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${todo.coverColor}22`, color: todo.coverColor }}
          >
            {todo.eventName.split(" ")[0]}
          </span>
          {todo.deadline && !done && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>{todo.deadline}</span>
          )}
          <button
            onClick={() => store.deleteTodo(todo.eventId, todo.id)}
            className="opacity-30 hover:opacity-100 transition-opacity"
            title="Verwijderen"
          >
            <Trash2 size={12} style={{ color: "var(--muted)" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab("open")}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={tab === "open"
              ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)" }
              : { color: "var(--muted)" }
            }
          >
            <CalendarClock size={12} />
            Komende week
          </button>
          <button
            onClick={() => setTab("voltooid")}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={tab === "voltooid"
              ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)" }
              : { color: "var(--muted)" }
            }
          >
            <CheckCircle2 size={12} />
            Voltooid {doneTodos.length > 0 && `(${doneTodos.length})`}
          </button>
        </div>
        {tab === "open" && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            <Plus size={12} /> Taak
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
          <input
            autoFocus
            placeholder="Omschrijving taak..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTodo(); if (e.key === "Escape") setAdding(false); }}
            className="w-full text-sm outline-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
          <div className="flex gap-2">
            <input
              placeholder="Deadline (bv. 15 jun)"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            />
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(Number(e.target.value) || "")}
              className="flex-1 text-xs outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: targetEventId ? "var(--foreground)" : "var(--muted)" }}
            >
              <option value="">Kies event...</option>
              {store.events.filter((e) => e.status !== "afgerond").map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTodo}
              disabled={!newText.trim() || !targetEventId}
              className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              Toevoegen
            </button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1.5" style={{ color: "var(--muted)" }}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Tab: open */}
      {tab === "open" && (
        displayTodos.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: "#10b981" }} />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Geen openstaande taken deze week.</p>
          </div>
        ) : (
          <div>
            {displayTodos.map((todo, i) => (
              <TodoRow key={`${todo.eventId}-${todo.id}`} todo={todo} i={i} total={displayTodos.length} />
            ))}
          </div>
        )
      )}

      {/* Tab: voltooid */}
      {tab === "voltooid" && (
        doneTodos.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Circle size={22} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nog geen voltooide taken.</p>
          </div>
        ) : (
          <div>
            {doneTodos.map((todo, i) => (
              <TodoRow key={`${todo.eventId}-${todo.id}`} todo={todo} i={i} total={doneTodos.length} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const store = useStore();
  const [eventSearch, setEventSearch] = useState("");

  const dashboardEvents = store.events
    .filter((e) => {
      if (!eventSearch.trim()) return true;
      const q = eventSearch.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    })
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      guests: e.guests,
      status: e.status,
      type: e.type,
      coverColor: e.coverColor,
    }));

  const today = new Date();
  const in30 = new Date(today);
  in30.setDate(today.getDate() + 30);

  const komende30 = store.events.filter((e) => {
    if (e.status === "afgerond") return false;
    const d = parseEventDate(e.date);
    return d !== null && d >= today && d <= in30;
  });

  const openTodosTotal = store.events.reduce(
    (sum, e) => sum + e.todos.filter((t) => t.status !== "done").length,
    0
  );
  const activeCount = store.events.filter((e) => e.status !== "afgerond").length;
  const bevestigdCount = store.events.filter((e) => e.status === "bevestigd").length;

  const komende30Sub = komende30.length === 0
    ? "Geen events de komende maand"
    : komende30.map((e) => e.name).join(", ");

  const stats = [
    { label: "Actieve events",    value: String(activeCount),       sub: bevestigdCount > 0 ? `${bevestigdCount} bevestigd` : "In voorbereiding" },
    { label: "Komende 30 dagen",  value: String(komende30.length),  sub: komende30Sub },
    { label: "Openstaande taken", value: String(openTodosTotal),    sub: "Verspreid over actieve events" },
  ];

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Welkom terug.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
            >
              <Bell size={16} style={{ color: "var(--muted)" }} />
            </button>
            <Link
              href="/events"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              <Plus size={14} />
              Nieuw event
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-5"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{stat.label}</div>
                <div className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{stat.value}</div>
                <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Two-column layout: events + global todos */}
          <div className="grid grid-cols-3 gap-6">
            {/* Events — 2/3 width */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Alle events
                </h2>
              </div>

              {/* Search bar */}
              <div className="relative mb-4">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Zoek op naam, type of locatie..."
                  className="w-full text-sm pl-9 pr-9 py-2 rounded-lg outline-none"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}
                />
                {eventSearch && (
                  <button
                    onClick={() => setEventSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X size={12} style={{ color: "var(--muted)" }} />
                  </button>
                )}
              </div>

              {dashboardEvents.length === 0 ? (
                <div className="py-12 text-center rounded-xl" style={{ border: "1px dashed var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                    Geen events gevonden voor &ldquo;{eventSearch}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {dashboardEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            {/* Global todos — 1/3 width */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
                Taken
              </h2>
              <GlobalTodosWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
