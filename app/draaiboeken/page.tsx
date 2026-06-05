"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Plus, Trash2, Copy, Check, BookOpen, Pencil, X } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DraaiboekItem {
  id: number;
  text: string;
}

interface DraaiboekSection {
  id: number;
  title: string;
  items: DraaiboekItem[];
}

interface ProgramLine {
  id: number;
  text: string;
}

interface Draaiboek {
  id: number;
  title: string;
  eventName: string;
  eventDate: string;
  aantalAanwezigen: string;
  contactpersoon: string;
  programLines: ProgramLine[];
  sections: DraaiboekSection[];
}

// ─── Template ────────────────────────────────────────────────────────────────

function createTemplate(): Omit<Draaiboek, "id"> {
  return {
    title: "Nieuw draaiboek",
    eventName: "",
    eventDate: "",
    aantalAanwezigen: "",
    contactpersoon: "",
    programLines: [
      { id: 1, text: "Vanaf ca.  –  | inloop en ontvangst in " },
      { id: 2, text: " –  | inhoudelijk deel" },
      { id: 3, text: "  | start borrel in " },
      { id: 4, text: "Ca.  einde" },
    ],
    sections: [
      {
        id: 1, title: "Facilitair", items: [
          { id: 1, text: "Klaarzetten opstelling in  (extra stoelen opstellen aan de achterkant)" },
          { id: 2, text: "Bordje plaatsen met de tekst dat er foto's/opnames worden gemaakt (bij receptie). Bordje ligt bij receptie" },
          { id: 3, text: "Schrijfblokjes/pennen plaatsen in ruimte" },
          { id: 4, text: "Garderoberek klaarzetten bij zitje in ontvangstruimte (voor taatsdeuren)" },
          { id: 5, text: "2 x banners plaatsen (Welkom in ontvangstruimte en nog 1 van  links of in de buurt van glazen poortje)" },
          { id: 6, text: "Statafels met rokken klaarzetten in het workcafé" },
          { id: 7, text: "Groot scherm op de  neerzetten waar een presentatie op te zien is" },
        ],
      },
      {
        id: 2, title: "IT", items: [
          { id: 1, text: "Presentatie en/of sheet op beeldscherm boardroom klaarzetten (uiterlijk )" },
          { id: 2, text: " presentatie naar IT doorsturen" },
          { id: 3, text: " presentatie voor scherm workcafé naar IT doorsturen" },
        ],
      },
      {
        id: 3, title: "Catering", items: [
          { id: 1, text: "Verzorgen ontvangst vanaf  (buffet met fris/water/sap/koffie/thee en iets lekkers)" },
          { id: 2, text: "Vanaf ca.  verzorgen van uitgebreide borrel — graag hapjes direct serveren om  in verband met snelle vertrekkers" },
        ],
      },
      {
        id: 4, title: "Receptie", items: [
          { id: 1, text: "Verzorgen ontvangst bezoekers" },
          { id: 2, text: "Receptie geeft badges uit,  stuurt de presentielijst door naar de receptie" },
          { id: 3, text: "Ervoor zorgen dat er water/glazen op tafeltjes worden gezet t.b.v. sprekers" },
          { id: 4, text: "Intekenlijst aan  geven" },
        ],
      },
      {
        id: 5, title: "Beveiliging", items: [
          { id: 1, text: "Bezoekers van het event mogen na afloop parkeerkaartjes afstempelen. Graag rapporteren in rapportage" },
          { id: 2, text: "Indien nodig assisteren van collega's/bezoekers naar  (bedienen lift)" },
        ],
      },
      {
        id: 6, title: "Schoonmaak", items: [
          { id: 1, text: "Zorgen dat voor aanvang ruimte is nagelopen, toiletten schoon zijn en papieren handdoekjes zijn aangevuld" },
          { id: 2, text: " ochtend  schoonmaken" },
        ],
      },
    ],
  };
}

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "draaiboeken_v1";

function loadAll(): Draaiboek[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Draaiboek[];
  } catch {}
  return [];
}

