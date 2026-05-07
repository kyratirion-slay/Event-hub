"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import { generateSuggestions } from "@/lib/suggestions";
import type { EventBriefing, TimelineItem, NoteWindow, ProgramDay } from "@/lib/types";
import {
  ArrowLeft, ChevronRight, Plus, Trash2, GripVertical,
  CheckCircle2, Circle, CheckCheck, AlertCircle,
  MapPin, Users, Clock, ChevronDown, ChevronUp,
  Sparkles, Pencil, Check, X, StickyNote,
  Bold, Italic, Underline, List, ListOrdered,
} from "lucide-react";

// ─── INLINE EDIT ─────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  placeholder = "Klik om te bewerken",
  className = "",
  style,
  inputStyle,
  multiline = false,
  inputClass = "",
  rows = 2,
  alwaysShowHint = false,
}: {
  value: string;
  onSave(v: string): void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  multiline?: boolean;
  inputClass?: string;
  rows?: number;
  alwaysShowHint?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function start() { setDraft(value); setEditing(true); }
  function commit() { onSave(draft.trim() || value); setEditing(false); }
  function cancel() { setEditing(false); }

  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") commit();
        if (e.key === "Escape") cancel();
      },
      autoFocus: true,
      className: `bg-transparent outline-none w-full ${inputClass}`,
      style: { ...style, ...inputStyle, borderBottom: "1.5px solid var(--accent)" },
    };
    return multiline
      ? <textarea {...shared} rows={rows} style={{ ...shared.style, resize: "vertical" }} />
      : <input {...shared} />;
  }

  return (
    <span
      onClick={start}
      className={`cursor-text group inline-flex items-center gap-1 ${className}`}
      style={style}
      title="Klik om te bewerken"
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
      <Pencil size={11} className={`${alwaysShowHint ? "opacity-30" : "opacity-0 group-hover:opacity-40"} transition-opacity shrink-0`} style={{ color: "var(--muted)" }} />
    </span>
  );
}

