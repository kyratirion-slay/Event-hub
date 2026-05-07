"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import type { Event } from "@/lib/types";
import { Plus, MapPin, Users, Calendar, ArrowUpRight, Trash2, X } from "lucide-react";

// ─── DATE PARSING ─────────────────────────────────────────────────────────

const DUTCH_MONTHS: Record<string, number> = {
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5,
  juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function parseDateInfo(dateStr: string): { day: number; month: number; year: number } {
  const parts = dateStr.trim().split(/\s+/);
  let day = 0, month = -1, year = new Date().getFullYear();
  for (const part of parts) {
    const dayMatch = part.match(/^(\d+)/);
    if (dayMatch) day = parseInt(dayMatch[1], 10);
    const monthIdx = DUTCH_MONTHS[part.toLowerCase()];
    if (monthIdx !== undefined) month = monthIdx;
    if (/^\d{4}$/.test(part)) year = parseInt(part, 10);
  }
  return { day, month, year };
}

function groupEventsByMonth(events: Event[]) {
  const groups = new Map<string, { monthName: string; year: number; monthIdx: number; events: Event[] }>();
  for (const event of events) {
    const { day, month, year } = parseDateInfo(event.date);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (!groups.has(key)) {
      groups.set(key, {
        monthName: month >= 0 ? MONTH_NAMES[month] : "Onbekend",
        year,
        monthIdx: month >= 0 ? month : 12,
        events: [],
      });
    }
    groups.get(key)!.events.push({ ...event, _day: day } as Event & { _day: number });
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [, group] of sorted) {
    group.events.sort((a, b) =>
      parseDateInfo(a.date).day - parseDateInfo(b.date).day
    );
  }
  return sorted.map(([, g]) => g);
}

// ─── NEW EVENT MODAL ──────────────────────────────────────────────────────

const EVENT_TYPES = [
  "Bedrijfsevent", "Netwerkevent", "Congres", "Borrel", "Teambuilding",
  "Productlancering", "Award ceremony", "Sport- & outdoorevent", "Overig",
];

function NewEventModal({ onClose }: { onClose(): void }) {
  const store = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Bedrijfsevent");
  const [guests, setGuests] = useState("");

  const COVER_COLORS = ["#e86fa3", "#6e9fc8", "#a96ec8", "#6ec8b4", "#f59e0b", "#c86e6e", "#6dba8a"];
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const newId = store.events.length === 0 ? 1 : Math.max(...store.events.map((e) => e.id)) + 1;
    store.addEvent({
      name: name.trim(),
      date: date.trim() || "TBD",
      startTime: startTime.trim() || "",
      endTime: endTime.trim() || "",
      location: location.trim() || "",
      type: type.trim() || "Bedrijfsevent",
      guests: parseInt(guests) || 0,
      status: "concept",
      coverColor,
      totalBudget: 0,
      briefing: {
        concept: "", doelgroep: "", sfeerThema: "", format: "",
        bijzonderheden: "", dresscode: "", cateringWensen: "", avTechniek: "", vrijeNotities: "",
      },
      program: [],
      todos: [],
      budgetCategories: [],
      timeline: [],
      noteWindows: [],
    });
    router.push(`/events/${newId}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Nieuw event aanmaken</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={18} style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Eventnaam *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naam van het event"
              required
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Type event
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
            >
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Datum
            </label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="bv. 15 september 2026"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Starttijd
              </label>
              <input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00"
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Eindtijd
              </label>
              <input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="17:00"
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          {/* Location + Guests */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Locatie
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Stad of adres"
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
                Gasten
              </label>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          {/* Cover color */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
              Kleur
            </label>
            <div className="flex gap-2">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: coverColor === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              Aanmaken
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EVENT CARD ───────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const store = useStore();
  const [confirming, setConfirming] = useState(false);

  const openTodos = event.todos.filter((t) => t.status !== "done").length;

  if (confirming) {
    return (
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid #fca5a5",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate text-sm" style={{ color: "var(--foreground)" }}>{event.name}</div>
        </div>
        <span className="text-sm" style={{ color: "var(--muted)" }}>Weet je het zeker?</span>
        <button
          onClick={() => store.deleteEvent(event.id)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "#dc2626", color: "#fff" }}
        >
          Ja, verwijder
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1.5"
          style={{ color: "var(--muted)" }}
        >
          Annuleren
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-4 rounded-xl group relative transition-all hover:-translate-y-px hover:shadow-md"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <Link
        href={`/events/${event.id}`}
        className="flex items-center gap-4 flex-1 min-w-0 px-5 py-4"
      >
        {/* Color dot */}
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />

        {/* Name + type */}
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{event.type}</div>
          <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{event.name}</div>
        </div>

        {/* Meta — fixed-width columns */}
        <div className="hidden md:flex items-center gap-0 text-sm" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1.5 w-44 shrink-0">
            <Calendar size={12} className="shrink-0" />{event.date}
          </span>
          <span className="flex items-center gap-1.5 w-36 shrink-0">
            <MapPin size={12} className="shrink-0" />{event.location.split(",")[0] || "—"}
          </span>
          <span className="flex items-center gap-1.5 w-20 shrink-0">
            <Users size={12} className="shrink-0" />{event.guests}
          </span>
        </div>

        {/* Todos pill */}
        {openTodos > 0 && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: "rgba(232,111,163,0.12)", color: "var(--accent)" }}
          >
            {openTodos} taken
          </span>
        )}

        <ArrowUpRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Delete button — revealed on hover */}
      <button
        onClick={(e) => { e.preventDefault(); setConfirming(true); }}
        className="shrink-0 mr-3 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
        title="Event verwijderen"
      >
        <Trash2 size={14} style={{ color: "var(--muted)" }} />
      </button>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);

  const groups = groupEventsByMonth(store.events);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Events</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              {store.events.length} events
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={14} /> Nieuw event
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--muted)" }}>
              <p className="text-sm mb-4">Nog geen events. Maak je eerste event aan.</p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
              >
                <Plus size={14} /> Nieuw event
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <section key={`${group.year}-${group.monthIdx}`}>
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted)" }}
                >
                  {group.monthName} {group.year}
                </h2>
                <div className="space-y-2">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
