"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import Sidebar from "@/components/Sidebar";
import { events, type Todo, type BudgetItem } from "@/lib/mockData";
import {
  ArrowLeft, MapPin, Users, Clock, CheckCircle2,
  Circle, Timer, Phone, Mail, ChevronRight,
  Euro, AlertCircle,
} from "lucide-react";

const statusConfig = {
  "in voorbereiding": { label: "In voorbereiding", bg: "rgba(251,191,36,0.12)", text: "#b45309", dot: "#f59e0b" },
  bevestigd:          { label: "Bevestigd",         bg: "rgba(52,211,153,0.12)",  text: "#065f46", dot: "#10b981" },
  afgerond:           { label: "Afgerond",           bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8" },
  concept:            { label: "Concept",            bg: "rgba(167,139,250,0.12)", text: "#5b21b6", dot: "#8b5cf6" },
} as const;

const todoStatusConfig = {
  open:        { label: "Open",        icon: Circle,        color: "#94a3b8" },
  "in progress": { label: "In progress", icon: Timer,         color: "#f59e0b" },
  done:        { label: "Klaar",       icon: CheckCircle2,  color: "#10b981" },
} as const;

const TABS = ["Programma", "To do's", "Uitwerking", "Budget", "Tijdlijn"] as const;
type Tab = typeof TABS[number];

function formatEuro(n: number) {
  return n === 0 ? "—" : `€ ${n.toLocaleString("nl-NL")}`;
}

function BudgetRow({ item }: { item: BudgetItem }) {
  const diff = item.actual - item.estimated;
  const hasActual = item.actual > 0;
  return (
    <div
      className="grid grid-cols-4 gap-4 px-5 py-3.5 border-b text-sm items-center"
      style={{ borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--foreground)" }}>{item.category}</span>
      <span style={{ color: "var(--muted)" }}>{formatEuro(item.estimated)}</span>
      <span style={{ color: hasActual ? "var(--foreground)" : "var(--muted)" }}>
        {formatEuro(item.actual)}
      </span>
      <span
        className="font-medium"
        style={{
          color: !hasActual ? "var(--muted)" : diff > 0 ? "#dc2626" : "#16a34a",
        }}
      >
        {!hasActual ? "—" : diff > 0 ? `+${formatEuro(diff)}` : formatEuro(diff)}
      </span>
    </div>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const cfg = todoStatusConfig[todo.status];
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b"
      style={{ borderColor: "var(--border)", opacity: todo.status === "done" ? 0.55 : 1 }}
    >
      <Icon size={15} style={{ color: cfg.color, flexShrink: 0 }} />
      <span
        className="flex-1 text-sm"
        style={{
          color: "var(--foreground)",
          textDecoration: todo.status === "done" ? "line-through" : "none",
        }}
      >
        {todo.text}
      </span>
      <span
        className="text-xs px-2 py-0.5 rounded"
        style={{ backgroundColor: "var(--background)", color: "var(--muted)" }}
      >
        {todo.category}
      </span>
      {todo.deadline && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {todo.deadline}
        </span>
      )}
    </div>
  );
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === Number(id));
  if (!event) notFound();

  const [activeTab, setActiveTab] = useState<Tab>("Programma");
  const st = statusConfig[event.status];

  const totalEstimated = event.budget.reduce((s, b) => s + b.estimated, 0);
  const totalActual    = event.budget.reduce((s, b) => s + b.actual, 0);
  const openTodos      = event.todos.filter((t) => t.status !== "done");

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* ── Header ── */}
        <header style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-8 pt-5 pb-3 text-xs" style={{ color: "var(--muted)" }}>
            <Link href="/events" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <ArrowLeft size={12} /> Events
            </Link>
            <ChevronRight size={11} />
            <span style={{ color: "var(--foreground)" }}>{event.name}</span>
          </div>

          {/* Event title & meta */}
          <div className="px-8 pb-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{event.type}</div>
                <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                  {event.name}
                </h1>
              </div>
              <span
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: st.bg, color: st.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                {st.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {event.date} · {event.startTime}–{event.endTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} /> {event.guests} gasten
              </span>
              {openTodos.length > 0 && (
                <span
                  className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(232,111,163,0.12)", color: "var(--accent)" }}
                >
                  <AlertCircle size={11} /> {openTodos.length} open taken
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-8 gap-0 border-t" style={{ borderColor: "var(--border)" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab ? "var(--accent)" : "var(--muted)",
                  borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab}
                {tab === "To do's" && openTodos.length > 0 && (
                  <span
                    className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent)", color: "#fff", fontSize: "10px" }}
                  >
                    {openTodos.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-0 h-full">
            {/* Main tab content */}
            <div className="flex-1 px-8 py-6 min-w-0">

              {/* PROGRAMMA */}
              {activeTab === "Programma" && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
                    Programma op de dag
                  </h2>
                  {event.program.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      Nog geen programma uitgewerkt.
                    </p>
                  ) : (
                    <div className="relative">
                      <div
                        className="absolute left-16 top-3 bottom-3 w-px"
                        style={{ backgroundColor: "var(--border)" }}
                      />
                      <div className="space-y-0">
                        {event.program.map((item, i) => (
                          <div key={i} className="flex gap-6 items-start py-4 relative">
                            <div
                              className="w-14 shrink-0 text-sm font-semibold text-right"
                              style={{ color: "var(--accent)" }}
                            >
                              {item.time}
                            </div>
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 z-10"
                              style={{ backgroundColor: "var(--accent)", outline: "3px solid var(--background)" }}
                            />
                            <div className="flex-1 pb-1">
                              <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                                {item.title}
                              </div>
                              {item.notes && (
                                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TO DO'S */}
              {activeTab === "To do's" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                      Taken
                    </h2>
                    <button
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
                    >
                      + Taak toevoegen
                    </button>
                  </div>
                  {event.todos.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Geen taken.</p>
                  ) : (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                    >
                      {/* Group by status */}
                      {(["open", "in progress", "done"] as const).map((s) => {
                        const group = event.todos.filter((t) => t.status === s);
                        if (group.length === 0) return null;
                        const cfg = todoStatusConfig[s];
                        return (
                          <div key={s}>
                            <div
                              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest border-b"
                              style={{
                                color: cfg.color,
                                backgroundColor: "var(--background)",
                                borderColor: "var(--border)",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {cfg.label} ({group.length})
                            </div>
                            {group.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* UITWERKING */}
              {activeTab === "Uitwerking" && (
                <div className="space-y-6 max-w-2xl">
                  <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Event uitwerking
                  </h2>
                  {[
                    { label: "Concept", value: event.concept },
                    { label: "Doelgroep", value: event.audience },
                    { label: "Thema", value: event.theme },
                    { label: "Format", value: event.format },
                    { label: "Notities & bijzonderheden", value: event.notes },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        className="text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
                      >
                        {label}
                      </div>
                      <div
                        className="w-full rounded-xl p-4 text-sm min-h-[80px]"
                        style={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          color: value ? "var(--foreground)" : "var(--muted)",
                          lineHeight: 1.7,
                        }}
                      >
                        {value || `${label} nog niet ingevuld...`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BUDGET */}
              {activeTab === "Budget" && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
                    Budget
                  </h2>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                  >
                    {/* Table header */}
                    <div
                      className="grid grid-cols-4 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest border-b"
                      style={{
                        color: "var(--muted)",
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      <span>Categorie</span>
                      <span>Begroot</span>
                      <span>Werkelijk</span>
                      <span>Verschil</span>
                    </div>
                    {event.budget.map((item) => <BudgetRow key={item.category} item={item} />)}
                    {/* Totals */}
                    <div
                      className="grid grid-cols-4 gap-4 px-5 py-4 text-sm font-semibold"
                      style={{ backgroundColor: "var(--background)", borderTop: "2px solid var(--border)" }}
                    >
                      <span style={{ color: "var(--foreground)" }}>Totaal</span>
                      <span style={{ color: "var(--foreground)" }}>{formatEuro(totalEstimated)}</span>
                      <span style={{ color: totalActual > 0 ? "var(--foreground)" : "var(--muted)" }}>
                        {formatEuro(totalActual)}
                      </span>
                      <span style={{ color: totalActual > totalEstimated ? "#dc2626" : "#16a34a" }}>
                        {totalActual > 0
                          ? (totalActual - totalEstimated > 0
                              ? `+${formatEuro(totalActual - totalEstimated)}`
                              : formatEuro(totalActual - totalEstimated))
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Budget bar */}
                  {totalActual > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
                        <span>Besteed</span>
                        <span>{Math.round((totalActual / totalEstimated) * 100)}% van begroting</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((totalActual / totalEstimated) * 100, 100)}%`,
                            backgroundColor: totalActual > totalEstimated ? "#dc2626" : "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIJDLIJN */}
              {activeTab === "Tijdlijn" && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
                    Aanloop naar het event
                  </h2>
                  <div className="relative">
                    <div
                      className="absolute left-24 top-3 bottom-3 w-px"
                      style={{ backgroundColor: "var(--border)" }}
                    />
                    <div className="space-y-0">
                      {event.timeline.map((item, i) => (
                        <div key={i} className="flex gap-6 items-start py-4">
                          <div
                            className="w-20 shrink-0 text-xs font-semibold text-right pt-0.5"
                            style={{ color: item.done ? "var(--muted)" : "var(--foreground)" }}
                          >
                            {item.date}
                          </div>
                          <div className="relative z-10 shrink-0 mt-1">
                            {item.done ? (
                              <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                            ) : (
                              <Circle size={16} style={{ color: "var(--border)" }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div
                              className="text-sm font-medium"
                              style={{
                                color: item.done ? "var(--muted)" : "var(--foreground)",
                                textDecoration: item.done ? "line-through" : "none",
                              }}
                            >
                              {item.title}
                            </div>
                            {item.linkedTodoId && !item.done && (
                              <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
                                Gekoppeld aan taak
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right sidebar: contacts + quick actions ── */}
            <aside
              className="w-64 shrink-0 border-l px-5 py-6 space-y-7 overflow-y-auto"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            >
              {/* Contacts */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
                >
                  Contacten
                </h3>
                {event.contacts.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Nog geen contacten toegevoegd.</p>
                ) : (
                  <div className="space-y-4">
                    {event.contacts.map((c) => (
                      <div key={c.name}>
                        <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.name}</div>
                        <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>{c.role}</div>
                        <div className="flex flex-col gap-1">
                          {c.phone && (
                            <a
                              href={`tel:${c.phone}`}
                              className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                              style={{ color: "var(--accent)" }}
                            >
                              <Phone size={11} /> {c.phone}
                            </a>
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                              style={{ color: "var(--accent)" }}
                            >
                              <Mail size={11} /> {c.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="mt-3 w-full text-xs py-1.5 rounded-lg border font-medium transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  + Contact toevoegen
                </button>
              </div>

              {/* Quick info */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
                >
                  Samenvatting
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Gasten", value: `${event.guests}` },
                    { label: "Begroting", value: formatEuro(totalEstimated) },
                    { label: "Besteed", value: totalActual > 0 ? formatEuro(totalActual) : "—" },
                    { label: "Open taken", value: `${openTodos.length}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
                >
                  Snelle acties
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Mail opstellen", icon: Mail },
                    { label: "Draaiboek openen", icon: Euro },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                      style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    >
                      <Icon size={12} style={{ color: "var(--accent)" }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
