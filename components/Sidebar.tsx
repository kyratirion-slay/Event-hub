"use client";

import {
  LayoutDashboard, Calendar, Users, Mail,
  BookOpen, Lightbulb, Wallet, MessageSquare, Building2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Calendar, label: "Events", active: false },
  { icon: Building2, label: "Leveranciers", active: false },
  { icon: Users, label: "Gasten", active: false },
  { icon: BookOpen, label: "Draaiboeken", active: false },
  { icon: Mail, label: "Mailgenerator", active: false },
  { icon: Lightbulb, label: "Brainstorm", active: false },
  { icon: Wallet, label: "Budget", active: false },
  { icon: MessageSquare, label: "Vergaderingen", active: false },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-full w-60 shrink-0" style={{ backgroundColor: "var(--red)" }}>

      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div
          className="text-4xl leading-none mb-1"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            color: "var(--beige)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          Event
        </div>
        <div
          className="text-4xl leading-none"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            color: "rgba(245,240,232,0.35)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          Hub
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 mb-6 h-px" style={{ backgroundColor: "rgba(245,240,232,0.15)" }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item, i) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group"
            style={
              item.active
                ? { backgroundColor: "rgba(245,240,232,0.12)" }
                : {}
            }
          >
            <span
              className="text-xs w-5 shrink-0 tabular-nums"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 700,
                color: item.active ? "var(--beige)" : "rgba(245,240,232,0.3)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <item.icon
              size={13}
              style={{ color: item.active ? "var(--beige)" : "rgba(245,240,232,0.4)" }}
            />
            <span
              className="text-xs tracking-wide uppercase"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: item.active ? 700 : 600,
                color: item.active ? "var(--beige)" : "rgba(245,240,232,0.5)",
                letterSpacing: "0.08em",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-6">
        <div className="h-px mb-4" style={{ backgroundColor: "rgba(245,240,232,0.15)" }} />
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: "var(--beige)",
              color: "var(--red)",
              fontFamily: "var(--font-barlow)",
              fontWeight: 900,
            }}
          >
            JG
          </div>
          <div>
            <div
              className="text-xs uppercase tracking-widest"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 700,
                color: "var(--beige)",
                letterSpacing: "0.1em",
              }}
            >
              Jouw naam
            </div>
            <div className="text-xs" style={{ color: "rgba(245,240,232,0.4)", fontSize: "10px" }}>
              Event Manager
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
