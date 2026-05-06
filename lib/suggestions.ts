import type { Event, TimelineItem } from "./types";

const DUTCH_MONTHS: Record<string, number> = {
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5,
  juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};

function parseDutchDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(" ");
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const month = DUTCH_MONTHS[parts[1].toLowerCase()];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function formatDutchDate(date: Date): string {
  const months = [
    "jan", "feb", "mrt", "apr", "mei", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function weeksBeforeEvent(eventDate: Date, weeks: number): Date {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

function daysBeforeEvent(eventDate: Date, days: number): Date {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - days);
  return d;
}

interface SuggestionTemplate {
  weeksOrDays: { type: "weeks" | "days"; value: number };
  title: string;
  types?: string[];
}

const GENERAL_SUGGESTIONS: SuggestionTemplate[] = [
  { weeksOrDays: { type: "weeks", value: 10 }, title: "Locatieselectie afronden" },
  { weeksOrDays: { type: "weeks", value: 8 }, title: "Locatie boeken & contract tekenen" },
  { weeksOrDays: { type: "weeks", value: 7 }, title: "Concept & programma vaststellen" },
  { weeksOrDays: { type: "weeks", value: 6 }, title: "Uitnodigingen versturen (1e ronde)" },
  { weeksOrDays: { type: "weeks", value: 5 }, title: "Catering offerte opvragen" },
  { weeksOrDays: { type: "weeks", value: 4 }, title: "Catering bevestigen" },
  { weeksOrDays: { type: "weeks", value: 3 }, title: "AV & techniek regelen" },
  { weeksOrDays: { type: "weeks", value: 2 }, title: "RSVP-deadline — definitief gastenaantal" },
  { weeksOrDays: { type: "weeks", value: 1 }, title: "Gastenlijst doorzetten naar catering & locatie" },
  { weeksOrDays: { type: "days", value: 3 }, title: "Draaiboek finaliseren" },
  { weeksOrDays: { type: "days", value: 1 }, title: "Technische check op locatie" },
];

const TYPE_SPECIFIC_SUGGESTIONS: SuggestionTemplate[] = [
  { weeksOrDays: { type: "weeks", value: 9 }, title: "DJ / entertainment boeken", types: ["Netwerkevent", "Borrel", "Receptie"] },
  { weeksOrDays: { type: "weeks", value: 5 }, title: "Menu definitief maken met restaurant", types: ["Corporate Dinner", "Diner"] },
  { weeksOrDays: { type: "weeks", value: 8 }, title: "Persuitnodigingen versturen", types: ["Lancering", "Launch"] },
  { weeksOrDays: { type: "weeks", value: 4 }, title: "Persmap / persinformatie gereed maken", types: ["Lancering", "Launch"] },
  { weeksOrDays: { type: "weeks", value: 6 }, title: "Workshop materiaal voorbereiden", types: ["Corporate Retreat", "Team Retreat", "Offsite"] },
  { weeksOrDays: { type: "weeks", value: 3 }, title: "Reisinfo & parkeerinformatie versturen naar deelnemers", types: ["Corporate Retreat", "Team Retreat", "Offsite", "Corporate Dinner"] },
];

export function generateSuggestions(event: Event): TimelineItem[] {
  const eventDate = parseDutchDate(event.date);
  if (!eventDate) return [];

  const existingTitles = new Set(
    event.timeline.filter((t) => t.type === "user").map((t) => t.title.toLowerCase())
  );

  const templates: SuggestionTemplate[] = [
    ...GENERAL_SUGGESTIONS,
    ...TYPE_SPECIFIC_SUGGESTIONS.filter((s) =>
      s.types?.some((t) => event.type.toLowerCase().includes(t.toLowerCase()))
    ),
  ];

  const today = new Date();

  type SuggestionItem = TimelineItem & { type: "suggestion" };

  const suggestions: SuggestionItem[] = templates
    .map((tmpl, i): SuggestionItem | null => {
      const suggDate =
        tmpl.weeksOrDays.type === "weeks"
          ? weeksBeforeEvent(eventDate, tmpl.weeksOrDays.value)
          : daysBeforeEvent(eventDate, tmpl.weeksOrDays.value);

      // Skip if already past or covered by user item
      if (suggDate <= today) return null;
      if (existingTitles.has(tmpl.title.toLowerCase())) return null;

      return {
        id: 1000 + i,
        date: formatDutchDate(suggDate),
        title: tmpl.title,
        done: false,
        type: "suggestion" as const,
      };
    })
    .filter((s): s is SuggestionItem => s !== null)
    .sort((a, b) => {
      // Sort by parsed date within the event year
      const parseSimple = (d: string) => {
        const [day, mon] = d.split(" ");
        const m = Object.entries({ jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 }).find(([k]) => k === mon)?.[1] ?? 0;
        return m * 31 + parseInt(day, 10);
      };
      return parseSimple(a.date) - parseSimple(b.date);
    });

  return suggestions;
}
