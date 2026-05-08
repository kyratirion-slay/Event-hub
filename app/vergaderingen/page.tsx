"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Check, X, NotebookPen } from "lucide-react";

interface PrepTab {
  id: number;
  title: string;
  content: string;
}

const STORAGE_KEY = "voorbereiding_tabs_v1";

function loadTabs(): PrepTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrepTab[];
  } catch {}
  return [];
}

function saveTabs(tabs: PrepTab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

function nextId(tabs: PrepTab[]): number {
  return tabs.length === 0 ? 1 : Math.max(...tabs.map((t) => t.id)) + 1;
}

export default function VoorbereididingPage() {
  const [tabs, setTabs] = useState<PrepTab[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = loadTabs();
    if (stored.length > 0) {
      setTabs(stored);
      setActiveId(stored[0].id);
    }
    setMounted(true);
  }, []);

  const persistTabs = useCallback((updated: PrepTab[]) => {
    setTabs(updated);
    saveTabs(updated);
  }, []);

  function addTab() {
    const newTab: PrepTab = {
      id: nextId(tabs),
      title: `Notitie ${tabs.length + 1}`,
      content: "",
    };
    const updated = [...tabs, newTab];
    persistTabs(updated);
    setActiveId(newTab.id);
    // Start renaming immediately
    setTimeout(() => {
      setRenamingId(newTab.id);
      setRenameValue(newTab.title);
    }, 50);
  }

  function deleteTab(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = tabs.filter((t) => t.id !== id);
    persistTabs(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  }

  function startRename(tab: PrepTab, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(tab.id);
    setRenameValue(tab.title);
    setTimeout(() => renameInputRef.current?.select(), 30);
  }

  function commitRename() {
    if (renamingId === null) return;
    const trimmed = renameValue.trim() || "Naamloos";
    persistTabs(tabs.map((t) => (t.id === renamingId ? { ...t, title: trimmed } : t)));
    setRenamingId(null);
  }

  function cancelRename() {
    setRenamingId(null);
  }

  function updateContent(content: string) {
    if (activeId === null) return;
    persistTabs(tabs.map((t) => (t.id === activeId ? { ...t, content } : t)));
  }

  const activeTab = tabs.find((t) => t.id === activeId) ?? null;

  if (!mounted) return null;

  return (
    <div className="flex h-full" style={{ backgroundColor: "var(--background)" }}>
      {/* Left panel — tab list */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "220px",
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center gap-2 px-4 py-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <NotebookPen size={15} style={{ color: "var(--accent)" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Notities
          </span>
        </div>

        {/* Tab list */}
        <div className="flex-1 overflow-y-auto py-2">
          {tabs.length === 0 && (
            <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
              Nog geen notities. Klik op + om te beginnen.
            </p>
          )}
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const isRenaming = tab.id === renamingId;
            return (
              <div
                key={tab.id}
                onClick={() => { setActiveId(tab.id); setRenamingId(null); }}
                className="group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(232,111,163,0.12)" : "transparent",
                }}
              >
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm rounded px-1 outline-none"
                    style={{
                      border: "1px solid var(--accent)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: isActive ? "var(--accent)" : "var(--foreground)", fontWeight: isActive ? 500 : 400 }}
                    onDoubleClick={(e) => startRename(tab, e)}
                    title="Dubbelklik om te hernoemen"
                  >
                    {tab.title}
                  </span>
                )}
                {!isRenaming && (
                  <button
                    onClick={(e) => deleteTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
                    title="Verwijderen"
                  >
                    <Trash2 size={12} style={{ color: "var(--muted)" }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add tab button */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={addTab}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} />
            Nieuw tabblad
          </button>
        </div>
      </div>

      {/* Right panel — note editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab ? (
          <>
            {/* Note title bar */}
            <div
              className="flex items-center gap-3 px-8 py-5 shrink-0"
              style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}
            >
              {renamingId === activeTab.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    onBlur={commitRename}
                    className="text-xl font-semibold outline-none rounded px-2 py-0.5"
                    style={{
                      border: "1px solid var(--accent)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                      minWidth: "200px",
                    }}
                    autoFocus
                  />
                  <button onClick={commitRename} title="Opslaan">
                    <Check size={16} style={{ color: "#10b981" }} />
                  </button>
                  <button onClick={cancelRename} title="Annuleren">
                    <X size={16} style={{ color: "var(--muted)" }} />
                  </button>
                </div>
              ) : (
                <h1
                  className="text-xl font-semibold cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ color: "var(--foreground)" }}
                  onDoubleClick={(e) => startRename(activeTab, e)}
                  title="Dubbelklik om te hernoemen"
                >
                  {activeTab.title}
                </h1>
              )}
            </div>

            {/* Note content */}
            <div className="flex-1 overflow-hidden p-8">
              <textarea
                ref={textareaRef}
                value={activeTab.content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="Begin hier met typen…"
                className="w-full h-full resize-none outline-none text-sm leading-relaxed"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                  caretColor: "var(--accent)",
                }}
                spellCheck
              />
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(232,111,163,0.1)" }}
            >
              <NotebookPen size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Geen notitie geselecteerd
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Maak een nieuw tabblad aan om te beginnen
              </p>
            </div>
            <button
              onClick={addTab}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              <Plus size={14} />
              Nieuw tabblad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
