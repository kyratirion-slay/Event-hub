"use client";

import { MapPin, Users, Calendar, ArrowUpRight } from "lucide-react";

type Status = "in voorbereiding" | "bevestigd" | "afgerond" | "concept";

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  guests: number;
  status: Status;
  type: string;
  index: number;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  "in voorbereiding": { label: "In voorbereiding", color: "#c47a12" },
  bevestigd:          { label: "Bevestigd",         color: "#1a7a4a" },
  afgerond:           { label: "Afgerond",           color: "#888070" },
  concept:            { label: "Concept",            color: "#6040a0" },
};

export default function EventCard({ event }: { event: Event }) {
  const status = statusConfig[event.status];
  const num = String(event.index).padStart(2, "0");

  return (
    <div
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top bar: number + type */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "0.12em",
          }}
        >
          {event.type}
        </span>
        <span
          className="text-2xl leading-none"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            color: "rgba(0,0,0,0.08)",
            letterSpacing: "-0.02em",
          }}
        >
          ({num})
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        <h3
          className="text-2xl leading-tight mb-4"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
          }}
        >
          {event.name}
        </h3>

        {/* Meta */}
        <div className="space-y-1.5 mb-5">
          {[
            { icon: Calendar, text: event.date },
            { icon: MapPin,   text: event.location },
            { icon: Users,    text: `${event.guests} gasten` },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={12} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <span
              className="text-xs uppercase tracking-widest"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 700,
                color: status.color,
                letterSpacing: "0.1em",
              }}
            >
              {status.label}
            </span>
          </div>
          <button
            className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold transition-colors"
            style={{
              fontFamily: "var(--font-barlow)",
              color: "var(--red)",
              letterSpacing: "0.1em",
            }}
          >
            Open
            <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Event };
