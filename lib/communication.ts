import type { CommStep } from "./types";

// ─── Datumhelpers ───────────────────────────────────────────────────────────

const DUTCH_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
  januari: 0, februari: 1, maart: 2, april: 3, juni: 5,
  juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};

const SHORT_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

/** Parse een Nederlandse eventdatum zoals "15 september 2026" */
export function parseEventDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(/\s+/);
  let day = 0, month = -1, year = new Date().getFullYear();
  for (const part of parts) {
    const dayMatch = part.match(/^(\d+)/);
    if (dayMatch && !/^\d{4}$/.test(part)) day = parseInt(dayMatch[1], 10);
    const monthIdx = DUTCH_MONTHS[part.toLowerCase()];
    if (monthIdx !== undefined) month = monthIdx;
    if (/^\d{4}$/.test(part)) year = parseInt(part, 10);
  }
  if (day === 0 || month === -1) return null;
  return new Date(year, month, day);
}

/** "2026-06-15" → "15 jun 2026" */
export function formatIsoDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Aantal dagen vanaf vandaag tot de ISO-datum (negatief = in het verleden) */
export function daysFromToday(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return 0;
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** ISO-datum van vandaag + n dagen (voor snoozen van reminders) */
export function isoDaysFromNow(n: number): string {
  return toIso(addDays(new Date(), n));
}

// ─── Stappenplan-template ───────────────────────────────────────────────────
//
// Genereert een communicatielijn rond twee ankers: de uitnodigingsdatum en de
// eventdatum. De reminders tussen die twee schalen mee met de lengte van het
// traject (4 weken of een hele zomer), zodat ze nooit op elkaar of ná de
// RSVP-deadline vallen.

export function generateCommSteps(inviteIso: string, eventDateStr: string): Omit<CommStep, "id">[] {
  const invite = new Date(inviteIso + "T00:00:00");
  if (isNaN(invite.getTime())) return [];
  const eventDate = parseEventDate(eventDateStr);

  const raw: { date: Date; title: string; description?: string }[] = [
    { date: addDays(invite, -21), title: "Gastenlijst opstellen", description: "Check met collega's en partners wie er op de lijst moet — wie mist er nog?" },
    { date: addDays(invite, -14), title: "Save-the-date versturen", description: "Optioneel — vooral bij een lang traject of drukke agenda's" },
    { date: addDays(invite, -7), title: "Uitnodiging definitief maken", description: "Tekst, opmaak en verzendlijst gecontroleerd en akkoord" },
    { date: invite, title: "Uitnodiging versturen", description: "De officiële uitnodiging gaat de deur uit" },
    { date: addDays(invite, 7), title: "Eerste aanmeldingen checken", description: "Vergeten genodigden alsnog uitnodigen, vragen beantwoorden" },
  ];

  if (eventDate && eventDate.getTime() > invite.getTime()) {
    const windowDays = Math.round((eventDate.getTime() - invite.getTime()) / 86400000);
    const rsvp = addDays(eventDate, -14);
    let reminder2 = addDays(invite, Math.round(windowDays * 0.7));
    if (reminder2.getTime() > addDays(rsvp, -3).getTime()) reminder2 = addDays(rsvp, -3);
    let reminder1 = addDays(invite, Math.round(windowDays * 0.4));
    if (reminder1.getTime() > addDays(reminder2, -7).getTime()) reminder1 = addDays(reminder2, -7);
    if (reminder1.getTime() < addDays(invite, 5).getTime()) reminder1 = addDays(invite, 5);

    raw.push(
      { date: reminder1, title: "Reminder 1 versturen", description: "Aan iedereen die nog niet heeft gereageerd" },
      { date: reminder2, title: "Reminder 2 — laatste kans", description: "Korte herinnering met de aanmelddeadline erin" },
      { date: rsvp, title: "Aanmelddeadline (RSVP)", description: "Definitieve gastenlijst opmaken" },
      { date: addDays(eventDate, -7), title: "Bevestigingsmail met praktische info", description: "Locatie, tijden, parkeren, programma naar alle aanmeldingen" },
      { date: addDays(eventDate, -2), title: "Laatste check aantallen", description: "Definitieve aantallen doorgeven aan locatie en leveranciers" },
    );
  } else {
    raw.push(
      { date: addDays(invite, 14), title: "Reminder 1 versturen", description: "Aan iedereen die nog niet heeft gereageerd" },
      { date: addDays(invite, 28), title: "Reminder 2 — laatste kans", description: "Korte herinnering met de aanmelddeadline erin" },
    );
  }

  return raw
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((s) => ({ title: s.title, description: s.description, date: toIso(s.date), done: false }));
}

// ─── Agenda-export (.ics) ───────────────────────────────────────────────────
//
// De app heeft geen server en kan dus zelf geen e-mail sturen. Via een
// .ics-export komen de stappen als agenda-items (met herinnering om 9:00)
// in Outlook/Google/Apple Agenda — die sturen vervolgens zelf de melding
// of e-mail, afhankelijk van de agenda-instellingen van de gebruiker.

export function commStepsToIcs(eventName: string, steps: CommStep[]): string {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const vevents = steps.map((s) => {
    const d = s.date.replace(/-/g, "");
    return [
      "BEGIN:VEVENT",
      `UID:eventhub-${d}-${s.id}-${eventName.replace(/[^a-zA-Z0-9]/g, "")}@event-hub`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${esc(`${eventName} — ${s.title}`)}`,
      s.description ? `DESCRIPTION:${esc(s.description)}` : "",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(s.title)}`,
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event Hub//Communicatielijn//NL",
    "CALSCALE:GREGORIAN",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}