function saveAll(data: Draaiboek[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(arr: { id: number }[]): number {
  return arr.length === 0 ? 1 : Math.max(...arr.map((x) => x.id)) + 1;
}

// ─── Copy helper ─────────────────────────────────────────────────────────────

function draaiboekToText(d: Draaiboek): string {
  const lines: string[] = [];
  const name = d.eventName || "[eventnaam]";
  const date = d.eventDate || "[datum]";
  lines.push(`Hierbij draaiboek voor ${name} op ${date}.`);
  lines.push("");
  lines.push("Programma bijeenkomst:");
  d.programLines.forEach((l) => lines.push(l.text));
  lines.push("");
  lines.push(`Verwacht aantal aanwezigen: ${d.aantalAanwezigen || "..."}`);
  lines.push(`Contactpersoon: ${d.contactpersoon || "..."}`);
  lines.push("");
  d.sections.forEach((sec) => {
    lines.push(`@ ${sec.title}`);
    lines.push("");
    sec.items.forEach((item) => lines.push(`- ${item.text}`));
    lines.push("");
  });
  lines.push("Als er aanvullingen/opmerkingen zijn, laat het weten.");
  return lines.join("\n");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DraaiboekPage() {
  const [draaiboeken, setDraaiboeken] = useState<Draaiboek[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renamingListId, setRenamingListId] = useState<number | null>(null);
  const [renameListValue, setRenameListValue] = useState("");
  const [renamingSectionId, setRenamingSectionId] = useState<number | null>(null);
  const [renameSectionValue, setRenameSectionValue] = useState("");

  useEffect(() => {
    const stored = loadAll();
    setDraaiboeken(stored);
    if (stored.length > 0) setActiveId(stored[0].id);
    setMounted(true);
  }, []);

  const persist = useCallback((updated: Draaiboek[]) => {
    setDraaiboeken(updated);
    saveAll(updated);
  }, []);

  const active = draaiboeken.find((d) => d.id === activeId) ?? null;

  function updateActive(changes: Partial<Draaiboek>) {
    if (!active) return;
    persist(draaiboeken.map((d) => (d.id === activeId ? { ...d, ...changes } : d)));
  }

  // ── List CRUD ────────────────────────────────────────────────────────────

  function addNew() {
    const template = createTemplate();
    const newD: Draaiboek = { ...template, id: nextId(draaiboeken) };
    const updated = [...draaiboeken, newD];
    persist(updated);
    setActiveId(newD.id);
  }

  function deleteActive() {
    const updated = draaiboeken.filter((d) => d.id !== activeId);
    persist(updated);
    setActiveId(updated[0]?.id ?? null);
  }

  // ── Program lines ────────────────────────────────────────────────────────

  function updateLine(lineId: number, text: string) {
    if (!active) return;
    updateActive({ programLines: active.programLines.map((l) => (l.id === lineId ? { ...l, text } : l)) });
  }

  function deleteLine(lineId: number) {
    if (!active) return;
    updateActive({ programLines: active.programLines.filter((l) => l.id !== lineId) });
  }

  function addLine() {
    if (!active) return;
    updateActive({ programLines: [...active.programLines, { id: nextId(active.programLines), text: "" }] });
  }

  // ── Section CRUD ─────────────────────────────────────────────────────────

  function renameSection(secId: number, title: string) {
    if (!active) return;
    updateActive({ sections: active.sections.map((s) => (s.id === secId ? { ...s, title } : s)) });
  }

  function deleteSection(secId: number) {
    if (!active) return;
    updateActive({ sections: active.sections.filter((s) => s.id !== secId) });
  }

  function addSection() {
    if (!active) return;
    const newSec: DraaiboekSection = { id: nextId(active.sections), title: "Nieuwe sectie", items: [] };
    updateActive({ sections: [...active.sections, newSec] });
    setTimeout(() => { setRenamingSectionId(newSec.id); setRenameSectionValue(newSec.title); }, 30);
  }

  // ── Item CRUD ────────────────────────────────────────────────────────────

  function updateItem(secId: number, itemId: number, text: string) {
    if (!active) return;
    updateActive({
      sections: active.sections.map((s) =>
        s.id !== secId ? s : { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
      ),
    });
  }

  function deleteItem(secId: number, itemId: number) {
    if (!active) return;
    updateActive({ sections: active.sections.map((s) => s.id !== secId ? s : { ...s, items: s.items.filter((it) => it.id !== itemId) }) });
  }

  function addItem(secId: number) {
    if (!active) return;
    const sec = active.sections.find((s) => s.id === secId);
    if (!sec) return;
    const newItem: DraaiboekItem = { id: nextId(sec.items), text: "" };
    updateActive({ sections: active.sections.map((s) => s.id !== secId ? s : { ...s, items: [...s.items, newItem] }) });
  }

  // ── Copy ─────────────────────────────────────────────────────────────────

  function copyAll() {
    if (!active) return;
    navigator.clipboard.writeText(draaiboekToText(active)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!mounted) return null;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>

        {/* ── Header ── */}
        <header
          className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={18} style={{ color: "var(--accent)" }} />
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Draaiboeken</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                Vul in, pas aan en kopieer klaar voor gebruik
              </p>
            </div>
          </div>
          {active && (
            <button
              onClick={copyAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: copied ? "#10b981" : "var(--foreground)", color: copied ? "#fff" : "var(--accent-light)" }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Gekopieerd!" : "Kopieer alles"}
            </button>
          )}
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── List panel ── */}
          <div
            className="flex flex-col shrink-0"
            style={{ width: "220px", borderRight: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Draaiboeken</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {draaiboeken.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>Nog geen draaiboeken.</p>
              )}
              {draaiboeken.map((d) => {
                const isActive = d.id === activeId;
                const isRenaming = renamingListId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => { setActiveId(d.id); setRenamingListId(null); }}
                    className="group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{ backgroundColor: isActive ? "rgba(232,111,163,0.12)" : "transparent" }}
                  >
                    {isRenaming ? (
                      <input
                        value={renameListValue}
                        onChange={(e) => setRenameListValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { persist(draaiboeken.map((x) => x.id === d.id ? { ...x, title: renameListValue.trim() || "Naamloos" } : x)); setRenamingListId(null); }
                          if (e.key === "Escape") setRenamingListId(null);
                        }}
                        onBlur={() => { persist(draaiboeken.map((x) => x.id === d.id ? { ...x, title: renameListValue.trim() || "Naamloos" } : x)); setRenamingListId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm rounded px-1 outline-none"
                        style={{ border: "1px solid var(--accent)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        style={{ color: isActive ? "var(--accent)" : "var(--foreground)", fontWeight: isActive ? 500 : 400 }}
                        onDoubleClick={(e) => { e.stopPropagation(); setRenamingListId(d.id); setRenameListValue(d.title); }}
                        title="Dubbelklik om te hernoemen"
                      >
                        {d.title}
                      </span>
                    )}
                    {!isRenaming && isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm("Dit draaiboek verwijderen?")) deleteActive(); }}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity shrink-0"
                        title="Verwijderen"
                      >
                        <Trash2 size={11} style={{ color: "var(--muted)" }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={addNew}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <Plus size={12} /> Nieuw draaiboek
              </button>
            </div>
          </div>

          {/* ── Editor ── */}
          <div className="flex-1 overflow-y-auto">
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <BookOpen size={32} style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>Maak een nieuw draaiboek aan om te beginnen</p>
                <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
                  <Plus size={14} /> Nieuw draaiboek
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">

                {/* Header info */}
                <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>
                    Hierbij draaiboek voor{" "}
                    <InlineField
                      value={active.eventName}
                      placeholder="eventnaam"
                      onChange={(v) => updateActive({ eventName: v })}
                    />{" "}
                    op{" "}
                    <InlineField
                      value={active.eventDate}
                      placeholder="datum"
                      onChange={(v) => updateActive({ eventDate: v })}
                    />.
                  </p>

                  <div>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--muted)" }}>Programma bijeenkomst</p>
                    <div className="space-y-1">
                      {active.programLines.map((line) => (
                        <div key={line.id} className="flex items-center gap-2 group">
                          <input
                            value={line.text}
                            onChange={(e) => updateLine(line.id, e.target.value)}
                            className="flex-1 text-sm px-2 py-1 rounded outline-none"
                            style={{ backgroundColor: "transparent", color: "var(--foreground)", border: "1px solid transparent" }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "var(--background)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.backgroundColor = "transparent"; }}
                          />
                          <button onClick={() => deleteLine(line.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity shrink-0">
                            <X size={11} style={{ color: "var(--muted)" }} />
                          </button>
                        </div>
                      ))}
                      <button onClick={addLine} className="text-xs flex items-center gap-1 mt-1 hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>
                        <Plus size={11} /> Regel toevoegen
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: "var(--muted)" }}>Verwacht aantal aanwezigen</label>
                      <input
                        value={active.aantalAanwezigen}
                        onChange={(e) => updateActive({ aantalAanwezigen: e.target.value })}
                        placeholder="bijv. 45"
                        className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: "var(--muted)" }}>Contactpersoon</label>
                      <input
                        value={active.contactpersoon}
                        onChange={(e) => updateActive({ contactpersoon: e.target.value })}
                        placeholder="naam + functie"
                        className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sections */}
                {active.sections.map((sec) => (
                  <div key={sec.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {/* Section header */}
                    <div
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ backgroundColor: "rgba(232,111,163,0.07)", borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>@</span>
                      {renamingSectionId === sec.id ? (
                        <input
                          value={renameSectionValue}
                          onChange={(e) => setRenameSectionValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { renameSection(sec.id, renameSectionValue.trim() || sec.title); setRenamingSectionId(null); }
                            if (e.key === "Escape") setRenamingSectionId(null);
                          }}
                          onBlur={() => { renameSection(sec.id, renameSectionValue.trim() || sec.title); setRenamingSectionId(null); }}
                          className="flex-1 text-sm font-bold rounded px-1 outline-none"
                          style={{ border: "1px solid var(--accent)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm font-bold" style={{ color: "var(--foreground)" }}>{sec.title}</span>
                      )}
                      <button
                        onClick={() => { setRenamingSectionId(sec.id); setRenameSectionValue(sec.title); }}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                        title="Hernoemen"
                      >
                        <Pencil size={12} style={{ color: "var(--muted)" }} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Sectie "${sec.title}" verwijderen?`)) deleteSection(sec.id); }}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                        title="Sectie verwijderen"
                      >
                        <Trash2 size={12} style={{ color: "var(--muted)" }} />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="px-5 py-3 space-y-1" style={{ backgroundColor: "var(--card)" }}>
                      {sec.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group">
                          <span className="text-xs mt-2 shrink-0" style={{ color: "var(--muted)" }}>–</span>
                          <input
                            value={item.text}
                            onChange={(e) => updateItem(sec.id, item.id, e.target.value)}
                            className="flex-1 text-sm px-2 py-1.5 rounded outline-none"
                            style={{ backgroundColor: "transparent", border: "1px solid transparent", color: "var(--foreground)" }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "var(--background)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.backgroundColor = "transparent"; }}
                          />
                          <button
                            onClick={() => deleteItem(sec.id, item.id)}
                            className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity shrink-0 mt-2"
                            title="Verwijderen"
                          >
                            <X size={11} style={{ color: "var(--muted)" }} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem(sec.id)}
                        className="text-xs flex items-center gap-1 mt-2 hover:opacity-70 transition-opacity"
                        style={{ color: "var(--accent)" }}
                      >
                        <Plus size={11} /> Actiepunt toevoegen
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add section */}
                <button
                  onClick={addSection}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ border: "2px dashed var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
                >
                  <Plus size={14} /> Sectie toevoegen
                </button>

                {/* Footer note */}
                <p className="text-sm pb-4" style={{ color: "var(--muted)" }}>
                  Als er aanvullingen/opmerkingen zijn, laat het weten.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Inline field helper ─────────────────────────────────────────────────────

function InlineField({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm rounded px-1 outline-none inline-block"
      style={{
        minWidth: "80px",
        width: `${Math.max(80, (value.length || placeholder.length) * 8 + 16)}px`,
        border: "1px dashed var(--border)",
        backgroundColor: "transparent",
        color: value ? "var(--foreground)" : "var(--muted)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    />
  );
}
