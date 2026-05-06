"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Mail,
  BookOpen, Lightbulb, Wallet, MessageSquare, Building2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/" },
  { icon: Calendar,        label: "Events",         href: "/events" },
  { icon: Building2,       label: "Leveranciers",   href: "/leveranciers" },
  { icon: Users,           label: "Gasten",         href: "/gasten" },
  { icon: BookOpen,        label: "Draaiboeken",    href: "/draaiboeken" },
  { icon: Mail,            label: "Mailgenerator",  href: "/mail" },
  { icon: Lightbulb,       label: "Brainstorm",     href: "/brainstorm" },
  { icon: Wallet,          label: "Budget",         href: "/budget" },
  { icon: MessageSquare,   label: "Vergaderingen",  href: "/vergaderingen" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full w-64 shrink-0"
      style={{ backgroundColor: "var(--sidebar)", color: "var(--sidebar-text)" }}
    >
      {/* Logo */}
      <div className="px-6 py-8 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link href="/" className="flex items-center gap-3">
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
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={
                active
                  ? { backgroundColor: "rgba(232,111,163,0.18)", color: "var(--accent)" }
                  : { color: "rgba(232,228,220,0.6)" }
              }
            >
              <item.icon
                size={16}
                style={{ color: active ? "var(--accent)" : "rgba(232,228,220,0.4)" }}
              />
              {item.label}
            </Link>
          );
        })}
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
