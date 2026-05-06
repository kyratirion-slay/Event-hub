import Sidebar from "@/components/Sidebar";
import EventCard, { type Event } from "@/components/EventCard";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

const fakeEvents: Omit<Event, "index">[] = [
  {
    id: 1,
    name: "Strategie Offsite Q3 Leadership",
    date: "12 juni 2025",
    location: "Het Scheepvaartmuseum, Amsterdam",
    guests: 34,
    status: "bevestigd",
    type: "Corporate Retreat",
  },
  {
    id: 2,
    name: "Zomerborrel Tech & Talent",
    date: "27 juni 2025",
    location: "Rooftop NDSM, Amsterdam-Noord",
    guests: 120,
    status: "in voorbereiding",
    type: "Netwerkevent",
  },
  {
    id: 3,
    name: "Jaarlijks Klantendiner 2025",
    date: "18 september 2025",
    location: "Restaurant De Kas, Amsterdam",
    guests: 48,
    status: "concept",
    type: "Corporate Dinner",
  },
  {
    id: 4,
    name: "Productlancering Nova",
    date: "4 oktober 2025",
    location: "Westergasfabriek, Amsterdam",
    guests: 280,
    status: "in voorbereiding",
    type: "Lancering",
  },
  {
    id: 5,
    name: "Team Retreat Winter Edition",
    date: "5 december 2025",
    location: "Landgoed De Witte Berken, Drenthe",
    guests: 22,
    status: "concept",
    type: "Team Retreat",
  },
  {
    id: 6,
    name: "Nieuwjaarsreceptie 2025",
    date: "10 januari 2025",
    location: "Stadsschouwburg, Amsterdam",
    guests: 195,
    status: "afgerond",
    type: "Receptie",
  },
];

const stats = [
  { num: "05", label: "Actieve\nEvents" },
  { num: "02", label: "Komende\n30 Dagen" },
  { num: "699", label: "Gasten\nTotaal" },
  { num: "01", label: "Afgerond\nDit Jaar" },
];

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>

        {/* Header */}
        <header
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-end gap-4">
            <h1
              className="text-5xl leading-none"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
              }}
            >
              Dashboard
            </h1>
            <span
              className="text-sm mb-1"
              style={{ color: "var(--muted)", fontFamily: "var(--font-inter)" }}
            >
              1 mei 2025
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--beige-dark)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              <Search size={13} />
              <span className="text-xs" style={{ fontFamily: "var(--font-barlow)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Zoeken
              </span>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 800,
                letterSpacing: "0.1em",
                backgroundColor: "var(--red)",
                color: "var(--beige)",
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Nieuw Event
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Stats */}
          <div className="grid grid-cols-4 border-b" style={{ borderColor: "var(--border)" }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="px-8 py-6 border-r"
                style={{ borderColor: "var(--border)", borderRightColor: i === 3 ? "transparent" : "var(--border)" }}
              >
                <div
                  className="text-6xl leading-none mb-2"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 900,
                    color: "var(--red)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.num}
                </div>
                <div
                  className="text-xs uppercase tracking-widest whitespace-pre-line"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 700,
                    color: "var(--muted)",
                    letterSpacing: "0.12em",
                    lineHeight: 1.5,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Events section */}
          <div className="px-8 py-6">
            {/* Section header */}
            <div
              className="flex items-center justify-between mb-6 pb-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  color: "var(--foreground)",
                }}
              >
                Alle Events
              </h2>
              <button
                className="flex items-center gap-1.5 text-xs uppercase tracking-widest px-3 py-1.5"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                <SlidersHorizontal size={11} />
                Filter
              </button>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-3 gap-4">
              {fakeEvents.map((event, i) => (
                <EventCard key={event.id} event={{ ...event, index: i + 1 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
