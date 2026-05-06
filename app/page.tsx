import Sidebar from "@/components/Sidebar";
import EventCard, { type Event } from "@/components/EventCard";
import { Plus, Search, Bell, Filter } from "lucide-react";

const fakeEvents: Event[] = [
  {
    id: 1,
    name: "Strategie Offsite — Q3 Leadership",
    date: "12 juni 2025",
    location: "Het Scheepvaartmuseum, Amsterdam",
    guests: 34,
    status: "bevestigd",
    type: "Corporate Retreat",
    coverColor: "#e86fa3",
  },
  {
    id: 2,
    name: "Zomerborrel Tech & Talent",
    date: "27 juni 2025",
    location: "Rooftop NDSM, Amsterdam-Noord",
    guests: 120,
    status: "in voorbereiding",
    type: "Netwerkevent",
    coverColor: "#6e9fc8",
  },
  {
    id: 3,
    name: "Jaarlijks Klantendiner 2025",
    date: "18 september 2025",
    location: "Restaurant De Kas, Amsterdam",
    guests: 48,
    status: "concept",
    type: "Corporate Dinner",
    coverColor: "#a96ec8",
  },
  {
    id: 4,
    name: "Productlancering 'Nova'",
    date: "4 oktober 2025",
    location: "Westergasfabriek, Amsterdam",
    guests: 280,
    status: "in voorbereiding",
    type: "Lancering",
    coverColor: "#c86e6e",
  },
  {
    id: 5,
    name: "Team Retreat — Winter Edition",
    date: "5 december 2025",
    location: "Landgoed De Witte Berken, Drenthe",
    guests: 22,
    status: "concept",
    type: "Team Retreat",
    coverColor: "#6ec8b4",
  },
  {
    id: 6,
    name: "Nieuwjaarsreceptie 2025",
    date: "10 januari 2025",
    location: "Stadsschouwburg, Amsterdam",
    guests: 195,
    status: "afgerond",
    type: "Receptie",
    coverColor: "#8b8a7a",
  },
];

const stats = [
  { label: "Actieve events",       value: "5",  sub: "1 bevestigd" },
  { label: "Komende 30 dagen",     value: "2",  sub: "Zomerborrel & Offsite" },
  { label: "Openstaande taken",    value: "12", sub: "Verspreid over 5 events" },
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
            {fakeEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
