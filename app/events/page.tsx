import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { events } from "@/lib/mockData";
import { Plus, MapPin, Users, Calendar, Filter, ArrowUpRight } from "lucide-react";

const statusConfig = {
  "in voorbereiding": { label: "In voorbereiding", bg: "rgba(251,191,36,0.12)", text: "#b45309", dot: "#f59e0b" },
  bevestigd:          { label: "Bevestigd",         bg: "rgba(52,211,153,0.12)",  text: "#065f46", dot: "#10b981" },
  afgerond:           { label: "Afgerond",           bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8" },
  concept:            { label: "Concept",            bg: "rgba(167,139,250,0.12)", text: "#5b21b6", dot: "#8b5cf6" },
} as const;

export default function EventsPage() {
  const active = events.filter((e) => e.status !== "afgerond");
  const done   = events.filter((e) => e.status === "afgerond");

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
              {active.length} actief · {done.length} afgerond
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--background)" }}
            >
              <Filter size={12} /> Filter
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              <Plus size={14} /> Nieuw event
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-10">
          {/* Active events */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
              Actief
            </h2>
            <div className="space-y-2">
              {active.map((event) => {
                const st = statusConfig[event.status];
                const openTodos = event.todos.filter((t) => t.status !== "done").length;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl group transition-all hover:-translate-y-px hover:shadow-md"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Color dot */}
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />

                    {/* Name + type */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{event.type}</div>
                      <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{event.name}</div>
                    </div>

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--muted)" }}>
                      <span className="flex items-center gap-1.5"><Calendar size={12} />{event.date}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} />{event.location.split(",")[0]}</span>
                      <span className="flex items-center gap-1.5"><Users size={12} />{event.guests}</span>
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

                    {/* Status */}
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: st.bg, color: st.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                      {st.label}
                    </span>

                    <ArrowUpRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Completed events */}
          {done.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
                Afgerond
              </h2>
              <div className="space-y-2">
                {done.map((event) => {
                  const st = statusConfig[event.status];
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-4 px-5 py-4 rounded-xl group transition-all hover:shadow-sm opacity-60 hover:opacity-80"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{event.type}</div>
                        <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{event.name}</div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--muted)" }}>
                        <span className="flex items-center gap-1.5"><Calendar size={12} />{event.date}</span>
                        <span className="flex items-center gap-1.5"><Users size={12} />{event.guests} gasten</span>
                      </div>
                      <span
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                        {st.label}
                      </span>
                      <ArrowUpRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
