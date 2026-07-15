"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CommPlanEditor from "@/components/CommPlan";
import { useStore } from "@/lib/store";
import { daysFromToday } from "@/lib/communication";
import { Send, ChevronRight } from "lucide-react";

export default function CommunicatiePage() {
  const store = useStore();

  const activeEvents = store.events.filter((e) => e.status !== "afgerond");

  // Sorteer: events met de meest urgente open stap eerst, events zonder plan achteraan
  const sorted = [...activeEvents].sort((a, b) => {
    const urgency = (e: typeof a) => {
      const open = (e.commSteps ?? []).filter((s) => !s.done);
      if (e.commSteps === undefined || open.length === 0) return Infinity;
      return Math.min(...open.map((s) => daysFromToday(s.date)));
    };
    return urgency(a) - urgency(b);
  });

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
            <h1 className="text-xl font-semibold flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
              <Send size={18} style={{ color: "var(--accent)" }} />
              Communicatie
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              De communicatielijnen van al je events — van uitnodiging tot laatste info-mail.
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {sorted.length === 0 ? (
            <div className="py-16 text-center rounded-xl" style={{ border: "1px dashed var(--border)" }}>
              <Send size={24} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                Geen actieve events. Maak eerst een event aan.
              </p>
            </div>
          ) : (
            <div className="space-y-8 max-w-3xl">
              {sorted.map((event) => (
                <section key={event.id}>
                  {/* Event header — kleur van het event voor duidelijke scheiding */}
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 rounded-t-xl px-5 py-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: `${event.coverColor}1a`, border: `1px solid ${event.coverColor}40`, borderBottom: "none" }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />
                    <span className="text-sm font-bold flex-1" style={{ color: event.coverColor }}>
                      {event.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{event.date}</span>
                    <ChevronRight size={14} style={{ color: event.coverColor }} />
                  </Link>
                  <CommPlanEditor eventId={event.id} />
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
