"use client";

import { LayoutDashboard, Calendar, Users, Mail, BookOpen, Lightbulb, Wallet, MessageSquare, Building2 } from "lucide-react";

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
    <aside
      className="flex flex-col h-full w-64 shrink-0"
      style={{ backgroundColor: "var(--sidebar)", color: "var(--sidebar-text)" }}
    >
      {/* Logo */}
      <div className="px-6 py-8 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            EH
          </div>
          <div>
            <div className="font-semibold text-sm tracking-wide" style={{ color: "var(--sidebar-text)" }}>
              Event Hub
            </div>
            <div className="text-xs" style={{ color: "rgba(232,228,220,0.45)" }}>
              Werkplek
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
            style={
              item.active
                ? { backgroundColor: "rgba(232,111,163,0.18)", color: "var(--accent)" }
                : { color: "rgba(232,228,220,0.6)" }
            }
          >
            <item.icon
              size={16}
              style={{ color: item.active ? "var(--accent)" : "rgba(232,228,220,0.4)" }}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="px-4 py-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            JG
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: "var(--sidebar-text)" }}>
              Jouw naam
            </div>
            <div className="text-xs" style={{ color: "rgba(232,228,220,0.4)" }}>
              Event Manager
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
