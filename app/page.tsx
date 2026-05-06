import Sidebar from "@/components/Sidebar";
import EventCard, { type Event } from "@/components/EventCard";
import { events as allEvents } from "@/lib/mockData";
import { Plus, Search, Bell, Filter } from "lucide-react";

const dashboardEvents: Event[] = allEvents.map((e) => ({
  id: e.id,
  name: e.name,
  date: e.date,
  location: e.location,
  guests: e.guests,
  status: e.status,
  type: e.type,
  coverColor: e.coverColor,
}));

const openTodosTotal = allEvents.reduce(
  (sum, e) => sum + e.todos.filter((t) => t.status !== "done").length,
  0
);
const activeCount = allEvents.filter((e) => e.status !== "afgerond").length;

const stats = [
  { label: "Actieve events",    value: String(activeCount), sub: "1 bevestigd" },
  { label: "Komende 30 dagen",  value: "2",                 sub: "Zomerborrel & Offsite" },
  { label: "Openstaande taken", value: String(openTodosTotal), sub: "Verspreid over actieve events" },
];

export default function DashboardPage() {
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
              Donderdag 1 mei 2025 — Welkom terug.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <Search size={14} />
              <span>Zoeken...</span>
            </div>
            <button
              className="relative p-2 rounded-lg"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
            >
              <Bell size={16} style={{ color: "var(--muted)" }} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              <Plus size={14} />
              Nieuw event
            </button>
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
                <div className="text-xs" style={{ color: "var(--muted)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Events header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Alle events
            </h2>
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--card)" }}
            >
              <Filter size={11} />
              Filter
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-4">
            {dashboardEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
