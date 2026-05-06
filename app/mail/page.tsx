"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import { Wand2, Loader2, Copy, Check, RefreshCw, ChevronDown } from "lucide-react";

const PRESET_PROMPTS = [
  { label: "Uitnodiging versturen", value: "Schrijf een uitnodiging voor dit event. Vertel wat het event is, wanneer en waar het plaatsvindt, en vraag om RSVP." },
  { label: "Bevestiging aan deelnemers", value: "Schrijf een bevestigingsmail voor deelnemers die zich hebben aangemeld. Bevestig datum, tijd, locatie en geef praktische info." },
  { label: "Herinnering 1 week voor", value: "Schrijf een herinnering die 1 week voor het event verstuurd wordt. Vermelding van praktische details, parkeermogelijkheden en wat ze kunnen verwachten." },
  { label: "Bedankmail na afloop", value: "Schrijf een bedankmail die na het event verstuurd wordt. Bedank deelnemers voor hun aanwezigheid en geef een korte terugblik." },
  { label: "Leverancier contacteren", value: "Schrijf een mail aan een leverancier om een offerte op te vragen of een reservering te bevestigen voor dit event." },
  { label: "Annulering of wijziging", value: "Schrijf een mail om een wijziging of annulering door te geven aan deelnemers. Wees direct en bied eventueel alternatief aan." },
];

export default function MailPage() {
  const store = useStore();
  const [selectedEventId, setSelectedEventId] = useState<number | "">("");
  const [recipient, setRecipient] = useState("");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const selectedEvent = store.events.find((e) => e.id === Number(selectedEventId));

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch("/api/generate-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          eventName: selectedEvent?.name,
          recipientName: recipient.trim() || undefined,
          eventContext: selectedEvent
            ? `Datum: ${selectedEvent.date}, ${selectedEvent.startTime}–${selectedEvent.endTime}. Locatie: ${selectedEvent.location}. Gasten: ${selectedEvent.guests}. Type: ${selectedEvent.type}.`
            : undefined,
        }),
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

  function reset() {
    setOutput("");
    setError("");
    setPrompt("");
  }

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Mailgenerator</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Genereer professionele mails in jouw schrijfstijl
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── Left panel: input ── */}
          <div
            className="w-[420px] shrink-0 flex flex-col border-r overflow-y-auto"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="px-7 py-6 space-y-6">

              {/* Event selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  Event (optioneel)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(Number(e.target.value) || "")}
                  className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    color: selectedEventId ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  <option value="">Geen specifiek event</option>
                  {store.events.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {selectedEvent && (
                  <div className="mt-2 text-xs space-y-0.5" style={{ color: "var(--muted)" }}>
                    <div>{selectedEvent.date} · {selectedEvent.startTime}–{selectedEvent.endTime}</div>
                    <div>{selectedEvent.location}</div>
                  </div>
                )}
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  Ontvanger (optioneel)
                </label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Naam of rol ontvanger..."
                  className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>

              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Wat wil je mailen?
                  </label>
                  <button
                    onClick={() => setShowPresets((v) => !v)}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--accent)" }}
                  >
                    Voorbeelden <ChevronDown size={11} style={{ transform: showPresets ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
                  </button>
                </div>

                {/* Preset prompts */}
                {showPresets && (
                  <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {PRESET_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setPrompt(p.value); setShowPresets(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-opacity"
                        style={{
                          borderBottom: i < PRESET_PROMPTS.length - 1 ? "1px solid var(--border)" : "none",
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Beschrijf kort wat je wil communiceren. Bijv: 'Stuur een uitnodiging voor onze zomerborrel op 27 juni, rooftop NDSM, aanvang 17:00.'"
                  className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    lineHeight: 1.7,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {loading ? "Genereren..." : "Mail genereren"}
              </button>

              {error && (
                <p className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* ── Right panel: output ── */}
          <div className="flex-1 flex flex-col px-8 py-6 min-w-0">
            {output ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Gegenereerde mail
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                      style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--card)" }}
                    >
                      <RefreshCw size={11} /> Opnieuw
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: copied ? "#10b981" : "var(--foreground)", color: copied ? "#fff" : "var(--accent-light)" }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Gekopieerd!" : "Kopiëren"}
                    </button>
                  </div>
                </div>
                <textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  className="flex-1 text-sm rounded-xl px-6 py-5 resize-none outline-none"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    lineHeight: 1.85,
                    fontFamily: "inherit",
                  }}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "rgba(232,111,163,0.1)", border: "1px solid rgba(232,111,163,0.2)" }}
                >
                  <Wand2 size={28} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  Klaar om te schrijven
                </h3>
                <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>
                  Vul links je context in en klik op 'Mail genereren'. De output verschijnt hier en is direct bewerkbaar.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