function InlineNumber({
  value,
  onSave,
  prefix = "",
  suffix = "",
  style,
}: {
  value: number;
  onSave(v: number): void;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const n = parseFloat(draft.replace(",", "."));
    if (!isNaN(n)) onSave(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="bg-transparent outline-none"
        style={{ ...style, borderBottom: "1.5px solid var(--accent)", width: "5rem" }}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="cursor-text group inline-flex items-center gap-1"
      style={style}
      title="Klik om te bewerken"
    >
      {prefix}{value}{suffix}
      <Pencil size={10} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" style={{ color: "var(--muted)" }} />
    </span>
  );
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["in voorbereiding", "bevestigd", "concept", "afgerond"] as const;
const statusConfig = {
  "in voorbereiding": { label: "In voorbereiding", bg: "rgba(251,191,36,0.12)", text: "#b45309", dot: "#f59e0b" },
  bevestigd:          { label: "Bevestigd",         bg: "rgba(52,211,153,0.12)",  text: "#065f46", dot: "#10b981" },
  afgerond:           { label: "Afgerond",           bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8" },
  concept:            { label: "Concept",            bg: "rgba(167,139,250,0.12)", text: "#5b21b6", dot: "#8b5cf6" },
} as const;

const TABS = ["Programma", "To do's", "Uitwerking", "Budget", "Tijdlijn", "Notities"] as const;
type Tab = typeof TABS[number];

function formatEuro(n: number) {
  return `€ ${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── PROGRAMMA TAB ────────────────────────────────────────────────────────

function ProgramDayColumn({ eventId, day }: { eventId: number; day: ProgramDay }) {
  const store = useStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(day.label);

  function saveLabel() {
    if (labelDraft.trim()) store.renameProgramDay(eventId, day.id, labelDraft.trim());
    setEditingLabel(false);
  }

  return (
    <div
      className="shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{ width: 300, border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Day header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      >
        <div className="flex-1 min-w-0">
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingLabel(false); }}
              className="text-sm font-semibold bg-transparent outline-none w-full"
              style={{ borderBottom: "1.5px solid var(--accent)", color: "var(--foreground)" }}
            />
          ) : (
            <button
              onClick={() => { setLabelDraft(day.label); setEditingLabel(true); }}
              className="text-sm font-semibold text-left hover:opacity-70 transition-opacity flex items-center gap-1.5 group"
              style={{ color: "var(--foreground)" }}
            >
              {day.label}
              <Pencil size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--muted)" }} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => store.addProgramItem(eventId, day.id)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={10} /> Regel
          </button>
          <button
            onClick={() => store.removeProgramDay(eventId, day.id)}
            className="opacity-30 hover:opacity-80 transition-opacity"
            title="Dag verwijderen"
          >
            <Trash2 size={12} style={{ color: "var(--muted)" }} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {day.items.length === 0 ? (
          <button
            onClick={() => store.addProgramItem(eventId, day.id)}
            className="w-full py-8 text-xs transition-colors hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            + Regel toevoegen
          </button>
        ) : (
          <div className="relative px-1 py-2">
            <div className="absolute left-[3.75rem] top-0 bottom-0 w-px" style={{ backgroundColor: "var(--border)" }} />
            {day.items.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i) store.reorderProgramItems(eventId, day.id, dragIndex, i);
                  setDragIndex(null); setDragOver(null);
                }}
                onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                className="flex gap-2 items-start py-2.5 relative group"
                style={{
                  opacity: dragIndex === i ? 0.4 : 1,
                  backgroundColor: dragOver === i && dragIndex !== i ? "rgba(232,111,163,0.05)" : "transparent",
                  borderRadius: 8,
                }}
              >
                <div className="w-4 shrink-0 flex justify-center pt-1 opacity-0 group-hover:opacity-30 cursor-grab transition-opacity">
                  <GripVertical size={12} style={{ color: "var(--muted)" }} />
                </div>
                <div className="w-10 shrink-0">
                  <InlineEdit
                    value={item.time}
                    onSave={(v) => store.updateProgramItem(eventId, day.id, i, { time: v })}
                    placeholder="--:--"
                    className="text-xs font-bold"
                    style={{ color: "var(--accent)" }}
                    inputClass="text-xs font-bold"
                  />
                </div>
                <div className="w-2 h-2 rounded-full shrink-0 mt-1 z-10" style={{ backgroundColor: "var(--accent)", outline: "3px solid var(--card)" }} />
                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={item.title}
                    onSave={(v) => store.updateProgramItem(eventId, day.id, i, { title: v })}
                    placeholder="Omschrijving..."
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                    inputClass="text-sm font-medium"
                  />
                  <div className="mt-0.5">
                    <InlineEdit
                      value={item.notes || ""}
                      onSave={(v) => store.updateProgramItem(eventId, day.id, i, { notes: v })}
                      placeholder="Notitie..."
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                      inputClass="text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={() => store.deleteProgramItem(eventId, day.id, i)}
                  className="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity mt-0.5"
                >
                  <Trash2 size={11} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgrammaTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;

  function addDay() {
    const n = event.program.length + 1;
    store.addProgramDay(eventId, `Dag ${n}`);
  }

  if (event.program.length === 0) {
    return (
      <div className="max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Programma</h2>
        </div>
        <button
          onClick={addDay}
          className="w-full py-12 rounded-2xl border-2 border-dashed text-sm transition-colors hover:opacity-70 flex flex-col items-center gap-2"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <Plus size={24} className="opacity-40" />
          <span>Start het programma — voeg de eerste dag toe</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Programma — {event.program.length} {event.program.length === 1 ? "dag" : "dagen"}
        </h2>
        <button
          onClick={addDay}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
        >
          <Plus size={12} /> Dag toevoegen
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ alignItems: "flex-start" }}>
        {event.program.map((day) => (
          <ProgramDayColumn key={day.id} eventId={eventId} day={day} />
        ))}
      </div>
    </div>
  );
}

// ─── TODOS TAB ────────────────────────────────────────────────────────────

function TodoRow({
  todo,
  eventId,
}: {
  todo: { id: number; text: string; status: "open" | "done"; deadline?: string; category: string };
  eventId: number;
}) {
  const store = useStore();
  const [editingText, setEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState(todo.text);

  function saveText() {
    if (textDraft.trim()) store.updateTodo(eventId, todo.id, { text: textDraft.trim() });
    setEditingText(false);
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 group"
      style={{ borderBottom: "1px solid var(--border)", opacity: todo.status === "done" ? 0.6 : 1 }}
    >
      {/* Toggle */}
      <button onClick={() => store.toggleTodo(eventId, todo.id)} className="shrink-0">
        {todo.status === "done"
          ? <CheckCircle2 size={16} style={{ color: "#10b981" }} />
          : <Circle size={16} className="hover:opacity-60 transition-opacity" style={{ color: "var(--border)" }} />
        }
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {editingText ? (
          <input
            autoFocus
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={saveText}
            onKeyDown={(e) => { if (e.key === "Enter") saveText(); if (e.key === "Escape") setEditingText(false); }}
            className="w-full text-sm bg-transparent outline-none"
            style={{ borderBottom: "1.5px solid var(--accent)", color: "var(--foreground)" }}
          />
        ) : (
          <span
            onClick={() => { setTextDraft(todo.text); setEditingText(true); }}
            className="text-sm cursor-text"
            style={{
              color: "var(--foreground)",
              textDecoration: todo.status === "done" ? "line-through" : "none",
            }}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Category — always shows edit hint */}
      <InlineEdit
        value={todo.category}
        onSave={(v) => store.updateTodo(eventId, todo.id, { category: v })}
        className="text-xs px-2 py-0.5 rounded shrink-0 !gap-1.5"
        style={{ backgroundColor: "var(--background)", color: "var(--muted)" }}
        inputClass="text-xs w-20"
        alwaysShowHint
      />

      {/* Deadline */}
      <InlineEdit
        value={todo.deadline || ""}
        onSave={(v) => store.updateTodo(eventId, todo.id, { deadline: v || undefined })}
        placeholder="Deadline"
        className="text-xs shrink-0 w-16"
        style={{ color: "var(--muted)" }}
        inputClass="text-xs w-16"
      />

      {/* Delete */}
      <button
        onClick={() => store.deleteTodo(eventId, todo.id)}
        className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
      >
        <Trash2 size={13} style={{ color: "var(--muted)" }} />
      </button>
    </div>
  );
}

function TodosTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const openTodos = event.todos.filter((t) => t.status === "open");
  const doneTodos = event.todos.filter((t) => t.status === "done");

  function add() {
    if (!newText.trim()) return;
    store.addTodo(eventId, {
      text: newText.trim(),
      status: "open",
      deadline: newDeadline.trim() || undefined,
      category: newCategory.trim() || "Algemeen",
    });
    setNewText(""); setNewDeadline(""); setNewCategory(""); setAdding(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Taken</h2>
        <div className="flex items-center gap-2">
          {doneTodos.length > 0 && (
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid var(--border)", color: showDone ? "var(--accent)" : "var(--muted)", backgroundColor: "var(--card)" }}
            >
              <CheckCheck size={12} /> {doneTodos.length} afgerond
            </button>
          )}
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={12} /> Taak toevoegen
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ border: "1px solid var(--accent)", backgroundColor: "var(--card)" }}>
          <input
            autoFocus
            placeholder="Omschrijving..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }}
            className="w-full text-sm outline-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
          <div className="flex gap-3">
            <input
              placeholder="Deadline (bv. 15 jun)"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            />
            <input
              placeholder="Categorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>
              Toevoegen
            </button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1.5" style={{ color: "var(--muted)" }}>Annuleren</button>
          </div>
        </div>
      )}

      {openTodos.length === 0 && !adding ? (
        <div className="rounded-xl px-5 py-10 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "#10b981" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Alle taken zijn afgerond!</p>
        </div>
      ) : openTodos.length > 0 ? (
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          {openTodos.map((todo) => <TodoRow key={todo.id} todo={todo} eventId={eventId} />)}
        </div>
      ) : null}

      {showDone && doneTodos.length > 0 && (
        <div className="rounded-xl overflow-hidden opacity-60" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <div className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest border-b" style={{ color: "#10b981", backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
            Afgerond ({doneTodos.length})
          </div>
          {doneTodos.map((todo) => <TodoRow key={todo.id} todo={todo} eventId={eventId} />)}
        </div>
      )}
    </div>
  );
}

// ─── UITWERKING TAB ───────────────────────────────────────────────────────

const DEFAULT_BRIEFING_ORDER: Array<keyof EventBriefing> = [
  "concept", "doelgroep", "sfeerThema", "format", "bijzonderheden",
  "dresscode", "cateringWensen", "avTechniek", "vrijeNotities",
];

const BRIEFING_META: Record<keyof EventBriefing, { label: string; placeholder: string; rows: number; wide?: boolean }> = {
  concept:         { label: "Eventconcept",    placeholder: "Wat is het idee achter dit event?",              rows: 3, wide: true },
  doelgroep:       { label: "Doelgroep",       placeholder: "Wie zijn de deelnemers?",                         rows: 2 },
  sfeerThema:      { label: "Sfeer & thema",   placeholder: "Welke sfeer en welk thema?",                      rows: 2 },
  format:          { label: "Format",          placeholder: "Dagindeling, zittend/staand, workshops…",          rows: 2 },
  bijzonderheden:  { label: "Bijzonderheden",  placeholder: "Speciale wensen, aandachtspunten…",               rows: 2 },
  dresscode:       { label: "Dresscode",       placeholder: "Smart casual, business, thema…",                  rows: 1 },
  cateringWensen:  { label: "Catering",        placeholder: "Dieetwensen, type catering…",                     rows: 2 },
  avTechniek:      { label: "AV & techniek",   placeholder: "Beamer, microfoon, livestream…",                  rows: 2 },
  vrijeNotities:   { label: "Vrije notities",  placeholder: "Alles wat verder van belang is…",                 rows: 3, wide: true },
};

function UitwerkingTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const order = event.briefingFieldOrder ?? DEFAULT_BRIEFING_ORDER;
  const [dragKey, setDragKey] = useState<keyof EventBriefing | null>(null);
  const [dragOver, setDragOver] = useState<keyof EventBriefing | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const hiddenSections = DEFAULT_BRIEFING_ORDER.filter((k) => !order.includes(k));

  function handleDragStart(key: keyof EventBriefing) { setDragKey(key); }
  function handleDragOver(e: React.DragEvent, key: keyof EventBriefing) { e.preventDefault(); setDragOver(key); }
  function handleDrop(key: keyof EventBriefing) {
    if (!dragKey || dragKey === key) { setDragKey(null); setDragOver(null); return; }
    const newOrder = [...order];
    const fromIdx = newOrder.indexOf(dragKey);
    const toIdx = newOrder.indexOf(key);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragKey);
    store.updateBriefingOrder(eventId, newOrder);
    setDragKey(null);
    setDragOver(null);
  }

  function deleteSection(key: keyof EventBriefing) {
    store.updateBriefingOrder(eventId, order.filter((k) => k !== key));
  }

  function addSection(key: keyof EventBriefing) {
    store.updateBriefingOrder(eventId, [...order, key]);
    setShowAdd(false);
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.map((key) => {
          const meta = BRIEFING_META[key];
          return (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(key)}
              onDragOver={(e) => handleDragOver(e, key)}
              onDrop={() => handleDrop(key)}
              onDragEnd={() => { setDragKey(null); setDragOver(null); }}
              className={`rounded-xl overflow-hidden transition-all group/section${meta.wide ? " sm:col-span-2" : ""}`}
              style={{
                border: dragOver === key && dragKey !== key ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                backgroundColor: "var(--card)",
                opacity: dragKey === key ? 0.5 : 1,
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b cursor-grab"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
              >
                <GripVertical size={13} className="opacity-30" style={{ color: "var(--muted)" }} />
                <span className="flex-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  {meta.label}
                </span>
                <button
                  onClick={() => deleteSection(key)}
                  className="opacity-0 group-hover/section:opacity-40 hover:!opacity-100 transition-opacity"
                  title="Sectie verwijderen"
                >
                  <X size={13} style={{ color: "var(--muted)" }} />
                </button>
              </div>
              <textarea
                rows={meta.rows}
                value={event.briefing[key]}
                onChange={(e) => store.updateBriefingField(eventId, key, e.target.value)}
                placeholder={meta.placeholder}
                className="w-full px-4 py-3 text-sm resize-none outline-none"
                style={{
                  backgroundColor: "var(--card)",
                  color: event.briefing[key] ? "var(--foreground)" : "var(--muted)",
                  lineHeight: 1.7,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Add section */}
      {hiddenSections.length > 0 && (
        <div className="mt-4 relative">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            style={{ border: "1px dashed var(--border)", color: "var(--muted)", backgroundColor: "var(--card)" }}
          >
            <Plus size={12} /> Sectie toevoegen
          </button>
          {showAdd && (
            <div
              className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[220px]"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              {hiddenSections.map((key) => (
                <button
                  key={key}
                  onClick={() => addSection(key)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:opacity-80 transition-opacity text-left"
                  style={{ color: "var(--foreground)" }}
                >
                  <Plus size={12} style={{ color: "var(--accent)" }} />
                  {BRIEFING_META[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BUDGET TAB ───────────────────────────────────────────────────────────

function BudgetTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const totalSpent = event.budgetCategories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + item.amountExclVat * (1 + item.vatRate / 100), 0),
    0
  );
  const remaining = event.totalBudget - totalSpent;
  const pct = event.totalBudget > 0 ? Math.min((totalSpent / event.totalBudget) * 100, 100) : 0;

  function toggleCollapse(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    store.addBudgetCategory(eventId, newCatName.trim());
    setNewCatName(""); setAddingCat(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 0 }}>
      {/* Scrollable table area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Total budget input */}
        <div className="flex items-center gap-8 px-2 mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Totaalbudget</div>
            <InlineNumber
              value={event.totalBudget}
              onSave={(v) => store.updateTotalBudget(eventId, v)}
              prefix="€ "
              style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)" }}
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Besteed</div>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: totalSpent > event.totalBudget ? "#dc2626" : "var(--foreground)" }}>
              {formatEuro(totalSpent)}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Resterend</div>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: remaining < 0 ? "#dc2626" : "#16a34a" }}>
              {formatEuro(remaining)}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          {/* Header row */}
          <div
            className="grid text-xs font-semibold uppercase tracking-widest px-4 py-2 border-b"
            style={{ gridTemplateColumns: "28px 1fr 110px 60px 110px 32px", borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--muted)" }}
          >
            <span />
            <span>Omschrijving</span>
            <span className="text-right">Excl. BTW</span>
            <span className="text-right">BTW</span>
            <span className="text-right">Incl. BTW</span>
            <span />
          </div>

          {event.budgetCategories.map((cat) => {
            const catTotal = cat.items.reduce((s, item) => s + item.amountExclVat * (1 + item.vatRate / 100), 0);
            const isCollapsed = collapsed.has(cat.id);
            return (
              <div key={cat.id}>
                {/* Category header */}
                <div
                  className="grid items-center px-4 py-2.5 border-b group"
                  style={{ gridTemplateColumns: "28px 1fr 110px 60px 110px 32px", borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                >
                  <button onClick={() => toggleCollapse(cat.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                    {isCollapsed ? <ChevronRight size={14} style={{ color: "var(--muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted)" }} />}
                  </button>
                  <InlineEdit
                    value={cat.name}
                    onSave={(v) => store.renameBudgetCategory(eventId, cat.id, v)}
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                    inputClass="text-sm font-semibold"
                  />
                  <span className="text-sm font-semibold text-right" style={{ color: "var(--foreground)" }}>
                    {formatEuro(catTotal)}
                  </span>
                  <span />
                  <button
                    onClick={() => store.addBudgetItem(eventId, cat.id)}
                    className="text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-right"
                    style={{ color: "var(--accent)" }}
                    title="Regel toevoegen"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => store.deleteBudgetCategory(eventId, cat.id)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity justify-self-center"
                  >
                    <Trash2 size={12} style={{ color: "var(--muted)" }} />
                  </button>
                </div>

                {/* Items */}
                {!isCollapsed && cat.items.map((item) => {
                  const inclVat = item.amountExclVat * (1 + item.vatRate / 100);
                  return (
                    <div
                      key={item.id}
                      className="grid items-center px-4 py-2 border-b group"
                      style={{ gridTemplateColumns: "28px 1fr 110px 60px 110px 32px", borderColor: "var(--border)" }}
                    >
                      <span />
                      <input
                        value={item.description}
                        onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { description: e.target.value })}
                        placeholder="Omschrijving..."
                        className="text-sm bg-transparent outline-none"
                        style={{ color: "var(--foreground)" }}
                      />
                      <input
                        type="number"
                        value={item.amountExclVat || ""}
                        onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { amountExclVat: parseFloat(e.target.value) || 0 })}
                        className="text-sm bg-transparent outline-none text-right"
                        style={{ color: "var(--foreground)" }}
                      />
                      <div className="flex items-center justify-end gap-0.5">
                        <input
                          type="number"
                          value={item.vatRate}
                          onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { vatRate: parseFloat(e.target.value) || 0 })}
                          className="text-sm bg-transparent outline-none text-right w-8"
                          style={{ color: "var(--muted)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--muted)" }}>%</span>
                      </div>
                      <span className="text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{formatEuro(inclVat)}</span>
                      <button
                        onClick={() => store.deleteBudgetItem(eventId, cat.id, item.id)}
                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity justify-self-center"
                      >
                        <Trash2 size={12} style={{ color: "var(--muted)" }} />
                      </button>
                    </div>
                  );
                })}

                {/* Add item row */}
                {!isCollapsed && (
                  <div className="px-4 py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => store.addBudgetItem(eventId, cat.id)}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      <Plus size={11} /> Regel toevoegen
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add category row */}
          <div className="px-4 py-2.5">
            {addingCat ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  placeholder="Naam categorie..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") setAddingCat(false); }}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ borderBottom: "1px solid var(--accent)", color: "var(--foreground)" }}
                />
                <button onClick={addCategory} className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>OK</button>
                <button onClick={() => setAddingCat(false)} className="text-xs" style={{ color: "var(--muted)" }}>×</button>
              </div>
            ) : (
              <button onClick={() => setAddingCat(true)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--muted)" }}>
                <Plus size={12} /> Categorie toevoegen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky totals bar */}
      <div
        className="shrink-0 mt-4 rounded-xl px-5 py-3 flex items-center gap-8"
        style={{ backgroundColor: "var(--card)", border: "2px solid var(--border)" }}
      >
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
            <span>{Math.round(pct)}% besteed</span>
            {remaining < 0 && <span style={{ color: "#dc2626" }}>{formatEuro(Math.abs(remaining))} over budget</span>}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: remaining < 0 ? "#dc2626" : "var(--accent)" }}
            />
          </div>
        </div>
        <div className="text-sm font-semibold shrink-0" style={{ color: "var(--muted)" }}>
          Budget: <span style={{ color: "var(--foreground)" }}>{formatEuro(event.totalBudget)}</span>
        </div>
        <div className="text-sm font-semibold shrink-0">
          Besteed: <span style={{ color: totalSpent > event.totalBudget ? "#dc2626" : "var(--foreground)" }}>{formatEuro(totalSpent)}</span>
        </div>
        <div className="text-sm font-semibold shrink-0">
          Rest: <span style={{ color: remaining < 0 ? "#dc2626" : "#16a34a" }}>{formatEuro(remaining)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── TIJDLIJN TAB ─────────────────────────────────────────────────────────

function MilestoneItem({
  item,
  eventId,
  isEventDay = false,
}: {
  item: TimelineItem;
  eventId: number;
  isEventDay?: boolean;
}) {
  const store = useStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title);
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState(item.date);

  function saveTitle() {
    if (titleDraft.trim()) store.updateTimelineItem(eventId, item.id, { title: titleDraft.trim() });
    setEditingTitle(false);
  }
  function saveDate() {
    if (dateDraft.trim()) store.updateTimelineItem(eventId, item.id, { date: dateDraft.trim() });
    setEditingDate(false);
  }

  return (
    <div className="flex gap-4 items-start group py-1.5">
      {/* Date column */}
      <div className="w-20 shrink-0 text-right">
        {editingDate ? (
          <input
            autoFocus
            value={dateDraft}
            onChange={(e) => setDateDraft(e.target.value)}
            onBlur={saveDate}
            onKeyDown={(e) => { if (e.key === "Enter") saveDate(); if (e.key === "Escape") setEditingDate(false); }}
            className="text-xs font-semibold bg-transparent outline-none text-right w-full"
            style={{ borderBottom: "1.5px solid var(--accent)", color: "var(--accent)" }}
          />
        ) : (
          <span
            onClick={() => !isEventDay && setEditingDate(true)}
            className={`text-xs font-semibold block ${!isEventDay ? "cursor-text hover:opacity-70" : ""}`}
            style={{ color: isEventDay ? "var(--accent)" : "var(--foreground)" }}
          >
            {item.date}
          </span>
        )}
      </div>

      {/* Dot */}
      <div className="relative z-10 shrink-0 mt-0.5">
        {isEventDay ? (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
            <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>★</span>
          </div>
        ) : (
          <button
            onClick={() => store.toggleTimelineItem(eventId, item.id)}
            title={item.done ? "Klik om te heropen" : "Markeer als klaar"}
          >
            {item.done
              ? <CheckCircle2 size={16} className="hover:opacity-70 transition-opacity" style={{ color: "#10b981" }} />
              : <Circle size={16} className="hover:opacity-70 transition-opacity" style={{ color: "var(--border)" }} />
            }
          </button>
        )}
      </div>

      {/* Title + actions */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ borderBottom: "1.5px solid var(--accent)", color: "var(--foreground)" }}
          />
        ) : (
          <span
            onClick={() => !isEventDay && setEditingTitle(true)}
            className={`text-sm flex-1 ${!isEventDay ? "cursor-text" : "font-semibold"}`}
            style={{
              color: isEventDay ? "var(--accent)" : item.done ? "var(--muted)" : "var(--foreground)",
            }}
          >
            {item.title}
          </span>
        )}
        {!isEventDay && (
          <button
            onClick={() => store.deleteTimelineItem(eventId, item.id)}
            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity shrink-0"
          >
            <Trash2 size={12} style={{ color: "var(--muted)" }} />
          </button>
        )}
      </div>
    </div>
  );
}

function TijdlijnTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const suggestions = generateSuggestions(event);

  const sortKey = (date: string) => {
    const months: Record<string, number> = { jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 };
    const [day, mon] = date.split(" ");
    return (months[mon?.toLowerCase()] ?? 0) * 31 + (parseInt(day, 10) || 0);
  };

  const userItems = [...event.timeline].sort((a, b) => sortKey(a.date) - sortKey(b.date));

  function addItem() {
    if (!newTitle.trim()) return;
    store.addTimelineItem(eventId, { date: newDate.trim() || "—", title: newTitle.trim(), done: false, type: "user" });
    setNewDate(""); setNewTitle(""); setAddingItem(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Planning aanloop
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid var(--border)", color: showSuggestions ? "var(--accent)" : "var(--muted)", backgroundColor: "var(--card)" }}
          >
            <Sparkles size={12} /> {suggestions.length} suggesties
          </button>
          <button
            onClick={() => setAddingItem(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={12} /> Mijlpaal
          </button>
        </div>
      </div>

      {/* Add form */}
      {addingItem && (
        <div className="rounded-xl p-4 mb-5 space-y-2.5" style={{ border: "1px solid var(--accent)", backgroundColor: "var(--card)" }}>
          <div className="flex gap-3">
            <input
              placeholder="Datum (bv. 15 jun)"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-28 text-sm outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <input
              autoFocus
              placeholder="Mijlpaal omschrijving..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAddingItem(false); }}
              className="flex-1 text-sm outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>Toevoegen</button>
            <button onClick={() => setAddingItem(false)} className="text-xs px-2 py-1.5" style={{ color: "var(--muted)" }}>Annuleren</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[5.75rem] top-0 bottom-0 w-px" style={{ backgroundColor: "var(--border)" }} />

        <div className="space-y-1">
          {userItems.map((item, i) => {
            const isLast = i === userItems.length - 1;
            const isEventDay = isLast;
            return (
              <MilestoneItem
                key={item.id}
                item={item}
                eventId={eventId}
                isEventDay={isEventDay}
              />
            );
          })}

          {/* Suggestions inline */}
          {showSuggestions && suggestions.map((s, i) => (
            <div key={`s-${i}`} className="flex gap-4 items-center py-1.5">
              <div className="w-20 shrink-0 text-right">
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{s.date}</span>
              </div>
              <div className="relative z-10 shrink-0">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: "var(--accent)", borderStyle: "dashed", backgroundColor: "var(--background)" }}
                />
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div
                  className="flex-1 flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm"
                  style={{ border: "1px dashed rgba(232,111,163,0.35)", backgroundColor: "rgba(232,111,163,0.04)" }}
                >
                  <Sparkles size={11} style={{ color: "var(--accent)", flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ color: "var(--muted)" }}>{s.title}</span>
                </div>
                <button
                  onClick={() => store.adoptSuggestion(eventId, { date: s.date, title: s.title, done: false })}
                  className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0 transition-colors"
                  style={{ backgroundColor: "rgba(232,111,163,0.12)", color: "var(--accent)" }}
                >
                  Overnemen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTITIES TAB ─────────────────────────────────────────────────────────

const NOTE_COLORS = [
  "#e86fa3", "#6e9fc8", "#a96ec8", "#6ec8b4",
  "#f59e0b", "#c86e6e", "#6dba8a", "#8b8a7a",
];

const NOTE_PRESETS = [
  { title: "Locatienotities",       color: "#6e9fc8" },
  { title: "Sprekersnotities",      color: "#a96ec8" },
  { title: "Last-minute updates",   color: "#c86e6e" },
  { title: "Open vragen",           color: "#f59e0b" },
  { title: "Cateringnotities",      color: "#6ec8b4" },
  { title: "Algemeen",              color: "#8b8a7a" },
];

function FloatingNoteWindow({
  win,
  eventId,
  onFocus,
}: {
  win: NoteWindow;
  eventId: number;
  onFocus(): void;
}) {
  const store = useStore();
  const divRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(win.title);
  const [showColors, setShowColors] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = win.content || "";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function execFormat(cmd: string) {
    contentRef.current?.focus();
    document.execCommand(cmd, false);
  }

  function handleContentInput() {
    if (contentRef.current) {
      store.updateNoteWindow(eventId, win.id, { content: contentRef.current.innerHTML });
    }
  }

  function startDrag(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("button,textarea,input,[contenteditable]")) return;
    e.preventDefault();
    onFocus();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = win.x;
    const origY = win.y;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    function onMove(e: MouseEvent) {
      const nx = Math.max(0, origX + e.clientX - startX);
      const ny = Math.max(0, origY + e.clientY - startY);
      if (divRef.current) { divRef.current.style.left = `${nx}px`; divRef.current.style.top = `${ny}px`; }
    }
    function onUp(e: MouseEvent) {
      store.updateNoteWindow(eventId, win.id, {
        x: Math.max(0, origX + e.clientX - startX),
        y: Math.max(0, origY + e.clientY - startY),
      });
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = win.width;
    const origH = win.height;
    document.body.style.cursor = "se-resize";
    document.body.style.userSelect = "none";
    function onMove(e: MouseEvent) {
      const nw = Math.max(260, origW + e.clientX - startX);
      const nh = Math.max(160, origH + e.clientY - startY);
      if (divRef.current) { divRef.current.style.width = `${nw}px`; divRef.current.style.height = `${nh}px`; }
    }
    function onUp(e: MouseEvent) {
      store.updateNoteWindow(eventId, win.id, {
        width: Math.max(260, origW + e.clientX - startX),
        height: Math.max(160, origH + e.clientY - startY),
      });
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      ref={divRef}
      onMouseDown={onFocus}
      style={{
        position: "absolute",
        left: win.x, top: win.y,
        width: win.width, height: win.height,
        zIndex: win.zIndex,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={startDrag}
        style={{
          backgroundColor: win.color,
          padding: "9px 12px",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: 8,
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { store.updateNoteWindow(eventId, win.id, { title: titleDraft || "Venster" }); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { store.updateNoteWindow(eventId, win.id, { title: titleDraft || "Venster" }); setEditingTitle(false); } }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none text-sm font-semibold"
            style={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.5)" }}
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold truncate"
            style={{ color: "#fff" }}
            onDoubleClick={(e) => { e.stopPropagation(); setTitleDraft(win.title); setEditingTitle(true); }}
            title="Dubbelklik om naam te wijzigen"
          >
            {win.title}
          </span>
        )}

        {/* Color picker */}
        <div className="relative shrink-0">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowColors((v) => !v)}
            className="w-4 h-4 rounded-full border-2"
            style={{ backgroundColor: win.color, borderColor: "rgba(255,255,255,0.5)" }}
            title="Kleur wijzigen"
          />
          {showColors && (
            <div
              className="absolute right-0 top-6 z-50 flex gap-1.5 p-2 rounded-lg"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { store.updateNoteWindow(eventId, win.id, { color: c }); setShowColors(false); }}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: win.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => store.deleteNoteWindow(eventId, win.id)}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: "#fff" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Formatting toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1 border-b flex-shrink-0"
        style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor: "var(--background)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {[
          { icon: <Bold size={11} />, cmd: "bold", title: "Vet" },
          { icon: <Italic size={11} />, cmd: "italic", title: "Cursief" },
          { icon: <Underline size={11} />, cmd: "underline", title: "Onderstrepen" },
          { icon: <List size={11} />, cmd: "insertUnorderedList", title: "Opsomming" },
          { icon: <ListOrdered size={11} />, cmd: "insertOrderedList", title: "Genummerd" },
        ].map(({ icon, cmd, title }) => (
          <button
            key={cmd}
            title={title}
            onMouseDown={(e) => { e.preventDefault(); execFormat(cmd); }}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Content — contentEditable rich text */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentInput}
        onMouseDown={(e) => e.stopPropagation()}
        data-placeholder="Schrijf hier je notities..."
        className="flex-1 outline-none px-4 py-3 text-sm overflow-y-auto"
        style={{
          color: "var(--foreground)",
          lineHeight: 1.75,
          minHeight: 0,
        }}
      />

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 18,
          height: 18,
          cursor: "se-resize",
          background: `linear-gradient(135deg, transparent 50%, var(--border) 50%)`,
          borderRadius: "0 0 14px 0",
        }}
      />
    </div>
  );
}

function NotitiesTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const windows = event.noteWindows ?? [];
  const [showPresets, setShowPresets] = useState(false);

  function addWindow(title: string, color: string) {
    const stagger = windows.length;
    const maxZ = windows.reduce((m, w) => Math.max(m, w.zIndex), 0);
    store.addNoteWindow(eventId, {
      title,
      content: "",
      color,
      x: 24 + (stagger * 36) % 280,
      y: 24 + (stagger * 36) % 180,
      width: 340,
      height: 280,
      zIndex: maxZ + 1,
    });
    setShowPresets(false);
  }

  function bringToFront(winId: number) {
    const maxZ = windows.reduce((m, w) => Math.max(m, w.zIndex), 0);
    store.updateNoteWindow(eventId, winId, { zIndex: maxZ + 1 });
  }

  return (
    <div className="relative h-full" style={{ backgroundColor: "var(--background)" }}>
      {windows.map((win) => (
        <FloatingNoteWindow
          key={win.id}
          win={win}
          eventId={eventId}
          onFocus={() => bringToFront(win.id)}
        />
      ))}

      {/* Empty state */}
      {windows.length === 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ color: "var(--muted)" }}
        >
          <StickyNote size={40} className="mb-4 opacity-30" />
          <p className="text-sm font-medium mb-1">Nog geen notitievensters</p>
          <p className="text-xs opacity-70">Gebruik de knop rechtsonder om te beginnen</p>
        </div>
      )}

      {/* Add button (floating, bottom-right) */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showPresets && (
          <div
            className="rounded-xl overflow-hidden mb-1"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 200 }}
          >
            {NOTE_PRESETS.map((p) => (
              <button
                key={p.title}
                onClick={() => addWindow(p.title, p.color)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80 transition-opacity text-left"
                style={{ borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                {p.title}
              </button>
            ))}
            <button
              onClick={() => addWindow("Nieuw venster", NOTE_COLORS[windows.length % NOTE_COLORS.length])}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80 transition-opacity text-left"
              style={{ color: "var(--muted)" }}
            >
              <Plus size={13} />
              Leeg venster
            </button>
          </div>
        )}
        <button
          onClick={() => setShowPresets((v) => !v)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all"
          style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
        >
          <Plus size={16} /> Venster
        </button>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useStore();
  const router = useRouter();
  const event = store.events.find((e) => e.id === Number(id));
  if (!event) notFound();

  const [activeTab, setActiveTab] = useState<Tab>("Programma");
  const [editingStatus, setEditingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const st = statusConfig[event.status];
  const openTodos = event.todos.filter((t) => t.status !== "done");

  function handleDeleteEvent() {
    if (!event) return;
    store.deleteEvent(event.id);
    router.push("/events");
  }

  // Full-width tabs (no summary sidebar)
  const fullWidthTabs: Tab[] = ["Uitwerking", "Budget", "Tijdlijn", "Notities"];
  const isFullWidth = fullWidthTabs.includes(activeTab);
  const isCanvas = activeTab === "Notities";

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* ── Header ── */}
        <header style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-8 pt-5 pb-3 text-xs" style={{ color: "var(--muted)" }}>
            <button onClick={() => router.back()} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <ArrowLeft size={12} /> Terug
            </button>
            <ChevronRight size={11} />
            <span style={{ color: "var(--foreground)" }}>
              <InlineEdit
                value={event.name}
                onSave={(v) => store.updateEventMeta(event.id, { name: v })}
                style={{ color: "var(--foreground)" }}
              />
            </span>
          </div>

          {/* Title row */}
          <div className="px-8 pb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <InlineEdit
                  value={event.type}
                  onSave={(v) => store.updateEventMeta(event.id, { type: v })}
                  className="text-xs mb-1 block"
                  style={{ color: "var(--muted)" }}
                />
                <InlineEdit
                  value={event.name}
                  onSave={(v) => store.updateEventMeta(event.id, { name: v })}
                  className="text-2xl font-bold leading-tight"
                  style={{ color: "var(--foreground)" }}
                  inputClass="text-2xl font-bold"
                />
              </div>

              {/* Status badge + delete */}
              <div className="flex items-center gap-2 mt-1">
                {/* Status badge — click to change */}
                <div className="relative">
                  <button
                    onClick={() => setEditingStatus((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: st.bg, color: st.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                    {st.label}
                    <ChevronDown size={11} />
                  </button>
                  {editingStatus && (
                    <div
                      className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[180px]"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    >
                      {STATUS_OPTIONS.map((s) => {
                        const c = statusConfig[s];
                        return (
                          <button
                            key={s}
                            onClick={() => { store.updateEventMeta(event.id, { status: s }); setEditingStatus(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-80 transition-opacity text-left"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
                            <span style={{ color: c.text }}>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delete event */}
                {confirmDelete ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ border: "1px solid #fca5a5", backgroundColor: "rgba(254,226,226,0.5)" }}>
                    <span className="text-xs" style={{ color: "#7f1d1d" }}>Weet je het zeker?</span>
                    <button
                      onClick={handleDeleteEvent}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: "#dc2626", color: "#fff" }}
                    >
                      Ja, verwijder
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: "#7f1d1d" }}>
                      Annuleer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                    style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                    title="Event verwijderen"
                  >
                    <Trash2 size={12} /> Verwijderen
                  </button>
                )}
              </div>
            </div>

            {/* Meta row — all editable */}
            <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                <InlineEdit
                  value={event.date}
                  onSave={(v) => store.updateEventMeta(event.id, { date: v })}
                  style={{ color: "var(--muted)" }}
                />
                {" · "}
                <InlineEdit
                  value={event.startTime}
                  onSave={(v) => store.updateEventMeta(event.id, { startTime: v })}
                  style={{ color: "var(--muted)" }}
                />
                {"–"}
                <InlineEdit
                  value={event.endTime}
                  onSave={(v) => store.updateEventMeta(event.id, { endTime: v })}
                  style={{ color: "var(--muted)" }}
                />
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                <InlineEdit
                  value={event.location}
                  onSave={(v) => store.updateEventMeta(event.id, { location: v })}
                  style={{ color: "var(--muted)" }}
                />
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                <InlineNumber
                  value={event.guests}
                  onSave={(v) => store.updateEventMeta(event.id, { guests: v })}
                  suffix=" gasten"
                  style={{ color: "var(--muted)", fontSize: "0.875rem" }}
                />
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
        <div className={`flex-1 ${isCanvas ? "overflow-hidden" : "overflow-y-auto"}`}>
          <div className="flex h-full">
            {/* Main content */}
            <div
              className={`flex-1 min-w-0 ${isCanvas ? "" : "px-8 py-6"}`}
              style={{ maxWidth: isFullWidth ? "100%" : undefined }}
            >
              {activeTab === "Programma"  && <ProgrammaTab eventId={event.id} />}
              {activeTab === "To do's"    && <TodosTab eventId={event.id} />}
              {activeTab === "Uitwerking" && <UitwerkingTab eventId={event.id} />}
              {activeTab === "Budget"     && <BudgetTab eventId={event.id} />}
              {activeTab === "Tijdlijn"   && <TijdlijnTab eventId={event.id} />}
              {activeTab === "Notities"   && <NotitiesTab eventId={event.id} />}
            </div>

            {/* Right sidebar — only for Programma and Todos */}
            {!isFullWidth && (
              <aside
                className="w-60 shrink-0 border-l px-5 py-6 space-y-5"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Samenvatting
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Gasten", value: String(event.guests) },
                    {
                      label: "Budget",
                      value: `€ ${event.totalBudget.toLocaleString("nl-NL")}`,
                    },
                    { label: "Open taken", value: String(openTodos.length) },
                    { label: "Status", value: st.label },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
