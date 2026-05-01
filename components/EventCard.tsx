"use client";

import { MapPin, Users, Calendar, ArrowRight } from "lucide-react";

type Status = "in voorbereiding" | "bevestigd" | "afgerond" | "concept";

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  guests: number;
  status: Status;
  type: string;
  coverColor: string;
}

const statusConfig: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  "in voorbereiding": {
    label: "In voorbereiding",
    bg: "rgba(251,191,36,0.12)",
    text: "#b45309",
    dot: "#f59e0b",
  },
  bevestigd: {
    label: "Bevestigd",
    bg: "rgba(52,211,153,0.12)",
    text: "#065f46",
    dot: "#10b981",
  },
  afgerond: {
    label: "Afgerond",
    bg: "rgba(148,163,184,0.12)",
    text: "#475569",
    dot: "#94a3b8",
  },
  concept: {
    label: "Concept",
    bg: "rgba(167,139,250,0.12)",
    text: "#5b21b6",
    dot: "#8b5cf6",
  },
};

export default function EventCard({ event }: { event: Event }) {
  const status = statusConfig[event.status];

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: "var(--card)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Color bar + type */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: event.coverColor, opacity: 0.85 }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              {event.type}
            </div>
            <h3
              className="font-semibold text-base leading-tight group-hover:opacity-80 transition-opacity"
              style={{ color: "var(--foreground)" }}
            >
              {event.name}
            </h3>
          </div>
          <span
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <Calendar size={13} />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <MapPin size={13} />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <Users size={13} />
            <span>{event.guests} gasten</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="pt-3 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex -space-x-1.5">
            {["#c8a96e", "#94a3b8", "#10b981"].map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2"
                style={{
                  backgroundColor: color,
                  borderColor: "var(--card)",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <button
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Details
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Event };
