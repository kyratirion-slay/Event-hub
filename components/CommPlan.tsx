"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { generateCommSteps, formatIsoDate, daysFromToday, toIso, commStepsToIcs } from "@/lib/communication";
import type { CommStep } from "@/lib/types";
import { Plus, Trash2, Circle, CheckCircle2, Send, RefreshCw, Pencil, CalendarPlus } from "lucide-react";

// Status van een stap → kleur + badge-tekst
function stepStatus(step: CommStep): { dot: string; badge?: { text: string; color: string } } {
  if (step.done) return { dot: "#10b981" };
  const d = daysFromToday(step.date);
  if (d < 0) return { dot: "#dc2626", badge: { text: d === -1 ? "1 dag te laat" : `${-d} dagen te laat`, color: "#dc2626" } };
  if (d === 0) return { dot: "#d97706", badge: { text: "vandaag", color: "#d97706" } };
  if (d <= 7) return { dot: "#d97706", badge: { text: d === 1 ? "morgen" : `over ${d} dagen`, color: "#d97706" } };
  return { dot: "var(--border)" };
}

const dateInputCss: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
  colorScheme: "light",
};

function StepRow({ step, eventId }: { step: CommStep; eventId: number }) {
  const store = useStore();
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(step.title);
  const [descDraft, setDescDraft] = useState(step.description || "");
  const { dot, badge } = stepStatus(step);

  function save() {
    store.updateCommStep(eventId, step.id, {
      title: titleDraft.trim() || step.title,
      description: descDraft.trim() || undefined,
    });
    setEditing(false);
  }

  return (
    <div className="flex items-start gap-3 py-3 group" style={{ borderBottom: "1px solid var(--border)", opacity: step.done ? 0.55 : 1 }}>
      {/* Toggle + timeline dot */}
      <button onClick={() => store.toggleCommStep(eventId, step.id)} className="shrink-0 mt-0.5" title={step.done ? "Markeer als open" : "Markeer als gedaan"}>
        {step.done
          ? <CheckCircle2 size={16} style={{ color: "#10b981" }} />
          : <Circle size={16} className="hover:opacity-60 transition-opacity" style={{ color: dot }} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-1.5">
            <input
              autoFocus
              spellCheck={true}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              className="w-full text-sm font-medium bg-transparent outline-none"
              style={{ borderBottom: "1.5px solid var(--accent)", color: "var(--foreground)" }}
            />
            <input
              spellCheck={true}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              onBlur={save}
              placeholder="Toelichting..."
              className="w-full text-xs bg-transparent outline-none"
              style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}
            />
          </div>
        ) : (
          <div onClick={() => { setTitleDraft(step.title); setDescDraft(step.description || ""); setEditing(true); }} className="cursor-text">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)", textDecoration: step.done ? "line-through" : "none" }}>
                {step.title}
              </span>
              {badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
                  {badge.text}
                </span>
              )}
              <Pencil size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--muted)" }} />
            </div>
            {step.description && (
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{step.description}</div>
            )}
          </div>
        )}
      </div>

      {/* Date */}
      <input
        type="date"
        value={step.date}
        onChange={(e) => { if (e.target.value) store.updateCommStep(eventId, step.id, { date: e.target.value }); }}
        className="shrink-0 text-xs rounded-lg px-2 py-1 outline-none"
        style={dateInputCss}
      />

      {/* Delete */}
      <button
        onClick={() => store.deleteCommStep(eventId, step.id)}
        className="shrink-0 mt-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
        title="Stap verwijderen"
      >
        <Trash2 size={13} style={{ color: "var(--muted)" }} />
      </button>
    </div>
  );
}

