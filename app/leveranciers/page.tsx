"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import type { Supplier } from "@/lib/types";
import {
  Plus, Search, X, MapPin, Phone, Mail, User, Euro,
  Trash2, Pencil, Map, List, Grid3x3,
  ExternalLink, ChevronDown, Check,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FIXED_CATS = [
  { id: "event-locaties", label: "Event locaties" },
  { id: "catering",       label: "Catering & restaurants" },
  { id: "sprekers",       label: "Sprekers & entertainment" },
  { id: "overig",         label: "Overig" },
] as const;

const CAT_COLORS: Record<string, string> = {
  "event-locaties": "#4f8cc9",
  "catering":       "#6dc88a",
  "sprekers":       "#a96ec8",
  "overig":         "#8b8a7a",
};

const TYPE_EVENT_OPTIONS = ["Corporate", "Leisure", "Hybride", "Intern", "Extern"];
const TAAL_OPTIONS       = ["Nederlands", "Engels", "Duits", "Overig"];
const DAGDEEL_OPTIONS    = ["Ochtend", "Middag", "Avond", "Geen voorkeur"];
const REGIO_OPTIONS      = ["Noord-Holland", "Zuid-Holland", "Noord-Brabant", "Utrecht", "Nationaal", "Internationaal"];

function catColor(cat: string) { return CAT_COLORS[cat] ?? "#e86fa3"; }
function catLabel(cat: string, customCats: string[]) {
  return FIXED_CATS.find(c => c.id === cat)?.label ?? (customCats.includes(cat) ? cat : cat);
}

// ─── FILTER DROPDOWN ─────────────────────────────────────────────────────────

function FilterDropdown({
  label, options, selected, onToggle, onClear,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle(opt: string): void;
  onClear(): void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const active = selected.length > 0;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
        style={active
          ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)" }
          : { border: "1px solid var(--border)", color: "var(--muted)" }
        }
      >
        {active ? `${label} (${selected.length})` : label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-30 rounded-xl py-1 min-w-[180px]"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}
        >
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:opacity-80 text-left"
              style={{ color: "var(--foreground)" }}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={selected.includes(opt)
                  ? { backgroundColor: "var(--foreground)" }
                  : { border: "1px solid var(--border)" }
                }
              >
                {selected.includes(opt) && <Check size={10} color="var(--accent-light)" />}
              </div>
              {opt}
            </button>
          ))}
          {active && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs border-t"
              style={{ color: "var(--muted)", borderColor: "var(--border)" }}
            >
              <X size={11} /> Wis filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVE FILTER CHIPS ──────────────────────────────────────────────────────

interface ActiveFilters {
  subcats: string[];
  typeEvent: string[];
  taal: string[];
  dagdeel: string[];
  regio: string;
  eerderGebruikt: boolean | null;
}

function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ActiveFilters;
  onRemove(key: keyof ActiveFilters, value?: string): void;
  onClearAll(): void;
}) {
  const chips: { label: string; key: keyof ActiveFilters; value?: string }[] = [
    ...filters.subcats.map(v => ({ label: v, key: "subcats" as const, value: v })),
    ...filters.typeEvent.map(v => ({ label: v, key: "typeEvent" as const, value: v })),
    ...filters.taal.map(v => ({ label: v, key: "taal" as const, value: v })),
    ...filters.dagdeel.map(v => ({ label: v, key: "dagdeel" as const, value: v })),
    ...(filters.regio ? [{ label: filters.regio, key: "regio" as const }] : []),
    ...(filters.eerderGebruikt !== null ? [{ label: "Eerder gebruikt", key: "eerderGebruikt" as const }] : []),
  ];
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-8 py-2 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
      <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>Actief:</span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(232,111,163,0.12)", color: "var(--accent)" }}
        >
          {chip.label}
          <button onClick={() => onRemove(chip.key, chip.value)} className="hover:opacity-70">
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs underline opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        Wis alles
      </button>
    </div>
  );
}

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────

