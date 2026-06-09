"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  Plus, Trash2, ChevronLeft,
  Bold, Italic, Underline, List, ListOrdered, Heading2, Heading1,
  IndentIncrease, IndentDecrease, NotebookPen,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface NoteSub {
  id: number;
  title: string;
  content: string;
}

interface NoteEvent {
  id: number;
  title: string;
  subcats: NoteSub[];
}

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "event_notities_v1";

function loadData(): NoteEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NoteEvent[];
  } catch {}
  return [];
}

function saveData(data: NoteEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(arr: { id: number }[]): number {
  return arr.length === 0 ? 1 : Math.max(...arr.map((x) => x.id)) + 1;
}

// ─── Drag helpers ────────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventNotitiesPage() {
  const router = useRouter();
  const [events, setEvents] = useState<NoteEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeSubId, setActiveSubId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Rename state
  const [renamingEventId, setRenamingEventId] = useState<number | null>(null);
  const [renamingSubId, setRenamingSubId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  // Drag state — events
  const [dragEvIdx, setDragEvIdx] = useState<number | null>(null);
  const [dragOverEvIdx, setDragOverEvIdx] = useState<number | null>(null);

  // Drag state — subcats
  const [dragSubIdx, setDragSubIdx] = useState<number | null>(null);
  const [dragOverSubIdx, setDragOverSubIdx] = useState<number | null>(null);

  // Editor
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingContent = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = loadData();
    setEvents(stored);
    if (stored.length > 0) {
      setActiveEventId(stored[0].id);
      if (stored[0].subcats.length > 0) setActiveSubId(stored[0].subcats[0].id);
    }
    setMounted(true);
  }, []);

  // ── Sync editor when active sub changes ────────────────────────────────

  useEffect(() => {
    if (!editorRef.current || !mounted) return;
    const activeSub = getActiveSub(events, activeEventId, activeSubId);
    editorRef.current.innerHTML = activeSub?.content ?? "";
    pendingContent.current = activeSub?.content ?? "";
  }, [activeSubId, activeEventId, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist helpers ─────────────────────────────────────────────────────

  const persist = useCallback((updated: NoteEvent[]) => {
    setEvents(updated);
    saveData(updated);
  }, []);

  function commitEditorContent(evs: NoteEvent[]): NoteEvent[] {
    if (activeEventId === null || activeSubId === null) return evs;
    const html = editorRef.current?.innerHTML ?? pendingContent.current;
    return evs.map((e) =>
      e.id !== activeEventId
        ? e
        : { ...e, subcats: e.subcats.map((s) => (s.id !== activeSubId ? s : { ...s, content: html })) }
    );
  }

  function handleEditorInput() {
    if (!editorRef.current) return;
    pendingContent.current = editorRef.current.innerHTML;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setEvents((prev) => {
        const updated = commitEditorContent(prev);
        saveData(updated);
        return updated;
      });
    }, 500);
  }

  // ── Switch active event ─────────────────────────────────────────────────

  function switchEvent(eventId: number) {
    setEvents((prev) => {
      const saved = commitEditorContent(prev);
      saveData(saved);
      return saved;
    });
    setActiveEventId(eventId);
    const ev = events.find((e) => e.id === eventId);
    setActiveSubId(ev?.subcats[0]?.id ?? null);
    setRenamingEventId(null);
    setRenamingSubId(null);
  }

  function switchSub(subId: number) {
    setEvents((prev) => {
      const saved = commitEditorContent(prev);
      saveData(saved);
      return saved;
    });
    setActiveSubId(subId);
    setRenamingSubId(null);
  }

  // ── Event CRUD ──────────────────────────────────────────────────────────

  function addEvent() {
    const newEv: NoteEvent = { id: nextId(events), title: "Nieuw event", subcats: [] };
    const updated = [...events, newEv];
    persist(updated);
    setActiveEventId(newEv.id);
    setActiveSubId(null);
    setTimeout(() => { setRenamingEventId(newEv.id); setRenameValue(newEv.title); renameRef.current?.select(); }, 50);
  }

  function deleteEvent(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = events.filter((ev) => ev.id !== id);
    persist(updated);
    if (activeEventId === id) {
      setActiveEventId(updated[0]?.id ?? null);
      setActiveSubId(updated[0]?.subcats[0]?.id ?? null);
    }
  }

  function startRenameEvent(ev: NoteEvent, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingEventId(ev.id);
    setRenameValue(ev.title);
    setTimeout(() => renameRef.current?.select(), 30);
  }

  function commitRenameEvent() {
    if (renamingEventId === null) return;
    persist(events.map((e) => (e.id === renamingEventId ? { ...e, title: renameValue.trim() || "Naamloos" } : e)));
    setRenamingEventId(null);
  }

  // ── Subcat CRUD ─────────────────────────────────────────────────────────

  function addSub() {
    if (activeEventId === null) return;
    const newSub: NoteSub = { id: Date.now(), title: "Nieuwe sectie", content: "" };
    const updated = events.map((e) =>
      e.id !== activeEventId ? e : { ...e, subcats: [...e.subcats, newSub] }
    );
    persist(updated);
    switchSub(newSub.id);
    setTimeout(() => { setRenamingSubId(newSub.id); setRenameValue(newSub.title); renameRef.current?.select(); }, 50);
  }

  function deleteSub(subId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (activeEventId === null) return;
    const updated = events.map((ev) => {
      if (ev.id !== activeEventId) return ev;
      const filtered = ev.subcats.filter((s) => s.id !== subId);
      return { ...ev, subcats: filtered };
    });
    persist(updated);
    if (activeSubId === subId) {
      const ev = updated.find((e) => e.id === activeEventId);
      setActiveSubId(ev?.subcats[0]?.id ?? null);
    }
  }

  function startRenameSub(sub: NoteSub, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingSubId(sub.id);
    setRenameValue(sub.title);
    setTimeout(() => renameRef.current?.select(), 30);
  }

  function commitRenameSub() {
    if (renamingSubId === null || activeEventId === null) return;
    persist(
      events.map((e) =>
        e.id !== activeEventId
          ? e
          : { ...e, subcats: e.subcats.map((s) => (s.id === renamingSubId ? { ...s, title: renameValue.trim() || "Naamloos" } : s)) }
      )
    );
    setRenamingSubId(null);
  }

  // ── Drag — events ───────────────────────────────────────────────────────

  function onEvDragStart(idx: number) { setDragEvIdx(idx); }
  function onEvDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverEvIdx(idx); }
  function onEvDrop(idx: number) {
    if (dragEvIdx === null || dragEvIdx === idx) { setDragEvIdx(null); setDragOverEvIdx(null); return; }
    persist(reorder(events, dragEvIdx, idx));
    setDragEvIdx(null);
    setDragOverEvIdx(null);
  }

  // ── Drag — subcats ──────────────────────────────────────────────────────

  function onSubDragStart(idx: number) { setDragSubIdx(idx); }
  function onSubDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverSubIdx(idx); }
  function onSubDrop(idx: number) {
    if (dragSubIdx === null || dragSubIdx === idx || activeEventId === null) { setDragSubIdx(null); setDragOverSubIdx(null); return; }
    persist(
      events.map((e) => e.id !== activeEventId ? e : { ...e, subcats: reorder(e.subcats, dragSubIdx, idx) })
    );
    setDragSubIdx(null);
    setDragOverSubIdx(null);
  }

  // ── Rich text commands ──────────────────────────────────────────────────

  function execCmd(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
  }

  // ── Derived ─────────────────────────────────────────────────────────────

  const activeEvent = events.find((e) => e.id === activeEventId) ?? null;
  const activeSub = getActiveSub(events, activeEventId, activeSubId);

  if (!mounted) return null;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>

        {/* ── Header ── */}
        <header
          className="flex items-center gap-4 px-6 py-4 shrink-0"
          style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            <ChevronLeft size={16} /> Terug
          </button>
          <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
          <div className="flex items-center gap-2">
            <NotebookPen size={16} style={{ color: "var(--accent)" }} />
            <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Event Notities</h1>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Events panel ── */}
          <div
            className="flex flex-col shrink-0"
            style={{ width: "200px", borderRight: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Events</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {events.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>Voeg een event toe om te starten.</p>
              )}
              {events.map((ev, idx) => {
                const isActive = ev.id === activeEventId;
                const isDragOver = dragOverEvIdx === idx;
                const isRenaming = renamingEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={() => onEvDragStart(idx)}
                    onDragOver={(e) => onEvDragOver(e, idx)}
                    onDrop={() => onEvDrop(idx)}
                    onDragEnd={() => { setDragEvIdx(null); setDragOverEvIdx(null); }}
                    onClick={() => switchEvent(ev.id)}
                    className="group flex items-center gap-2 mx-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isActive ? "rgba(232,111,163,0.12)" : isDragOver ? "rgba(232,111,163,0.06)" : "transparent",
                      borderTop: isDragOver ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <span className="text-xs opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing shrink-0" style={{ color: "var(--muted)" }}>⠿</span>
                    {isRenaming ? (
                      <input
                        ref={renameRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRenameEvent(); if (e.key === "Escape") setRenamingEventId(null); }}
                        onBlur={commitRenameEvent}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm rounded px-1 outline-none"
                        style={{ border: "1px solid var(--accent)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                        spellCheck={true}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        style={{ color: isActive ? "var(--accent)" : "var(--foreground)", fontWeight: isActive ? 500 : 400 }}
                        onDoubleClick={(e) => startRenameEvent(ev, e)}
                        title="Dubbelklik om te hernoemen"
                      >
                        {ev.title}
                      </span>
                    )}
                    {!isRenaming && (
                      <button
                        onClick={(e) => deleteEvent(ev.id, e)}
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
            <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={addEvent}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <Plus size={12} /> Event toevoegen
              </button>
            </div>
          </div>

          {/* ── Subcats panel ── */}
          <div
            className="flex flex-col shrink-0"
            style={{ width: "190px", borderRight: "1px solid var(--border)", backgroundColor: "var(--background)" }}
          >
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              <span className="text-xs font-semibold uppercase tracking-widest truncate block" style={{ color: "var(--muted)" }}>
                {activeEvent?.title ?? "Secties"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {activeEventId === null && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>Selecteer een event.</p>
              )}
              {activeEvent?.subcats.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>Nog geen secties.</p>
              )}
              {activeEvent?.subcats.map((sub, idx) => {
                const isActive = sub.id === activeSubId;
                const isDragOver = dragOverSubIdx === idx;
                const isRenaming = renamingSubId === sub.id;
                return (
                  <div
                    key={sub.id}
                    draggable
                    onDragStart={() => onSubDragStart(idx)}
                    onDragOver={(e) => onSubDragOver(e, idx)}
                    onDrop={() => onSubDrop(idx)}
                    onDragEnd={() => { setDragSubIdx(null); setDragOverSubIdx(null); }}
                    onClick={() => switchSub(sub.id)}
                    className="group flex items-center gap-2 mx-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isActive ? "rgba(232,111,163,0.12)" : isDragOver ? "rgba(232,111,163,0.06)" : "transparent",
                      borderTop: isDragOver ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <span className="text-xs opacity-0 group-hover:opacity-40 cursor-grab shrink-0" style={{ color: "var(--muted)" }}>⠿</span>
                    {isRenaming ? (
                      <input
                        ref={renameRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRenameSub(); if (e.key === "Escape") setRenamingSubId(null); }}
                        onBlur={commitRenameSub}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm rounded px-1 outline-none"
                        style={{ border: "1px solid var(--accent)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                        spellCheck={true}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        style={{ color: isActive ? "var(--accent)" : "var(--foreground)", fontWeight: isActive ? 500 : 400 }}
                        onDoubleClick={(e) => startRenameSub(sub, e)}
                        title="Dubbelklik om te hernoemen"
                      >
                        {sub.title}
                      </span>
                    )}
                    {!isRenaming && (
                      <button
                        onClick={(e) => deleteSub(sub.id, e)}
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
            {activeEventId !== null && (
              <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={addSub}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ border: "1px solid var(--accent)", color: "var(--accent)", backgroundColor: "transparent" }}
                >
                  <Plus size={12} /> Sectie toevoegen
                </button>
              </div>
            )}
          </div>

          {/* ── Editor ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSub ? (
              <>
                {/* Toolbar */}
                <div
                  className="flex items-center gap-1 px-4 py-2 shrink-0 flex-wrap"
                  style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                >
                  <ToolbarBtn title="Kop 1" onClick={() => execCmd("formatBlock", "h1")}><Heading1 size={14} /></ToolbarBtn>
                  <ToolbarBtn title="Kop 2" onClick={() => execCmd("formatBlock", "h2")}><Heading2 size={14} /></ToolbarBtn>
                  <ToolbarDivider />
                  <ToolbarBtn title="Vet (Ctrl+B)" onClick={() => execCmd("bold")}><Bold size={14} /></ToolbarBtn>
                  <ToolbarBtn title="Cursief (Ctrl+I)" onClick={() => execCmd("italic")}><Italic size={14} /></ToolbarBtn>
                  <ToolbarBtn title="Onderstrepen (Ctrl+U)" onClick={() => execCmd("underline")}><Underline size={14} /></ToolbarBtn>
                  <ToolbarDivider />
                  <ToolbarBtn title="Opsommingslijst" onClick={() => execCmd("insertUnorderedList")}><List size={14} /></ToolbarBtn>
                  <ToolbarBtn title="Genummerde lijst" onClick={() => execCmd("insertOrderedList")}><ListOrdered size={14} /></ToolbarBtn>
                  <ToolbarDivider />
                  <ToolbarBtn title="Inspringing vergroten" onClick={() => execCmd("indent")}><IndentIncrease size={14} /></ToolbarBtn>
                  <ToolbarBtn title="Inspringing verkleinen" onClick={() => execCmd("outdent")}><IndentDecrease size={14} /></ToolbarBtn>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-y-auto px-10 py-8">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={true}
                    onInput={handleEditorInput}
                    data-placeholder="Begin hier met typen…"
                    className="outline-none min-h-full text-sm leading-relaxed"
                    style={{
                      color: "var(--foreground)",
                      caretColor: "var(--accent)",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <NotebookPen size={32} style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {activeEvent ? "Selecteer of maak een sectie aan" : "Selecteer of maak een event aan"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        [contenteditable] h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.4rem; }
        [contenteditable] h2 { font-size: 1.15rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
        [contenteditable] ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.25rem 0; }
        [contenteditable] ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.25rem 0; }
        [contenteditable] li { display: list-item !important; margin: 0.15rem 0; }
        [contenteditable] p { margin: 0.2rem 0; }
        [contenteditable][data-placeholder]:empty::before { content: attr(data-placeholder); color: var(--muted); pointer-events: none; }
      `}</style>
    </div>
  );
}

// ─── Toolbar helpers ─────────────────────────────────────────────────────────

function ToolbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-1.5 rounded transition-colors hover:opacity-80"
      style={{ color: "var(--foreground)", backgroundColor: "transparent" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--border)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: "var(--border)" }} />;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function getActiveSub(events: NoteEvent[], eventId: number | null, subId: number | null): NoteSub | null {
  if (!eventId || !subId) return null;
  return events.find((e) => e.id === eventId)?.subcats.find((s) => s.id === subId) ?? null;
}
