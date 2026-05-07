"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import type { Supplier } from "@/lib/types";
import {
  Plus, Search, X, MapPin, Phone, Mail, User, Euro,
  FileText, Trash2, Pencil, Check, Map, List, ChevronDown,
  Tag, ExternalLink,
} from "lucide-react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FIXED_CATS = [
  { id: "event-locaties",  label: "Event locaties" },
  { id: "catering",        label: "Catering & restaurants" },
  { id: "sprekers",        label: "Sprekers & entertainment" },
  { id: "overig",          label: "Overig" },
] as const;

const CAT_COLORS: Record<string, string> = {
  "event-locaties": "#4f8cc9",
  "catering":       "#6dc88a",
  "sprekers":       "#a96ec8",
  "overig":         "#8b8a7a",
};

function catColor(cat: string): string {
  return CAT_COLORS[cat] ?? "#e86fa3";
}

function catLabel(cat: string, customCats: string[]): string {
  const found = FIXED_CATS.find((c) => c.id === cat);
  if (found) return found.label;
  if (customCats.includes(cat)) return cat;
  return cat;
}

// ─── LEAFLET MAP ─────────────────────────────────────────────────────────────

function SupplierMap({ suppliers }: { suppliers: Supplier[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const withCoords = suppliers.filter((s) => s.lat && s.lng);
    if (withCoords.length === 0) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default marker icon paths
      // @ts-expect-error – leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const avgLat = withCoords.reduce((s, x) => s + x.lat!, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, x) => s + x.lng!, 0) / withCoords.length;
      const map = L.map(mapRef.current!).setView([avgLat, avgLng], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors",
      }).addTo(map);

      withCoords.forEach((s) => {
        const marker = L.circleMarker([s.lat!, s.lng!], {
          radius: 8,
          fillColor: catColor(s.category),
          color: "#fff",
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:sans-serif;min-width:140px">
            <div style="font-weight:600;font-size:13px;margin-bottom:2px">${s.name}</div>
            <div style="font-size:11px;color:#666">${s.address || s.city}</div>
          </div>`
        );
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove(): void }).remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: 12 }} />
    </>
  );
}

// ─── SUPPLIER FORM ────────────────────────────────────────────────────────────

function SupplierForm({
  initial,
  allCats,
  eventLocatieSubcats,
  onSave,
  onCancel,
  title,
  saveLabel = "Opslaan",
}: {
  initial: Partial<Supplier>;
  allCats: { id: string; label: string }[];
  eventLocatieSubcats: string[];
  onSave(data: Omit<Supplier, "id">): void;
  onCancel(): void;
  title: string;
  saveLabel?: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [category, setCategory] = useState(initial.category ?? "event-locaties");
  const [subcats, setSubcats] = useState<string[]>(initial.subcategories ?? []);
  const [address, setAddress] = useState(initial.address ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [lat, setLat] = useState(initial.lat ? String(initial.lat) : "");
  const [lng, setLng] = useState(initial.lng ? String(initial.lng) : "");
  const [contactName, setContactName] = useState(initial.contact?.name ?? "");
  const [contactPhone, setContactPhone] = useState(initial.contact?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contact?.email ?? "");
  const [price, setPrice] = useState(initial.priceIndication ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");

  function toggleSubcat(s: string) {
    setSubcats((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
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
      contact: { name: contactName.trim(), phone: contactPhone.trim(), email: contactEmail.trim() },
      priceIndication: price.trim(),
      notes: notes.trim(),
    });
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
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
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
            Naam *
          </label>
          <input autoFocus required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Naam van de leverancier"
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
            Categorie
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
            style={inputStyle}
          >
            {allCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* Subcategories — for event locaties */}
        {category === "event-locaties" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Subcategorieën
            </label>
            <div className="flex flex-wrap gap-1.5">
              {eventLocatieSubcats.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubcat(s)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={subcats.includes(s)
                    ? { backgroundColor: "#4f8cc9", color: "#fff" }
                    : { border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--background)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Adres
            </label>
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Straat + huisnummer"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Stad
            </label>
            <input value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Amsterdam"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Lat (kaart)
            </label>
            <input value={lat} onChange={(e) => setLat(e.target.value)}
              placeholder="52.3676"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              Lng (kaart)
            </label>
            <input value={lng} onChange={(e) => setLng(e.target.value)}
              placeholder="4.9041"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            Contactpersoon
          </label>
          <div className="space-y-2">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)}
              placeholder="Naam"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Telefoonnummer"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              placeholder="E-mailadres"
              type="email"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
            Prijsindicatie
          </label>
          <input value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="bv. €85 p.p. excl. btw"
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
            Notities & beoordeling
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Ervaringen, aandachtspunten, beoordeling..."
            rows={4}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t flex gap-2 shrink-0" style={{ borderColor: "var(--border)" }}>
        <button type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
        >
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}

// ─── SUPPLIER DETAIL PANEL ────────────────────────────────────────────────────

function SupplierDetail({
  supplier,
  allCats,
  eventLocatieSubcats,
  onEdit,
  onDelete,
  onClose,
}: {
  supplier: Supplier;
  allCats: { id: string; label: string }[];
  eventLocatieSubcats: string[];
  onEdit(): void;
  onDelete(): void;
  onClose(): void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mapsUrl = supplier.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(supplier.address + ", " + supplier.city)}`
    : supplier.city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(supplier.city)}`
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: catColor(supplier.category) }}
          />
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {catLabel(supplier.category, allCats.filter(c => !FIXED_CATS.find(f => f.id === c.id)).map(c => c.id))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="opacity-50 hover:opacity-100 transition-opacity" title="Bewerken">
            <Pencil size={15} style={{ color: "var(--foreground)" }} />
          </button>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={18} style={{ color: "var(--foreground)" }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{supplier.name}</h2>

        {/* Subcategories */}
        {supplier.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {supplier.subcategories.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${catColor(supplier.category)}20`, color: catColor(supplier.category) }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Address */}
        {(supplier.address || supplier.city) && (
          <div className="flex items-start gap-3">
            <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
            <div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {supplier.address && <div>{supplier.address}</div>}
                {supplier.city && <div>{supplier.city}</div>}
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs mt-1 hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  <ExternalLink size={11} /> Bekijk op Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {(supplier.contact.name || supplier.contact.phone || supplier.contact.email) && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Contactpersoon
            </div>
            {supplier.contact.name && (
              <div className="flex items-center gap-3">
                <User size={14} style={{ color: "var(--muted)" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.contact.name}</span>
              </div>
            )}
            {supplier.contact.phone && (
              <div className="flex items-center gap-3">
                <Phone size={14} style={{ color: "var(--muted)" }} />
                <a href={`tel:${supplier.contact.phone}`} className="text-sm hover:underline" style={{ color: "var(--foreground)" }}>
                  {supplier.contact.phone}
                </a>
              </div>
            )}
            {supplier.contact.email && (
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: "var(--muted)" }} />
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
            <Euro size={15} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
            <span className="text-sm" style={{ color: "var(--foreground)" }}>{supplier.priceIndication}</span>
          </div>
        )}

        {/* Notes */}
        {supplier.notes && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
              Notities
            </div>
            <div
              className="text-sm p-4 rounded-xl whitespace-pre-wrap"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground)", lineHeight: 1.7 }}
            >
              {supplier.notes}
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
        {confirmDelete ? (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ border: "1px solid #fca5a5", backgroundColor: "rgba(254,226,226,0.5)" }}>
            <span className="flex-1 text-xs" style={{ color: "#7f1d1d" }}>Verwijder {supplier.name}?</span>
            <button onClick={onDelete} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#dc2626", color: "#fff" }}>
              Ja
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: "#7f1d1d" }}>Nee</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-xs opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted)" }}
          >
            <Trash2 size={13} /> Leverancier verwijderen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SUPPLIER CARD ────────────────────────────────────────────────────────────

function SupplierCard({ supplier, allCats, onClick }: {
  supplier: Supplier;
  allCats: { id: string; label: string }[];
  onClick(): void;
}) {
  const customCatIds = allCats.filter(c => !FIXED_CATS.find(f => f.id === c.id)).map(c => c.id);
  return (
    <button
      onClick={onClick}
      className="text-left w-full p-4 rounded-2xl transition-all hover:-translate-y-px hover:shadow-md group"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Category indicator */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor(supplier.category) }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {catLabel(supplier.category, customCatIds)}
          </span>
        </div>
        {supplier.lat && supplier.lng && (
          <MapPin size={12} style={{ color: "var(--muted)", opacity: 0.5 }} />
        )}
      </div>

      {/* Name */}
      <div className="font-semibold text-sm mb-1.5 truncate" style={{ color: "var(--foreground)" }}>
        {supplier.name}
      </div>

      {/* Subcategory chips */}
      {supplier.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {supplier.subcategories.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${catColor(supplier.category)}15`, color: catColor(supplier.category) }}
            >
              {s}
            </span>
          ))}
          {supplier.subcategories.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--muted)" }}>
              +{supplier.subcategories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* City */}
      {supplier.city && (
        <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--muted)" }}>
          <MapPin size={11} className="shrink-0" />{supplier.city}
        </div>
      )}

      {/* Contact */}
      {supplier.contact.name && (
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "var(--muted)" }}>
          <User size={11} className="shrink-0" />{supplier.contact.name}
        </div>
      )}

      {/* Notes preview */}
      {supplier.notes && (
        <p className="text-xs line-clamp-2 mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          {supplier.notes}
        </p>
      )}
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LeveranciersPage() {
  const store = useStore();
  const [activeCat, setActiveCat] = useState<string>("alle");
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showAddSubcat, setShowAddSubcat] = useState(false);
  const [newSubcat, setNewSubcat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  const allCats = [
    ...FIXED_CATS.map(c => ({ id: c.id, label: c.label })),
    ...store.customSupplierCats.map(c => ({ id: c, label: c })),
  ];

  // Build filtered list
  const filtered = store.suppliers.filter((s) => {
    if (activeCat !== "alle" && s.category !== activeCat) return false;
    if (selectedSubcats.length > 0 && !selectedSubcats.some((sc) => s.subcategories.includes(sc))) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.city.toLowerCase().includes(q) &&
        !s.contact.name.toLowerCase().includes(q) &&
        !s.notes.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const mapSuppliers = filtered.filter((s) => s.lat && s.lng);
  const showSubcatFilter = activeCat === "event-locaties" || activeCat === "alle";

  function toggleSubcatFilter(s: string) {
    setSelectedSubcats((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function addSubcat() {
    if (!newSubcat.trim()) return;
    store.addEventLocatieSubcat(newSubcat.trim());
    setNewSubcat("");
    setShowAddSubcat(false);
  }

  function addCat() {
    if (!newCat.trim()) return;
    store.addCustomSupplierCat(newCat.trim());
    setNewCat("");
    setShowAddCat(false);
  }

  function handleAddSupplier(data: Omit<Supplier, "id">) {
    store.addSupplier(data);
    setShowAddForm(false);
  }

  function handleEditSupplier(data: Omit<Supplier, "id">) {
    if (!editingSupplier) return;
    store.updateSupplier(editingSupplier.id, data);
    // Refresh selected supplier view
    setSelectedSupplier({ ...editingSupplier, ...data });
    setEditingSupplier(null);
  }

  function handleDeleteSupplier() {
    if (!selectedSupplier) return;
    store.deleteSupplier(selectedSupplier.id);
    setSelectedSupplier(null);
  }

  const rightPanelOpen = showAddForm || editingSupplier !== null || selectedSupplier !== null;

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
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              {store.suppliers.length} leveranciers
            </p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setSelectedSupplier(null); setEditingSupplier(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}
          >
            <Plus size={14} /> Leverancier toevoegen
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Main column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search + filters */}
            <div className="px-8 py-4 space-y-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              {/* Search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam, stad of contactpersoon..."
                  className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                    <X size={13} style={{ color: "var(--muted)" }} />
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setActiveCat("alle")}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={activeCat === "alle"
                    ? { backgroundColor: "var(--foreground)", color: "var(--accent-light)" }
                    : { border: "1px solid var(--border)", color: "var(--muted)" }
                  }
                >
                  Alle
                </button>
                {allCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCat(cat.id); setSelectedSubcats([]); }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                    style={activeCat === cat.id
                      ? { backgroundColor: catColor(cat.id), color: "#fff" }
                      : { border: "1px solid var(--border)", color: "var(--muted)" }
                    }
                  >
                    {cat.label}
                  </button>
                ))}
                {/* Add custom category */}
                {showAddCat ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCat(); if (e.key === "Escape") setShowAddCat(false); }}
                      placeholder="Naam..."
                      className="text-xs px-2.5 py-1.5 rounded-full outline-none w-28"
                      style={{ border: "1px solid var(--accent)", color: "var(--foreground)", backgroundColor: "var(--background)" }}
                    />
                    <button onClick={addCat} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>OK</button>
                    <button onClick={() => setShowAddCat(false)} className="text-xs opacity-50">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddCat(true)} className="text-xs opacity-40 hover:opacity-80 transition-opacity" style={{ color: "var(--muted)" }}>
                    + Categorie
                  </button>
                )}
              </div>

              {/* Subcategory filter (event locaties) */}
              {showSubcatFilter && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>Filter:</span>
                  {store.eventLocatieSubcats.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSubcatFilter(s)}
                      className="text-xs px-2.5 py-1 rounded-full transition-colors"
                      style={selectedSubcats.includes(s)
                        ? { backgroundColor: "#4f8cc9", color: "#fff" }
                        : { border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "var(--background)" }
                      }
                    >
                      {s}
                    </button>
                  ))}
                  {/* Add subcategory */}
                  {showAddSubcat ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={newSubcat}
                        onChange={(e) => setNewSubcat(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addSubcat(); if (e.key === "Escape") setShowAddSubcat(false); }}
                        placeholder="Naam..."
                        className="text-xs px-2.5 py-1.5 rounded-full outline-none w-24"
                        style={{ border: "1px solid var(--accent)", color: "var(--foreground)", backgroundColor: "var(--background)" }}
                      />
                      <button onClick={addSubcat} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--foreground)", color: "var(--accent-light)" }}>OK</button>
                      <button onClick={() => setShowAddSubcat(false)} className="text-xs opacity-50">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddSubcat(true)} className="text-xs opacity-40 hover:opacity-80 transition-opacity" style={{ color: "var(--muted)" }}>
                      + Toevoegen
                    </button>
                  )}
                  {selectedSubcats.length > 0 && (
                    <button onClick={() => setSelectedSubcats([])} className="text-xs opacity-50 hover:opacity-100 transition-opacity ml-1" style={{ color: "var(--muted)" }}>
                      ✕ Wis filters
                    </button>
                  )}
                </div>
              )}

              {/* Map toggle */}
              {(activeCat === "event-locaties" || activeCat === "alle") && mapSuppliers.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowMap((v) => !v)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={showMap
                      ? { backgroundColor: "#4f8cc9", color: "#fff" }
                      : { border: "1px solid var(--border)", color: "var(--muted)" }
                    }
                  >
                    {showMap ? <List size={12} /> : <Map size={12} />}
                    {showMap ? "Lijstweergave" : `Kaart (${mapSuppliers.length})`}
                  </button>
                </div>
              )}
            </div>

            {/* Map section */}
            {showMap && mapSuppliers.length > 0 && (
              <div
                className="mx-8 mt-5 shrink-0"
                style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
              >
                <SupplierMap suppliers={mapSuppliers} />
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-8 py-5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--muted)" }}>
                  <p className="text-sm mb-1">Geen leveranciers gevonden.</p>
                  <p className="text-xs">Pas de filters aan of voeg een nieuwe leverancier toe.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((s) => (
                    <SupplierCard
                      key={s.id}
                      supplier={s}
                      allCats={allCats}
                      onClick={() => { setSelectedSupplier(s); setShowAddForm(false); setEditingSupplier(null); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: detail / add / edit */}
          {rightPanelOpen && (
            <aside
              className="w-96 shrink-0 border-l flex flex-col overflow-hidden"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            >
              {showAddForm && (
                <SupplierForm
                  initial={{}}
                  allCats={allCats}
                  eventLocatieSubcats={store.eventLocatieSubcats}
                  onSave={handleAddSupplier}
                  onCancel={() => setShowAddForm(false)}
                  title="Nieuwe leverancier"
                  saveLabel="Toevoegen"
                />
              )}
              {editingSupplier && (
                <SupplierForm
                  initial={editingSupplier}
                  allCats={allCats}
                  eventLocatieSubcats={store.eventLocatieSubcats}
                  onSave={handleEditSupplier}
                  onCancel={() => setEditingSupplier(null)}
                  title="Leverancier bewerken"
                  saveLabel="Wijzigingen opslaan"
                />
              )}
              {selectedSupplier && !editingSupplier && !showAddForm && (
                <SupplierDetail
                  supplier={selectedSupplier}
                  allCats={allCats}
                  eventLocatieSubcats={store.eventLocatieSubcats}
                  onEdit={() => setEditingSupplier(selectedSupplier)}
                  onDelete={handleDeleteSupplier}
                  onClose={() => setSelectedSupplier(null)}
                />
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