function SupplierMap({ suppliers, onSupplierClick }: {
  suppliers: Supplier[];
  onSupplierClick(id: number): void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const onClickRef = useRef(onSupplierClick);
  onClickRef.current = onSupplierClick;

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;
      LRef.current = L;
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([52.37, 4.89], 9);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);
      mapRef.current = map;
    });
    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove(): void }).remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Update markers when suppliers change
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current as { addLayer(l: unknown): void };
    // Remove old markers
    markersRef.current.forEach(m => (m as { remove(): void }).remove());
    markersRef.current = [];

    const withCoords = suppliers.filter(s => s.lat && s.lng);
    withCoords.forEach(s => {
      const marker = L.circleMarker([s.lat!, s.lng!], {
        radius: 9,
        fillColor: catColor(s.category),
        color: "#fff",
        weight: 2,
        fillOpacity: 0.9,
      });
      marker.addTo(mapRef.current as Parameters<typeof marker.addTo>[0]);
      marker.bindTooltip(s.name, { permanent: false, direction: "top" });
      marker.on("click", () => onClickRef.current(s.id));
      markersRef.current.push(marker);
    });

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(s => [s.lat!, s.lng!]));
      (mapRef.current as { fitBounds(b: unknown, o: unknown): void }).fitBounds(bounds, { padding: [40, 40] });
    }
  }, [suppliers]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </>
  );
}

// ─── SUPPLIER FORM ────────────────────────────────────────────────────────────

