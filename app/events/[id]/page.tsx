"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import { generateSuggestions } from "@/lib/suggestions";
import type { EventBriefing, TimelineItem, BudgetCategory } from "@/lib/types";
import {
  ArrowLeft, MapPin, Users, Clock, CheckCircle2,
  Circle, ChevronRight, Euro, AlertCircle, Trash2,
  Plus, ChevronDown, ChevronUp, Sparkles, CheckCheck,
  Wand2, Loader2, Copy, Info, X,
} from "lucide-react";

const statusConfig = {
  "in voorbereiding": { label: "In voorbereiding", bg: "rgba(251,191,36,0.12)", text: "#b45309", dot: "#f59e0b" },
  bevestigd:          { label: "Bevestigd",         bg: "rgba(52,211,153,0.12)",  text: "#065f46", dot: "#10b981" },
  afgerond:           { label: "Afgerond",           bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8" },
  concept:            { label: "Concept",            bg: "rgba(167,139,250,0.12)", text: "#5b21b6", dot: "#8b5cf6" },
} as const;

const TABS = ["Programma", "To do's", "Uitwerking", "Budget", "Tijdlijn"] as const;
type Tab = typeof TABS[number];

function formatEuro(n: number) {
  return `€ ${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── BUDGET TAB ────────────────────────────────────────────────────────────

function BudgetTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(event.totalBudget));
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(event.budgetCategories.map((c) => c.id))
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const totalSpent = event.budgetCategories.reduce(
    (sum, cat) =>
      sum +
      cat.items.reduce(
        (s, item) => s + item.amountExclVat * (1 + item.vatRate / 100),
        0
      ),
    0
  );
  const remaining = event.totalBudget - totalSpent;
  const pct = event.totalBudget > 0 ? Math.min((totalSpent / event.totalBudget) * 100, 100) : 0;

  function toggleCategory(id: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function saveBudget() {
    const val = parseFloat(budgetInput.replace(",", "."));
    if (!isNaN(val)) store.updateTotalBudget(eventId, val);
    setEditingBudget(false);
  }

  function addCategory() {
    if (!newCategoryName.trim()) return;
    store.addBudgetCategory(eventId, newCategoryName.trim());
    setNewCategoryName("");
    setAddingCategory(false);
  }

  return (
    <div>
      {/* Total budget header */}
      <div
        className="rounded-xl p-5 mb-6 flex items-start justify-between gap-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
            Totaalbudget
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>€</span>
              <input
                autoFocus
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={saveBudget}
                onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditingBudget(false); }}
                className="text-2xl font-bold bg-transparent outline-none border-b-2 w-36"
                style={{ borderColor: "var(--accent)", color: "var(--foreground)" }}
              />
            </div>
          ) : (
            <button
              onClick={() => { setBudgetInput(String(event.totalBudget)); setEditingBudget(true); }}
              className="text-2xl font-bold hover:opacity-70 transition-opacity"
              style={{ color: "var(--foreground)" }}
            >
              {formatEuro(event.totalBudget)}
            </button>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Besteed</div>
          <div className="text-2xl font-bold" style={{ color: totalSpent > event.totalBudget ? "#dc2626" : "var(--foreground)" }}>
            {formatEuro(totalSpent)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Resterend</div>
          <div className="text-2xl font-bold" style={{ color: remaining < 0 ? "#dc2626" : "#16a34a" }}>
            {formatEuro(remaining)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
          <span>{Math.round(pct)}% van budget besteed</span>
          {remaining < 0 && <span style={{ color: "#dc2626" }}>€ {Math.abs(remaining).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} over budget</span>}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: remaining < 0 ? "#dc2626" : "var(--accent)" }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {event.budgetCategories.map((cat) => (
          <BudgetCategoryBlock
            key={cat.id}
            cat={cat}
            eventId={eventId}
            expanded={expandedCategories.has(cat.id)}
            onToggle={() => toggleCategory(cat.id)}
          />
        ))}
      </div>

      {/* Add category */}
      <div className="mt-4">
        {addingCategory ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              placeholder="Naam categorie..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") setAddingCategory(false); }}
              className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
              style={{ border: "1px solid var(--accent)", backgroundColor: "var(--card)", color: "var(--foreground)" }}
            />
            <button
              onClick={addCategory}
              className="text-xs font-medium px-3 py-2 rounded-lg"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              Toevoegen
            </button>
            <button onClick={() => setAddingCategory(false)} className="text-xs px-2 py-2" style={{ color: "var(--muted)" }}>
              Annuleren
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCategory(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--card)" }}
          >
            <Plus size={14} /> Categorie toevoegen
          </button>
        )}
      </div>
    </div>
  );
}

function BudgetCategoryBlock({
  cat, eventId, expanded, onToggle,
}: {
  cat: BudgetCategory;
  eventId: number;
  expanded: boolean;
  onToggle(): void;
}) {
  const store = useStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(cat.name);

  const catTotal = cat.items.reduce(
    (s, item) => s + item.amountExclVat * (1 + item.vatRate / 100),
    0
  );

  function saveName() {
    if (nameInput.trim()) store.renameBudgetCategory(eventId, cat.id, nameInput.trim());
    setEditingName(false);
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Category header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: "var(--background)" }}
      >
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          {expanded ? <ChevronDown size={14} style={{ color: "var(--muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--muted)" }} />}
          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm font-semibold bg-transparent outline-none border-b"
              style={{ borderColor: "var(--accent)", color: "var(--foreground)" }}
            />
          ) : (
            <span
              className="flex-1 text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            >
              {cat.name}
            </span>
          )}
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {formatEuro(catTotal)}
        </span>
        <button
          onClick={() => store.deleteBudgetCategory(eventId, cat.id)}
          className="opacity-40 hover:opacity-100 transition-opacity"
        >
          <Trash2 size={13} style={{ color: "var(--muted)" }} />
        </button>
      </div>

      {/* Items */}
      {expanded && (
        <>
          {/* Column headers */}
          <div
            className="grid gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest border-t border-b"
            style={{
              gridTemplateColumns: "1fr 110px 70px 110px 28px",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            <span>Omschrijving</span>
            <span>Excl. BTW</span>
            <span>BTW %</span>
            <span>Incl. BTW</span>
            <span />
          </div>

          {cat.items.map((item) => {
            const inclVat = item.amountExclVat * (1 + item.vatRate / 100);
            return (
              <div
                key={item.id}
                className="grid gap-2 px-4 py-2.5 border-b items-center text-sm"
                style={{
                  gridTemplateColumns: "1fr 110px 70px 110px 28px",
                  borderColor: "var(--border)",
                }}
              >
                <input
                  value={item.description}
                  onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { description: e.target.value })}
                  placeholder="Omschrijving..."
                  className="bg-transparent outline-none"
                  style={{ color: "var(--foreground)" }}
                />
                <input
                  type="number"
                  value={item.amountExclVat || ""}
                  onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { amountExclVat: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent outline-none text-right"
                  style={{ color: "var(--foreground)" }}
                />
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    value={item.vatRate}
                    onChange={(e) => store.updateBudgetItem(eventId, cat.id, item.id, { vatRate: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent outline-none w-10 text-right"
                    style={{ color: "var(--foreground)" }}
                  />
                  <span style={{ color: "var(--muted)" }}>%</span>
                </div>
                <span className="text-right font-medium" style={{ color: "var(--foreground)" }}>
                  {formatEuro(inclVat)}
                </span>
                <button
                  onClick={() => store.deleteBudgetItem(eventId, cat.id, item.id)}
                  className="opacity-30 hover:opacity-100 transition-opacity justify-self-center"
                >
                  <Trash2 size={12} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            );
          })}

          <div className="px-4 py-2.5">
            <button
              onClick={() => store.addBudgetItem(eventId, cat.id)}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              <Plus size={12} /> Regel toevoegen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TODOS TAB ────────────────────────────────────────────────────────────

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

  function addTodo() {
    if (!newText.trim()) return;
    store.addTodo(eventId, {
      text: newText.trim(),
      status: "open",
      deadline: newDeadline.trim() || undefined,
      category: newCategory.trim() || "Algemeen",
    });
    setNewText("");
    setNewDeadline("");
    setNewCategory("");
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Taken
        </h2>
        <div className="flex items-center gap-2">
          {doneTodos.length > 0 && (
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{
                border: "1px solid var(--border)",
                color: showDone ? "var(--accent)" : "var(--muted)",
                backgroundColor: "var(--card)",
              }}
            >
              <CheckCheck size={12} />
              {doneTodos.length} afgerond
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

      {/* Add form */}
      {adding && (
        <div
          className="rounded-xl p-4 mb-4 space-y-3"
          style={{ border: "1px solid var(--accent)", backgroundColor: "var(--card)" }}
        >
          <input
            autoFocus
            placeholder="Omschrijving taak..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTodo(); if (e.key === "Escape") setAdding(false); }}
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
            <button
              onClick={addTodo}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              Toevoegen
            </button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1.5" style={{ color: "var(--muted)" }}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Open todos */}
      {openTodos.length === 0 && !adding ? (
        <div
          className="rounded-xl px-5 py-8 text-center"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "#10b981" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Alle taken zijn afgerond!</p>
        </div>
      ) : openTodos.length > 0 ? (
        <div
          className="rounded-xl overflow-hidden mb-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          {openTodos.map((todo, i) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                borderBottom: i < openTodos.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <button onClick={() => store.toggleTodo(eventId, todo.id)} className="shrink-0">
                <Circle size={16} className="hover:opacity-70 transition-opacity" style={{ color: "var(--border)" }} />
              </button>
              <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{todo.text}</span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: "var(--background)", color: "var(--muted)" }}
              >
                {todo.category}
              </span>
              {todo.deadline && (
                <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{todo.deadline}</span>
              )}
              <button
                onClick={() => store.deleteTodo(eventId, todo.id)}
                className="opacity-30 hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 size={13} style={{ color: "var(--muted)" }} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Done todos */}
      {showDone && doneTodos.length > 0 && (
        <div
          className="rounded-xl overflow-hidden opacity-60"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <div
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest border-b"
            style={{ color: "#10b981", backgroundColor: "var(--background)", borderColor: "var(--border)" }}
          >
            Afgerond ({doneTodos.length})
          </div>
          {doneTodos.map((todo, i) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: i < doneTodos.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <button onClick={() => store.toggleTodo(eventId, todo.id)} className="shrink-0">
                <CheckCircle2 size={16} style={{ color: "#10b981" }} />
              </button>
              <span
                className="flex-1 text-sm"
                style={{ color: "var(--muted)", textDecoration: "line-through" }}
              >
                {todo.text}
              </span>
              {todo.deadline && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>{todo.deadline}</span>
              )}
              <button
                onClick={() => store.deleteTodo(eventId, todo.id)}
                className="opacity-30 hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 size={13} style={{ color: "var(--muted)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UITWERKING TAB ───────────────────────────────────────────────────────

const BRIEFING_FIELDS: { key: keyof EventBriefing; label: string; placeholder: string; rows?: number }[] = [
  { key: "concept", label: "Eventconcept", placeholder: "Wat is het idee achter dit event? Waarvoor is het bedoeld?", rows: 4 },
  { key: "doelgroep", label: "Doelgroep", placeholder: "Wie zijn de deelnemers? Hoeveel, welk profiel?" },
  { key: "sfeerThema", label: "Sfeer & thema", placeholder: "Welke sfeer wil je neerzetten? Is er een thema?" },
  { key: "format", label: "Format", placeholder: "Hoe ziet de dag/avond eruit? Zittend, staand, workshops?" },
  { key: "bijzonderheden", label: "Bijzonderheden", placeholder: "Speciale wensen, aandachtspunten, restricties..." },
  { key: "dresscode", label: "Dresscode", placeholder: "Smart casual, business, thema-outfit..." },
  { key: "cateringWensen", label: "Catering-wensen", placeholder: "Dieetwensen, allergieën, gewenst type catering..." },
  { key: "avTechniek", label: "AV & techniek", placeholder: "Beamer, microfoon, LED wall, livestream..." },
  { key: "vrijeNotities", label: "Vrije notities", placeholder: "Alles wat verder van belang is...", rows: 4 },
];

const LOCATION_KEYWORDS = ["parkeer", "parkeren", "bereikbaar", "bereikbaarheid", "locatie", "adres", "noodplan", "regen", "slecht weer", "openbaar vervoer", "ov"];

function LocationReminderBanner({ onDismiss }: { onDismiss(): void }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
      style={{ backgroundColor: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
    >
      <Info size={15} className="shrink-0 mt-0.5" style={{ color: "#b45309" }} />
      <div className="flex-1" style={{ color: "#b45309" }}>
        <span className="font-semibold">Locatie-tip: </span>
        Vergeet niet parkeerinformatie, bereikbaarheid per OV en een noodplan bij slecht weer te regelen voor je gasten.
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} style={{ color: "#b45309" }} />
      </button>
    </div>
  );
}

function UitwerkingTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [locationBanner, setLocationBanner] = useState(false);
  const locationBannerShown = useRef(false);

  function handleFieldFocus(key: keyof EventBriefing) {
    if (!locationBannerShown.current && (key === "cateringWensen" || key === "bijzonderheden" || key === "vrijeNotities")) {
      const locationVal = event.briefing.cateringWensen + " " + event.briefing.bijzonderheden + " " + event.briefing.vrijeNotities;
      const hasKeyword = LOCATION_KEYWORDS.some((kw) => locationVal.toLowerCase().includes(kw));
      if (hasKeyword || key === "bijzonderheden") {
        setLocationBanner(true);
        locationBannerShown.current = true;
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {locationBanner && <LocationReminderBanner onDismiss={() => setLocationBanner(false)} />}
      {BRIEFING_FIELDS.map(({ key, label, placeholder, rows }) => (
        <div key={key}>
          <label
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
          >
            {label}
          </label>
          <textarea
            rows={rows ?? 2}
            value={event.briefing[key]}
            onChange={(e) => store.updateBriefingField(eventId, key, e.target.value)}
            onFocus={() => handleFieldFocus(key)}
            placeholder={placeholder}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              lineHeight: 1.7,
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── TIJDLIJN TAB ─────────────────────────────────────────────────────────

function TijdlijnTab({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId)!;
  const [showSuggestions, setShowSuggestions] = useState(true);

  const suggestions = generateSuggestions(event);
  const userItems = event.timeline.sort((a, b) => {
    const parseDate = (d: string) => {
      const months: Record<string, number> = { jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 };
      const [day, mon] = d.split(" ");
      return (months[mon] ?? 0) * 31 + parseInt(day, 10);
    };
    return parseDate(a.date) - parseDate(b.date);
  });

  // Merge user items and suggestions into one sorted list
  const allItems: Array<TimelineItem & { isSuggestion?: boolean }> = [
    ...userItems.map((t) => ({ ...t })),
    ...(showSuggestions
      ? suggestions.map((s) => ({ ...s, isSuggestion: true }))
      : []),
  ].sort((a, b) => {
    const parseDate = (d: string) => {
      const months: Record<string, number> = { jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 };
      const parts = d.split(" ");
      if (parts.length < 2) return 999;
      return (months[parts[1]] ?? 0) * 31 + parseInt(parts[0], 10);
    };
    return parseDate(a.date) - parseDate(b.date);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Tijdlijn
        </h2>
        <button
          onClick={() => setShowSuggestions((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            border: "1px solid var(--border)",
            color: showSuggestions ? "var(--accent)" : "var(--muted)",
            backgroundColor: "var(--card)",
          }}
        >
          <Sparkles size={12} />
          {suggestions.length} suggesties {showSuggestions ? "verbergen" : "tonen"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-24 top-3 bottom-3 w-px" style={{ backgroundColor: "var(--border)" }} />
        <div className="space-y-0">
          {allItems.map((item, i) => (
            <div
              key={`${item.isSuggestion ? "s" : "u"}-${item.id}-${i}`}
              className="flex gap-6 items-start py-4"
            >
              <div
                className="w-20 shrink-0 text-xs font-semibold text-right pt-0.5"
                style={{ color: item.done ? "var(--muted)" : item.isSuggestion ? "var(--muted)" : "var(--foreground)" }}
              >
                {item.date}
              </div>

              <div className="relative z-10 shrink-0 mt-1">
                {item.isSuggestion ? (
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ borderColor: "var(--accent)", backgroundColor: "var(--background)", borderStyle: "dashed" }}
                  />
                ) : item.done ? (
                  <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                ) : (
                  <button onClick={() => store.toggleTimelineItem(eventId, item.id)}>
                    <Circle size={16} className="hover:opacity-70 transition-opacity" style={{ color: "var(--border)" }} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                {item.isSuggestion ? (
                  <div
                    className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
                    style={{
                      border: "1px dashed var(--accent)",
                      backgroundColor: "rgba(232,111,163,0.05)",
                    }}
                  >
                    <Sparkles size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <span style={{ color: "var(--muted)" }}>{item.title}</span>
                    <button
                      onClick={() => store.adoptSuggestion(eventId, { date: item.date, title: item.title, done: false, linkedTodoId: item.linkedTodoId })}
                      className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: "rgba(232,111,163,0.15)", color: "var(--accent)" }}
                    >
                      Overnemen
                    </button>
                  </div>
                ) : (
                  <div>
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
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIL GENERATOR ───────────────────────────────────────────────────────

function MailGenerator({ eventName }: { eventName: string }) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  function checkLocationKeywords(text: string) {
    const lower = text.toLowerCase();
    const hasKeyword = LOCATION_KEYWORDS.some((kw) => lower.includes(kw));
    setShowLocationBanner(hasKeyword);
  }

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch("/api/generate-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, eventName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onbekende fout");
      setOutput(data.mail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <h3
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
      >
        Mail generator
      </h3>

      {showLocationBanner && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3 text-xs"
          style={{ backgroundColor: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <Info size={12} className="shrink-0 mt-0.5" style={{ color: "#b45309" }} />
          <span style={{ color: "#b45309" }}>Vergeet parkeerinformatie en OV-route niet te vermelden.</span>
          <button onClick={() => setShowLocationBanner(false)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
            <X size={11} style={{ color: "#b45309" }} />
          </button>
        </div>
      )}

      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          checkLocationKeywords(e.target.value);
        }}
        placeholder="Beschrijf kort wat je wil mailen..."
        className="w-full text-xs rounded-lg px-3 py-2.5 resize-none outline-none mb-2"
        style={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          lineHeight: 1.6,
        }}
      />

      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium mb-3 transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
        {loading ? "Genereren..." : "Mail genereren"}
      </button>

      {error && (
        <p className="text-xs mb-2" style={{ color: "#dc2626" }}>{error}</p>
      )}

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: "var(--muted)" }}>Gegenereerde mail</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-xs"
              style={{ color: copied ? "#10b981" : "var(--accent)" }}
            >
              <Copy size={11} />
              {copied ? "Gekopieerd!" : "Kopiëren"}
            </button>
          </div>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={12}
            className="w-full text-xs rounded-lg px-3 py-2.5 resize-y outline-none"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              lineHeight: 1.7,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useStore();
  const event = store.events.find((e) => e.id === Number(id));
  if (!event) notFound();

  const [activeTab, setActiveTab] = useState<Tab>("Programma");
  const st = statusConfig[event.status];

  const totalSpent = event.budgetCategories.reduce(
    (sum, cat) =>
      sum + cat.items.reduce((s, item) => s + item.amountExclVat * (1 + item.vatRate / 100), 0),
    0
  );

  const openTodos = event.todos.filter((t) => t.status !== "done");

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <header style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 px-8 pt-5 pb-3 text-xs" style={{ color: "var(--muted)" }}>
            <Link href="/events" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <ArrowLeft size={12} /> Events
            </Link>
            <ChevronRight size={11} />
            <span style={{ color: "var(--foreground)" }}>{event.name}</span>
          </div>

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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-0 h-full">
            {/* Main content */}
            <div className="flex-1 px-8 py-6 min-w-0 overflow-y-auto">

              {activeTab === "Programma" && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
                    Programma op de dag
                  </h2>
                  {event.program.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Nog geen programma uitgewerkt.</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-16 top-3 bottom-3 w-px" style={{ backgroundColor: "var(--border)" }} />
                      <div className="space-y-0">
                        {event.program.map((item, i) => (
                          <div key={i} className="flex gap-6 items-start py-4 relative">
                            <div className="w-14 shrink-0 text-sm font-semibold text-right" style={{ color: "var(--accent)" }}>
                              {item.time}
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 z-10" style={{ backgroundColor: "var(--accent)", outline: "3px solid var(--background)" }} />
                            <div className="flex-1 pb-1">
                              <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{item.title}</div>
                              {item.notes && <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "To do's" && <TodosTab eventId={event.id} />}
              {activeTab === "Uitwerking" && <UitwerkingTab eventId={event.id} />}
              {activeTab === "Budget" && <BudgetTab eventId={event.id} />}
              {activeTab === "Tijdlijn" && <TijdlijnTab eventId={event.id} />}
            </div>

            {/* Right sidebar */}
            <aside
              className="w-72 shrink-0 border-l px-5 py-6 space-y-7 overflow-y-auto"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            >
              {/* Samenvatting */}
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
                    { label: "Budget", value: `€ ${event.totalBudget.toLocaleString("nl-NL")}` },
                    { label: "Besteed", value: totalSpent > 0 ? `€ ${Math.round(totalSpent).toLocaleString("nl-NL")}` : "—" },
                    { label: "Open taken", value: `${openTodos.length}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: "var(--border)" }} />

              {/* Mail generator */}
              <MailGenerator eventName={event.name} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