export default function CommPlanEditor({ eventId }: { eventId: number }) {
  const store = useStore();
  const event = store.events.find((e) => e.id === eventId);
  const [inviteDraft, setInviteDraft] = useState(event?.inviteDate || "");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => toIso(new Date()));
  const [newDesc, setNewDesc] = useState("");
  if (!event) return null;

  const hasPlan = event.commSteps !== undefined;
  const steps = [...(event.commSteps ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const openCount = steps.filter((s) => !s.done).length;

  function generate() {
    if (!inviteDraft || !event) return;
    store.setCommPlan(event.id, inviteDraft, generateCommSteps(inviteDraft, event.date));
  }

  function regenerate() {
    if (!inviteDraft || !event) return;
    if (!window.confirm("Dit vervangt alle huidige stappen door een nieuw stappenplan. Doorgaan?")) return;
    store.setCommPlan(event.id, inviteDraft, generateCommSteps(inviteDraft, event.date));
  }

  function addStep() {
    if (!newTitle.trim() || !newDate || !event) return;
    store.addCommStep(event.id, { title: newTitle.trim(), description: newDesc.trim() || undefined, date: newDate, done: false });
    setNewTitle(""); setNewDesc(""); setAdding(false);
  }

  function exportIcs() {
    if (!event) return;
    const open = steps.filter((s) => !s.done);
    if (open.length === 0) return;
    const blob = new Blob([commStepsToIcs(event.name, open)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `communicatie-${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Nog geen plan: setup ──
  if (!hasPlan) {
    return (
      <div className="rounded-xl p-6" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Send size={15} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Communicatielijn plannen</h3>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted)" }}>
          Vul in wanneer de uitnodiging de deur uit gaat. Er wordt dan automatisch een stappenplan
          gezet — van gastenlijst checken tot reminders en de laatste info-mail. Alle stappen zijn
          daarna aan te passen, te verschuiven of te verwijderen.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={inviteDraft}
            onChange={(e) => setInviteDraft(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 outline-none"
            style={dateInputCss}
          />
          <button
            onClick={generate}
            disabled={!inviteDraft}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Send size={13} /> Genereer stappenplan
          </button>
          <button
            onClick={() => store.setCommPlan(event.id, inviteDraft || undefined, [])}
            className="text-xs"
            style={{ color: "var(--muted)" }}
          >
            of begin met een lege tijdlijn
          </button>
        </div>
      </div>
    );
  }

  // ── Plan bestaat: tijdlijn ──
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b flex-wrap" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Uitnodiging uit:</span>
          <input
            type="date"
            value={inviteDraft}
            onChange={(e) => {
              setInviteDraft(e.target.value);
              if (e.target.value) store.setCommPlan(event.id, e.target.value, event.commSteps ?? []);
            }}
            className="text-xs rounded-lg px-2 py-1 outline-none"
            style={dateInputCss}
          />
          {openCount > 0 && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>{openCount} open {openCount === 1 ? "stap" : "stappen"}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {steps.some((s) => !s.done) && (
            <button
              onClick={exportIcs}
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--muted)" }}
              title="Download agenda-bestand (.ics) — importeer in Outlook/Google/Apple Agenda voor herinneringen op je telefoon of mail"
            >
              <CalendarPlus size={11} /> Agenda
            </button>
          )}
          <button
            onClick={regenerate}
            disabled={!inviteDraft}
            className="flex items-center gap-1 text-xs disabled:opacity-40"
            style={{ color: "var(--muted)" }}
            title="Vervangt alle stappen door een vers template"
          >
            <RefreshCw size={11} /> Opnieuw genereren
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            <Plus size={12} /> Stap
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-5 py-4 border-b space-y-2.5" style={{ borderColor: "var(--border)" }}>
          <input
            autoFocus
            spellCheck={true}
            placeholder="Omschrijving stap..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addStep(); if (e.key === "Escape") setAdding(false); }}
            className="w-full text-sm outline-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="text-xs rounded-lg px-2 py-1 outline-none"
              style={dateInputCss}
            />
            <input
              spellCheck={true}
              placeholder="Toelichting (optioneel)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addStep(); }}
              className="flex-1 text-xs outline-none bg-transparent border-b pb-0.5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            />
            <button
              onClick={addStep}
              disabled={!newTitle.trim() || !newDate}
              className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
            >
              Toevoegen
            </button>
            <button onClick={() => setAdding(false)} className="text-xs" style={{ color: "var(--muted)" }}>Annuleren</button>
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nog geen stappen. Voeg er een toe of genereer het stappenplan.</p>
        </div>
      ) : (
        <div className="px-5">
          {steps.map((step) => <StepRow key={step.id} step={step} eventId={event.id} />)}
        </div>
      )}

      {/* Footer: event date reference */}
      <div className="px-5 py-2.5 text-xs flex items-center justify-between" style={{ color: "var(--muted)", backgroundColor: "var(--background)" }}>
        <span>Eventdatum: {event.date || "onbekend"}</span>
        {event.inviteDate && <span>Uitnodiging: {formatIsoDate(event.inviteDate)}</span>}
      </div>
    </div>
  );
}