function SupplierForm({
  initial, allCats, eventLocatieSubcats, sprekerSubcats,
  onSave, onCancel, title, saveLabel = "Opslaan",
}: {
  initial: Partial<Supplier>;
  allCats: { id: string; label: string }[];
  eventLocatieSubcats: string[];
  sprekerSubcats: string[];
  onSave(data: Omit<Supplier, "id">): void;
  onCancel(): void;
  title: string;
  saveLabel?: string;
}) {
  const store = useStore();
  const [name, setName]           = useState(initial.name ?? "");
  const [category, setCategory]   = useState(initial.category ?? "event-locaties");
  const [subcats, setSubcats]     = useState<string[]>(initial.subcategories ?? []);
  const [address, setAddress]     = useState(initial.address ?? "");
  const [city, setCity]           = useState(initial.city ?? "");
  const [lat, setLat]             = useState(initial.lat ? String(initial.lat) : "");
  const [lng, setLng]             = useState(initial.lng ? String(initial.lng) : "");
  const [cName, setCName]         = useState(initial.contact?.name ?? "");
  const [cPhone, setCPhone]       = useState(initial.contact?.phone ?? "");
  const [cEmail, setCEmail]       = useState(initial.contact?.email ?? "");
  const [price, setPrice]         = useState(initial.priceIndication ?? "");
  const [notes, setNotes]         = useState(initial.notes ?? "");
  const [typeEvent, setTypeEvent] = useState(initial.typeEvent ?? "");
  const [taal, setTaal]           = useState(initial.taal ?? "");
  const [dagdeel, setDagdeel]     = useState(initial.dagdeelVoorkeur ?? "");
  const [regio, setRegio]         = useState(initial.regio ?? "");
  const [eerder, setEerder]       = useState(initial.eerderGebruikt ?? false);
  const [newSubcat, setNewSubcat] = useState("");

  const availableSubcats = category === "event-locaties" ? eventLocatieSubcats
    : category === "sprekers" ? sprekerSubcats
    : [];

  function toggleSubcat(s: string) {
    setSubcats(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function addSubcat() {
    if (!newSubcat.trim()) return;
    if (category === "event-locaties") store.addEventLocatieSubcat(newSubcat.trim());
    else if (category === "sprekers") store.addSprekerSubcat(newSubcat.trim());
    setSubcats(prev => [...prev, newSubcat.trim()]);
    setNewSubcat("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      subcategories: subcats,
      address: address.trim(),
      city: city.trim(),
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      contact: { name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim() },
      priceIndication: price.trim(),
      notes: notes.trim(),
      typeEvent: typeEvent || undefined,
      taal: taal || undefined,
      dagdeelVoorkeur: dagdeel || undefined,
      regio: regio.trim() || undefined,
      eerderGebruikt: eerder,
    });
  }

  const inp: React.CSSProperties = {
    border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{title}</h2>
        <button type="button" onClick={onCancel} className="opacity-50 hover:opacity-100 transition-opacity">
          <X size={18} style={{ color: "var(--foreground)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Naam *</label>
          <input autoFocus required value={name} onChange={e => setName(e.target.value)}
            placeholder="Naam van de leverancier"
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Categorie</label>
          <select value={category} onChange={e => { setCategory(e.target.value); setSubcats([]); }}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp}>
            {allCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* Subcategories */}
        {availableSubcats.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Subcategorieën</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {availableSubcats.map(s => (
                <button key={s} type="button" onClick={() => toggleSubcat(s)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={subcats.includes(s)
                    ? { backgroundColor: catColor(category), color: "#fff" }
                    : { border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--background)" }
                  }
                >{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                value={newSubcat}
                onChange={e => setNewSubcat(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubcat(); } }}
                placeholder="Nieuwe subcategorie..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
              <button type="button" onClick={addSubcat}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
              >+ Toevoegen</button>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Adres</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Straat + nr"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Stad</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Amsterdam"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Lat (kaartpin)</label>
            <input value={lat} onChange={e => setLat(e.target.value)} placeholder="52.3676"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Lng (kaartpin)</label>
            <input value={lng} onChange={e => setLng(e.target.value)} placeholder="4.9041"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Contactpersoon</label>
          <div className="space-y-2">
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Naam"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
            <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="Telefoonnummer"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
            <input value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="E-mailadres" type="email"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Prijsindicatie</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="bv. €85 p.p. of vanaf €2.500"
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
        </div>

        {/* Extra filter fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Type event</label>
            <select value={typeEvent} onChange={e => setTypeEvent(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp}>
              <option value="">Niet ingesteld</option>
              {TYPE_EVENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Taal</label>
            <select value={taal} onChange={e => setTaal(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp}>
              <option value="">Niet ingesteld</option>
              {TAAL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Dagdeel voorkeur</label>
            <select value={dagdeel} onChange={e => setDagdeel(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp}>
              <option value="">Niet ingesteld</option>
              {DAGDEEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Regio</label>
            <input value={regio} onChange={e => setRegio(e.target.value)} placeholder="Noord-Holland"
              list="regio-options"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={inp} />
            <datalist id="regio-options">
              {REGIO_OPTIONS.map(o => <option key={o} value={o} />)}
            </datalist>
          </div>
        </div>

        {/* Eerder gebruikt */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setEerder(v => !v)}
            className="w-10 h-5 rounded-full transition-colors relative shrink-0"
            style={{ backgroundColor: eerder ? "var(--foreground)" : "var(--border)" }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{ backgroundColor: "#fff", transform: eerder ? "translateX(20px)" : "translateX(2px)" }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--foreground)" }}>Eerder gebruikt</span>
        </label>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>Notities & beoordeling</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ervaringen, aandachtspunten, beoordeling..." rows={4}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none" style={inp} />
        </div>
      </div>

      <div className="px-6 py-4 border-t flex gap-2 shrink-0" style={{ borderColor: "var(--border)" }}>
        <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
        >{saveLabel}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
        >Annuleren</button>
      </div>
    </form>
  );
}

// ─── SUPPLIER DETAIL ──────────────────────────────────────────────────────────

function SupplierDetail({
  supplier, allCats, onEdit, onDelete, onClose,
}: {
  supplier: Supplier;
  allCats: { id: string; label: string }[];
  onEdit(): void;
  onDelete(): void;
  onClose(): void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mapsUrl = (supplier.address || supplier.city)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([supplier.address, supplier.city].filter(Boolean).join(", "))}`
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor(supplier.category) }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {catLabel(supplier.category, allCats.map(c => c.id))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="opacity-50 hover:opacity-100 transition-opacity" title="Bewerken">
            <Pencil size={14} style={{ color: "var(--foreground)" }} />
          </button>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={17} style={{ color: "var(--foreground)" }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{supplier.name}</h2>

        {/* Subcategories */}
        {supplier.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {supplier.subcategories.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${catColor(supplier.category)}18`, color: catColor(supplier.category) }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Extra fields */}
        {(supplier.typeEvent || supplier.taal || supplier.dagdeelVoorkeur || supplier.regio || supplier.eerderGebruikt) && (
          <div className="flex flex-wrap gap-1.5">
            {supplier.typeEvent && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                {supplier.typeEvent}
              </span>
            )}
            {supplier.taal && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                {supplier.taal}
              </span>
            )}
            {supplier.dagdeelVoorkeur && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                {supplier.dagdeelVoorkeur}
              </span>
            )}
            {supplier.regio && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                {supplier.regio}
              </span>
            )}
            {supplier.eerderGebruikt && (
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#065f46" }}>
                ✓ Eerder gebruikt
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {(supplier.address || supplier.city) && (
          <div className="flex items-start gap-3">
            <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
            <div>
              {supplier.address && <div className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.address}</div>}
              {supplier.city && <div className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.city}</div>}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs mt-1 hover:underline" style={{ color: "var(--accent)" }}>
                  <ExternalLink size={10} /> Bekijk op Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {(supplier.contact.name || supplier.contact.phone || supplier.contact.email) && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Contactpersoon</div>
            {supplier.contact.name && (
              <div className="flex items-center gap-3">
                <User size={13} style={{ color: "var(--muted)" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.contact.name}</span>
              </div>
            )}
            {supplier.contact.phone && (
              <div className="flex items-center gap-3">
                <Phone size={13} style={{ color: "var(--muted)" }} />
                <a href={`tel:${supplier.contact.phone}`} className="text-sm hover:underline" style={{ color: "var(--foreground)" }}>
                  {supplier.contact.phone}
                </a>
              </div>
            )}
            {supplier.contact.email && (
              <div className="flex items-center gap-3">
                <Mail size={13} style={{ color: "var(--muted)" }} />
                <a href={`mailto:${supplier.contact.email}`} className="text-sm hover:underline" style={{ color: "var(--foreground)" }}>
                  {supplier.contact.email}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        {supplier.priceIndication && (
          <div className="flex items-start gap-3">
            <Euro size={14} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
            <span className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.priceIndication}</span>
          </div>
        )}

        {/* Notes */}
        {supplier.notes && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Notities</div>
            <div className="text-sm p-4 rounded-xl whitespace-pre-wrap"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground)", lineHeight: 1.7 }}>
              {supplier.notes}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
        {confirmDelete ? (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ border: "1px solid #fca5a5", backgroundColor: "rgba(254,226,226,0.5)" }}>
            <span className="flex-1 text-xs" style={{ color: "#7f1d1d" }}>Verwijder {supplier.name}?</span>
            <button onClick={onDelete} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#dc2626", color: "#fff" }}>Ja</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: "#7f1d1d" }}>Nee</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-xs opacity-40 hover:opacity-80 transition-opacity" style={{ color: "var(--muted)" }}>
            <Trash2 size={13} /> Leverancier verwijderen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SUPPLIER CARD (grid) ─────────────────────────────────────────────────────

function SupplierCard({ supplier, allCats, onClick }: {
  supplier: Supplier;
  allCats: { id: string; label: string }[];
  onClick(): void;
}) {
  return (
    <button onClick={onClick}
      className="text-left w-full p-4 rounded-2xl transition-all hover:-translate-y-px hover:shadow-md"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor(supplier.category) }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {catLabel(supplier.category, allCats.map(c => c.id))}
          </span>
        </div>
        {supplier.lat && supplier.lng && <MapPin size={11} style={{ color: "var(--muted)", opacity: 0.4 }} />}
      </div>
      <div className="font-semibold text-sm mb-1.5 truncate" style={{ color: "var(--foreground)" }}>{supplier.name}</div>
      {supplier.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {supplier.subcategories.slice(0, 3).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${catColor(supplier.category)}15`, color: catColor(supplier.category) }}>
              {s}
            </span>
          ))}
          {supplier.subcategories.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--muted)" }}>+{supplier.subcategories.length - 3}</span>
          )}
        </div>
      )}
      {supplier.city && (
        <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--muted)" }}>
          <MapPin size={11} />{supplier.city}
        </div>
      )}
      {supplier.contact.name && (
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "var(--muted)" }}>
          <User size={11} />{supplier.contact.name}
        </div>
      )}
      {supplier.notes && (
        <p className="text-xs line-clamp-2 mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{supplier.notes}</p>
      )}
      {supplier.eerderGebruikt && (
        <div className="mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#065f46" }}>
            ✓ Eerder gebruikt
          </span>
        </div>
      )}
    </button>
  );
}

// ─── SPREKER LIST ROW ─────────────────────────────────────────────────────────

function SprekerListRow({ supplier, onClick }: { supplier: Supplier; onClick(): void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-0 px-5 py-3 text-left transition-colors hover:opacity-80 group border-b"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Name */}
      <div className="font-medium text-sm truncate shrink-0" style={{ width: "14rem", color: "var(--foreground)" }}>
        {supplier.name}
      </div>

      {/* Subcategory tags */}
      <div className="flex items-center gap-1 flex-wrap shrink-0" style={{ width: "16rem" }}>
        {supplier.subcategories.slice(0, 2).map(s => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${catColor("sprekers")}15`, color: catColor("sprekers") }}>
            {s}
          </span>
        ))}
        {supplier.subcategories.length > 2 && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>+{supplier.subcategories.length - 2}</span>
        )}
      </div>

      {/* Type event */}
      <div className="text-xs shrink-0" style={{ width: "7rem", color: "var(--muted)" }}>
        {supplier.typeEvent || "—"}
      </div>

      {/* Regio */}
      <div className="text-xs shrink-0" style={{ width: "8rem", color: "var(--muted)" }}>
        {supplier.regio || supplier.city || "—"}
      </div>

      {/* Notes preview */}
      <div className="flex-1 min-w-0 text-xs truncate" style={{ color: "var(--muted)" }}>
        {supplier.notes || ""}
      </div>

      {/* Eerder gebruikt */}
      {supplier.eerderGebruikt && (
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2"
          style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#065f46" }}>
          ✓ Eerder
        </span>
      )}
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LeveranciersPage() {
  const store = useStore();

  const [activeCat, setActiveCat]           = useState("alle");
  const [search, setSearch]                 = useState("");
  const [filterSubcats, setFilterSubcats]   = useState<string[]>([]);
  const [filterTypeEvent, setFilterTypeEvent] = useState<string[]>([]);
  const [filterTaal, setFilterTaal]         = useState<string[]>([]);
  const [filterDagdeel, setFilterDagdeel]   = useState<string[]>([]);
  const [filterRegio, setFilterRegio]       = useState("");
  const [filterEerder, setFilterEerder]     = useState<boolean | null>(null);
  const [showMap, setShowMap]               = useState(false);
  const [viewMode, setViewMode]             = useState<"grid" | "list">("grid");
  const [selectedSupplier, setSelectedSupplier]   = useState<Supplier | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [editingSupplier, setEditingSupplier]     = useState<Supplier | null>(null);
  const [showAddCat, setShowAddCat]         = useState(false);
  const [newCat, setNewCat]                 = useState("");

  const allCats = [
    ...FIXED_CATS.map(c => ({ id: c.id, label: c.label })),
    ...store.customSupplierCats.map(c => ({ id: c, label: c })),
  ];

  const isSprekers = activeCat === "sprekers";
  const activeFilters: ActiveFilters = {
    subcats: filterSubcats,
    typeEvent: filterTypeEvent,
    taal: filterTaal,
    dagdeel: filterDagdeel,
    regio: filterRegio,
    eerderGebruikt: filterEerder,
  };
  const hasActiveFilters = filterSubcats.length > 0 || filterTypeEvent.length > 0 ||
    filterTaal.length > 0 || filterDagdeel.length > 0 || !!filterRegio || filterEerder !== null;

  // Build filtered list
  const filtered = store.suppliers.filter(s => {
    if (activeCat !== "alle" && s.category !== activeCat) return false;
    if (filterSubcats.length > 0 && !filterSubcats.some(sc => s.subcategories.includes(sc))) return false;
    if (filterTypeEvent.length > 0 && !filterTypeEvent.includes(s.typeEvent ?? "")) return false;
    if (filterTaal.length > 0 && !filterTaal.includes(s.taal ?? "")) return false;
    if (filterDagdeel.length > 0 && !filterDagdeel.includes(s.dagdeelVoorkeur ?? "")) return false;
    if (filterRegio && !(s.regio ?? s.city ?? "").toLowerCase().includes(filterRegio.toLowerCase())) return false;
    if (filterEerder !== null && s.eerderGebruikt !== filterEerder) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q) &&
          !s.contact.name.toLowerCase().includes(q) && !s.notes.toLowerCase().includes(q) &&
          !(s.regio ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const mapSuppliers = filtered.filter(s => s.lat && s.lng);
  const subcatsForCat = activeCat === "event-locaties" ? store.eventLocatieSubcats
    : activeCat === "sprekers" ? store.sprekerSubcats
    : [];

  function clearAllFilters() {
    setFilterSubcats([]); setFilterTypeEvent([]); setFilterTaal([]);
    setFilterDagdeel([]); setFilterRegio(""); setFilterEerder(null);
  }

  function removeFilter(key: keyof ActiveFilters, value?: string) {
    if (key === "subcats" && value) setFilterSubcats(p => p.filter(x => x !== value));
    else if (key === "typeEvent" && value) setFilterTypeEvent(p => p.filter(x => x !== value));
    else if (key === "taal" && value) setFilterTaal(p => p.filter(x => x !== value));
    else if (key === "dagdeel" && value) setFilterDagdeel(p => p.filter(x => x !== value));
    else if (key === "regio") setFilterRegio("");
    else if (key === "eerderGebruikt") setFilterEerder(null);
  }

  function handleAddSupplier(data: Omit<Supplier, "id">) {
    store.addSupplier(data);
    setShowAddForm(false);
  }
  function handleEditSupplier(data: Omit<Supplier, "id">) {
    if (!editingSupplier) return;
    store.updateSupplier(editingSupplier.id, data);
    setSelectedSupplier({ ...editingSupplier, ...data });
    setEditingSupplier(null);
  }
  function handleDeleteSupplier() {
    if (!selectedSupplier) return;
    store.deleteSupplier(selectedSupplier.id);
    setSelectedSupplier(null);
  }

  const rightPanelOpen = showAddForm || editingSupplier !== null || selectedSupplier !== null;
  const showMapPanel = showMap && !rightPanelOpen && mapSuppliers.length > 0;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-8 py-5 border-b shrink-0"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Leveranciers</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{store.suppliers.length} in totaal</p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setSelectedSupplier(null); setEditingSupplier(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={14} /> Leverancier toevoegen
          </button>
        </header>

        {/* Filters */}
        <div className="px-8 py-3 space-y-2.5 border-b shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam, stad, contactpersoon..."
              className="w-full text-sm pl-9 pr-4 py-2 rounded-xl outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                <X size={12} style={{ color: "var(--muted)" }} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => { setActiveCat("alle"); setFilterSubcats([]); }}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={activeCat === "alle"
                ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)" }
                : { border: "1px solid var(--border)", color: "var(--muted)" }
              }>Alle</button>
            {allCats.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCat(cat.id); setFilterSubcats([]); }}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={activeCat === cat.id
                  ? { backgroundColor: catColor(cat.id), color: "#fff" }
                  : { border: "1px solid var(--border)", color: "var(--muted)" }
                }>{cat.label}</button>
            ))}
            {showAddCat ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { store.addCustomSupplierCat(newCat.trim()); setNewCat(""); setShowAddCat(false); } if (e.key === "Escape") setShowAddCat(false); }}
                  placeholder="Naam..." className="text-xs px-2.5 py-1.5 rounded-full outline-none w-28"
                  style={{ border: "1px solid var(--accent)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
                <button onClick={() => { store.addCustomSupplierCat(newCat.trim()); setNewCat(""); setShowAddCat(false); }}
                  className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>OK</button>
                <button onClick={() => setShowAddCat(false)} className="text-xs opacity-50">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowAddCat(true)} className="text-xs opacity-40 hover:opacity-80 transition-opacity" style={{ color: "var(--muted)" }}>
                + Categorie
              </button>
            )}
          </div>

          {/* Subcategory chips */}
          {subcatsForCat.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>Subcat:</span>
              {subcatsForCat.map(s => (
                <button key={s} onClick={() => setFilterSubcats(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={filterSubcats.includes(s)
                    ? { backgroundColor: catColor(activeCat), color: "#fff" }
                    : { border: "1px solid var(--border)", color: "var(--muted)" }
                  }>{s}</button>
              ))}
            </div>
          )}

          {/* Extra filter pills + controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterDropdown label="Type event" options={TYPE_EVENT_OPTIONS}
              selected={filterTypeEvent}
              onToggle={v => setFilterTypeEvent(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
              onClear={() => setFilterTypeEvent([])} />
            <FilterDropdown label="Taal" options={TAAL_OPTIONS}
              selected={filterTaal}
              onToggle={v => setFilterTaal(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
              onClear={() => setFilterTaal([])} />
            <FilterDropdown label="Dagdeel" options={DAGDEEL_OPTIONS}
              selected={filterDagdeel}
              onToggle={v => setFilterDagdeel(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
              onClear={() => setFilterDagdeel([])} />
            {/* Regio input */}
            <div className="relative">
              <input value={filterRegio} onChange={e => setFilterRegio(e.target.value)}
                list="filter-regio-options" placeholder="Regio..."
                className="text-xs px-3 py-1.5 rounded-full outline-none"
                style={filterRegio
                  ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)", border: "none" }
                  : { border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "transparent" }
                } />
              <datalist id="filter-regio-options">
                {REGIO_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>
            {/* Eerder gebruikt toggle */}
            <button
              onClick={() => setFilterEerder(p => p === true ? null : true)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={filterEerder === true
                ? { backgroundColor: "rgba(16,185,129,0.18)", color: "#065f46", border: "none" }
                : { border: "1px solid var(--border)", color: "var(--muted)" }
              }
            >✓ Eerder gebruikt</button>

            {/* Spacer + view controls */}
            <div className="flex-1" />
            {!isSprekers && (
              <div className="flex items-center rounded-lg overflow-hidden shrink-0"
                style={{ border: "1px solid var(--border)" }}>
                <button onClick={() => setViewMode("grid")}
                  className="p-1.5 transition-colors"
                  style={{ backgroundColor: viewMode === "grid" ? "var(--foreground)" : "transparent",
                           color: viewMode === "grid" ? "var(--accent-light)" : "var(--muted)" }}>
                  <Grid3x3 size={13} />
                </button>
                <button onClick={() => setViewMode("list")}
                  className="p-1.5 transition-colors"
                  style={{ backgroundColor: viewMode === "list" ? "var(--foreground)" : "transparent",
                           color: viewMode === "list" ? "var(--accent-light)" : "var(--muted)" }}>
                  <List size={13} />
                </button>
              </div>
            )}
            {/* Map toggle — only for categories with coords */}
            {mapSuppliers.length > 0 && !rightPanelOpen && (
              <button onClick={() => setShowMap(v => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                style={showMap
                  ? { backgroundColor: "#4f8cc9", color: "#fff" }
                  : { border: "1px solid var(--border)", color: "var(--muted)" }
                }>
                <Map size={12} /> {showMap ? "Kaart verbergen" : "Toon op kaart"}
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <ActiveFilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={clearAllFilters} />
        )}

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List / grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sprekers list header */}
            {isSprekers && (
              <div
                className="flex items-center gap-0 px-5 py-2 border-b shrink-0"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ width: "14rem", color: "var(--muted)" }}>Naam</div>
                <div className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ width: "16rem", color: "var(--muted)" }}>Subcategorie</div>
                <div className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ width: "7rem", color: "var(--muted)" }}>Geschikt voor</div>
                <div className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ width: "8rem", color: "var(--muted)" }}>Regio</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Notitie</div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--muted)" }}>
                  <p className="text-sm mb-1">Geen leveranciers gevonden.</p>
                  <p className="text-xs">Pas de filters aan of voeg een nieuwe leverancier toe.</p>
                </div>
              ) : isSprekers ? (
                /* Sprekers: always list view */
                <div className="rounded-xl overflow-hidden mx-6 my-5" style={{ border: "1px solid var(--border)" }}>
                  {filtered.map(s => (
                    <SprekerListRow key={s.id} supplier={s}
                      onClick={() => { setSelectedSupplier(s); setShowAddForm(false); setEditingSupplier(null); }} />
                  ))}
                </div>
              ) : viewMode === "list" ? (
                /* Other cats: list view */
                <div className="rounded-xl overflow-hidden mx-6 my-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  {filtered.map(s => (
                    <button key={s.id}
                      onClick={() => { setSelectedSupplier(s); setShowAddForm(false); setEditingSupplier(null); }}
                      className="w-full flex items-center gap-4 px-5 py-3 border-b text-left hover:opacity-80 transition-opacity group"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor(s.category) }} />
                      <div className="font-medium text-sm shrink-0" style={{ width: "14rem", color: "var(--foreground)" }}>
                        <span className="truncate block">{s.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0" style={{ width: "12rem" }}>
                        {s.subcategories.slice(0, 2).map(sc => (
                          <span key={sc} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${catColor(s.category)}15`, color: catColor(s.category) }}>{sc}</span>
                        ))}
                      </div>
                      <div className="text-xs shrink-0" style={{ width: "8rem", color: "var(--muted)" }}>{s.city || "—"}</div>
                      <div className="flex-1 text-xs truncate" style={{ color: "var(--muted)" }}>{s.notes}</div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Other cats: grid view */
                <div className="px-6 py-5 grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(s => (
                    <SupplierCard key={s.id} supplier={s} allCats={allCats}
                      onClick={() => { setSelectedSupplier(s); setShowAddForm(false); setEditingSupplier(null); }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map panel */}
          {showMapPanel && (
            <div
              className="shrink-0 border-l flex flex-col"
              style={{ width: 460, borderColor: "var(--border)", position: "relative" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Kaart — {mapSuppliers.length} locaties
                </span>
                <button onClick={() => setShowMap(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={15} style={{ color: "var(--foreground)" }} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <SupplierMap
                  suppliers={mapSuppliers}
                  onSupplierClick={id => {
                    const s = store.suppliers.find(s => s.id === id);
                    if (s) { setSelectedSupplier(s); setShowMap(false); }
                  }}
                />
              </div>
            </div>
          )}

          {/* Right detail / form panel */}
          {rightPanelOpen && (
            <aside className="w-96 shrink-0 border-l flex flex-col overflow-hidden"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              {showAddForm && (
                <SupplierForm
                  initial={{}} allCats={allCats}
                  eventLocatieSubcats={store.eventLocatieSubcats}
                  sprekerSubcats={store.sprekerSubcats}
                  onSave={handleAddSupplier} onCancel={() => setShowAddForm(false)}
                  title="Nieuwe leverancier" saveLabel="Toevoegen" />
              )}
              {editingSupplier && (
                <SupplierForm
                  initial={editingSupplier} allCats={allCats}
                  eventLocatieSubcats={store.eventLocatieSubcats}
                  sprekerSubcats={store.sprekerSubcats}
                  onSave={handleEditSupplier} onCancel={() => setEditingSupplier(null)}
                  title="Leverancier bewerken" saveLabel="Opslaan" />
              )}
              {selectedSupplier && !editingSupplier && !showAddForm && (
                <SupplierDetail
                  supplier={selectedSupplier} allCats={allCats}
                  onEdit={() => setEditingSupplier(selectedSupplier)}
                  onDelete={handleDeleteSupplier}
                  onClose={() => setSelectedSupplier(null)} />
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
