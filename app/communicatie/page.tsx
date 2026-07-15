"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CommPlanEditor from "@/components/CommPlan";
import { useStore } from "@/lib/store";
import { daysFromToday, formatIsoDate } from "@/lib/communication";
import type { Event } from "@/lib/types";
import { Send, ChevronRight, ChevronDown, ArrowUpRight } from "lucide-react";

// Hoe urgent is het meest urgente open stapje van dit event? (Infinity = geen open stappen)
function urgency(e: Event): number {
  const open = (e.commSteps ?? []).filter((s) => !s.done);
  if (e.commSteps === undefined || open.length === 0) return Infinity;
  return Math.min(...open.map((s) => daysFromToday(s.date)));
}

export default function CommunicatiePage() {
  const store = useStore();

  const activeEvents = store.events.filter((e) => e.status !== "afgerond");
  const sorted = [...activeEvents].sort((a, b) => urgency(a) - urgency(b));

  // Standaard alleen events met een stap binnen 7 dagen (of te laat) opengeklapt
  const [openIds, setOpenIds] = useState<Set<number>>(
    () => new Set(activeEvents.filter((e) => urgency(e) <= 7).map((e) => e.id))
  );

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
            <div className="space-y-4 max-w-3xl">
              {sorted.map((event) => {
                const isOpen = openIds.has(event.id);
                const openSteps = (event.commSteps ?? [])
                  .filter((s) => !s.done)
                  .sort((a, b) => a.date.localeCompare(b.date));
                const next = openSteps[0];
                const urg = urgency(event);

                return (
                  <section key={event.id}>
                    {/* Klikbare event header — in/uitklappen */}
                    <div
                      onClick={() => toggle(event.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none transition-opacity hover:opacity-90 ${isOpen ? "rounded-t-xl" : "rounded-xl"}`}
                      style={{
                        backgroundColor: `${event.coverColor}1a`,
                        border: `1px solid ${event.coverColor}40`,
                        borderBottom: isOpen ? "none" : `1px solid ${event.coverColor}40`,
                      }}
                    >
                      {isOpen
                        ? <ChevronDown size={15} className="shrink-0" style={{ color: event.coverColor }} />
                        : <ChevronRight size={15} className="shrink-0" style={{ color: event.coverColor }} />
                      }
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.coverColor }} />
                      <span className="text-sm font-bold shrink-0" style={{ color: event.coverColor }}>
                        {event.name}
                      </span>

                      {/* Samenvatting bij ingeklapt */}
                      {!isOpen && (
                        <span className="flex-1 text-xs text-left truncate" style={{ color: "var(--muted)" }}>
                          {event.commSteps === undefined
                            ? "Nog geen communicatieplan"
                            : openSteps.length === 0
                              ? "Alles afgerond ✓"
                              : <>Volgende: {next.title} · {formatIsoDate(next.date)}</>
                          }
                        </span>
                      )}
                      {isOpen && <span className="flex-1" />}

                      {/* Badges rechts */}
                      {openSteps.length > 0 && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                          style={
                            urg < 0
                              ? { backgroundColor: "rgba(220,38,38,0.12)", color: "#dc2626" }
                              : urg <= 7
                                ? { backgroundColor: "rgba(217,119,6,0.12)", color: "#d97706" }
                                : { backgroundColor: `${event.coverColor}30`, color: event.coverColor }
                          }
                        >
                          {urg < 0 ? "te laat" : urg === 0 ? "vandaag" : `${openSteps.length} open`}
                        </span>
                      )}
                      <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{event.date}</span>
                      <Link
                        href={`/events/${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 hover:opacity-70 transition-opacity"
                        title="Naar event"
                      >
                        <ArrowUpRight size={14} style={{ color: event.coverColor }} />
                      </Link>
                    </div>

                    {/* Uitgeklapt: het volledige plan */}
                    {isOpen && <CommPlanEditor eventId={event.id} />}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
