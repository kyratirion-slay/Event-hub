export type Status = "in voorbereiding" | "bevestigd" | "afgerond" | "concept";

export interface ProgramItem {
  time: string;
  title: string;
  notes?: string;
}

export interface Todo {
  id: number;
  text: string;
  status: "open" | "in progress" | "done";
  deadline?: string;
  category: string;
}

export interface BudgetItem {
  category: string;
  estimated: number;
  actual: number;
}

export interface TimelineItem {
  date: string;
  title: string;
  done: boolean;
  linkedTodoId?: number;
}

export interface Contact {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  guests: number;
  status: Status;
  type: string;
  coverColor: string;
  concept?: string;
  audience?: string;
  theme?: string;
  format?: string;
  notes?: string;
  program: ProgramItem[];
  todos: Todo[];
  budget: BudgetItem[];
  timeline: TimelineItem[];
  contacts: Contact[];
}

export const events: Event[] = [
  {
    id: 1,
    name: "Strategie Offsite — Q3 Leadership",
    date: "12 juni 2025",
    startTime: "10:00",
    endTime: "18:00",
    location: "Het Scheepvaartmuseum, Amsterdam",
    guests: 34,
    status: "bevestigd",
    type: "Corporate Retreat",
    coverColor: "#e86fa3",
    concept: "Een volledige dag buiten de kantooromgeving voor het leadership team. Focus op strategie Q3/Q4, teamcohesie en besluitvorming. Rustige, geconcentreerde sfeer met ruimte voor verdieping.",
    audience: "34 directeuren en senior managers",
    theme: "Focus & Richting — weg van de waan van de dag",
    format: "Plenaire sessies afgewisseld met groepsworkshops, lunch met vrije tafelindeling, afsluiting met borrel",
    notes: "",
    program: [
      { time: "09:30", title: "Inloop & koffie" },
      { time: "10:00", title: "Opening door CEO", notes: "Max 20 min, toon zetten" },
      { time: "10:30", title: "Plenaire sessie: Terugblik H1" },
      { time: "12:00", title: "Lunch (buffet, vrije opstelling)" },
      { time: "13:00", title: "Groepsworkshops (3x parallel)", notes: "Ruimte A, B en C" },
      { time: "15:00", title: "Pauze & bewegingsmoment" },
      { time: "15:30", title: "Plenaire terugkoppeling workshops" },
      { time: "17:00", title: "Besluitvorming & prioriteiten Q3" },
      { time: "17:45", title: "Afsluiting & borrel" },
    ],
    todos: [
      { id: 1, text: "Offerte catering bevestigen", status: "done", deadline: "15 mei", category: "Catering" },
      { id: 2, text: "AV-setup controleren met venue", status: "done", deadline: "1 juni", category: "Locatie" },
      { id: 3, text: "Programmaboekje naar drukker", status: "in progress", deadline: "5 juni", category: "Communicatie" },
      { id: 4, text: "Reisinfo sturen naar deelnemers", status: "in progress", deadline: "5 juni", category: "Communicatie" },
      { id: 5, text: "Workshopmateriaal ophalen", status: "open", deadline: "11 juni", category: "Inhoud" },
      { id: 6, text: "Naam badges bestellen", status: "open", deadline: "8 juni", category: "Logistiek" },
      { id: 7, text: "Parkeerfaciliteiten regelen", status: "open", deadline: "10 juni", category: "Logistiek" },
    ],
    budget: [
      { category: "Locatiehuur", estimated: 4500, actual: 4500 },
      { category: "Catering (lunch + borrel)", estimated: 3200, actual: 3050 },
      { category: "AV & techniek", estimated: 1200, actual: 1400 },
      { category: "Drukwerk", estimated: 350, actual: 0 },
      { category: "Vervoer", estimated: 600, actual: 0 },
      { category: "Overig", estimated: 500, actual: 120 },
    ],
    timeline: [
      { date: "1 apr", title: "Locatie geboekt", done: true },
      { date: "15 apr", title: "Programma vastgesteld", done: true },
      { date: "1 mei", title: "Uitnodigingen verstuurd", done: true },
      { date: "15 mei", title: "Catering bevestigd", done: true },
      { date: "5 jun", title: "Programmaboekje klaar", done: false, linkedTodoId: 3 },
      { date: "5 jun", title: "Reisinfo verstuurd", done: false, linkedTodoId: 4 },
      { date: "10 jun", title: "Alle logistiek geregeld", done: false },
      { date: "12 jun", title: "Event", done: false },
    ],
    contacts: [
      { name: "Marieke de Vries", role: "Contactpersoon venue", phone: "06-12345678", email: "marieke@scheepvaartmuseum.nl" },
      { name: "Tom Bakker", role: "Cateraar", phone: "06-87654321", email: "tom@tastemakers.nl" },
      { name: "Sandra Hoek", role: "AV-technicus", phone: "06-11223344" },
    ],
  },
  {
    id: 2,
    name: "Zomerborrel Tech & Talent",
    date: "27 juni 2025",
    startTime: "17:00",
    endTime: "21:00",
    location: "Rooftop NDSM, Amsterdam-Noord",
    guests: 120,
    status: "in voorbereiding",
    type: "Netwerkevent",
    coverColor: "#6e9fc8",
    concept: "Informele zomerborrel voor relaties en medewerkers uit de tech- en talentenbranche. Luchtige sfeer, rooftop met uitzicht, muziek op de achtergrond.",
    audience: "120 professionals (mix klanten, partners en interne collega's)",
    theme: "Zomer / open lucht / verbinding",
    format: "Staande receptie, geen programma, DJ set, bites & drinks",
    notes: "Regenplan nodig — tent of alternatieve locatie binnenshuis.",
    program: [
      { time: "17:00", title: "Deuren open, welkomstdrankje" },
      { time: "17:30", title: "DJ start", notes: "Relaxed background set" },
      { time: "19:00", title: "Bites ronde 2" },
      { time: "20:30", title: "Last orders" },
      { time: "21:00", title: "Einde officieel programma" },
    ],
    todos: [
      { id: 1, text: "Regenplan bevestigen met venue", status: "open", deadline: "10 jun", category: "Locatie" },
      { id: 2, text: "DJ contract tekenen", status: "in progress", deadline: "1 jun", category: "Entertainment" },
      { id: 3, text: "Uitnodigingen sturen (2e ronde)", status: "open", deadline: "15 jun", category: "Communicatie" },
      { id: 4, text: "Barmedewerkers boeken", status: "open", deadline: "1 jun", category: "Catering" },
      { id: 5, text: "RSVP-deadline bewaken", status: "open", deadline: "20 jun", category: "Gasten" },
    ],
    budget: [
      { category: "Locatiehuur", estimated: 2800, actual: 2800 },
      { category: "Catering & bar", estimated: 4200, actual: 0 },
      { category: "DJ", estimated: 900, actual: 0 },
      { category: "Decoratie", estimated: 400, actual: 0 },
      { category: "Overig", estimated: 300, actual: 0 },
    ],
    timeline: [
      { date: "1 mei", title: "Locatie geboekt", done: true },
      { date: "15 mei", title: "Uitnodigingen (1e ronde)", done: true },
      { date: "1 jun", title: "DJ bevestigd", done: false, linkedTodoId: 2 },
      { date: "15 jun", title: "2e ronde uitnodigingen", done: false, linkedTodoId: 3 },
      { date: "20 jun", title: "RSVP-deadline", done: false },
      { date: "25 jun", title: "Definitief gastenaantal door", done: false },
      { date: "27 jun", title: "Event", done: false },
    ],
    contacts: [
      { name: "Kevin Smit", role: "Venue manager NDSM", phone: "06-55667788", email: "kevin@ndsm.nl" },
      { name: "DJ Arno", role: "DJ", phone: "06-99001122", email: "arno@soundworks.nl" },
    ],
  },
  {
    id: 3,
    name: "Jaarlijks Klantendiner 2025",
    date: "18 september 2025",
    startTime: "19:00",
    endTime: "23:00",
    location: "Restaurant De Kas, Amsterdam",
    guests: 48,
    status: "concept",
    type: "Corporate Dinner",
    coverColor: "#a96ec8",
    concept: "",
    audience: "48 vaste klanten (A-relaties)",
    theme: "Nog te bepalen",
    format: "Zittend diner, meerdere gangen, korte toespraak directie",
    notes: "",
    program: [],
    todos: [
      { id: 1, text: "Locaties vergelijken en keuze maken", status: "open", deadline: "1 jul", category: "Locatie" },
      { id: 2, text: "Concept en thema uitwerken", status: "open", deadline: "1 jul", category: "Inhoud" },
    ],
    budget: [
      { category: "Locatie & diner", estimated: 9600, actual: 0 },
      { category: "Wijn & dranken", estimated: 2400, actual: 0 },
      { category: "Decoratie", estimated: 800, actual: 0 },
    ],
    timeline: [
      { date: "1 jul", title: "Locatie en concept vastgesteld", done: false },
      { date: "1 aug", title: "Uitnodigingen verstuurd", done: false },
      { date: "18 sep", title: "Event", done: false },
    ],
    contacts: [],
  },
  {
    id: 4,
    name: "Productlancering 'Nova'",
    date: "4 oktober 2025",
    startTime: "14:00",
    endTime: "20:00",
    location: "Westergasfabriek, Amsterdam",
    guests: 280,
    status: "in voorbereiding",
    type: "Lancering",
    coverColor: "#c86e6e",
    concept: "Grootschalige lancering van product Nova voor pers, partners en klanten. Hoog energieniveau, indrukwekkende presentatie, feestelijk slot.",
    audience: "Pers (40), partners (100), klanten (140)",
    theme: "Nova — nieuw tijdperk",
    format: "Presentatie, demo-stands, netwerkreceptie",
    notes: "",
    program: [
      { time: "14:00", title: "Inloop & registratie" },
      { time: "15:00", title: "Plenaire presentatie (CEO + product team)" },
      { time: "16:30", title: "Product demo sessies (3 tracks)" },
      { time: "18:00", title: "Lanceringsmoment + toast" },
      { time: "18:30", title: "Netwerkreceptie" },
      { time: "20:00", title: "Einde" },
    ],
    todos: [
      { id: 1, text: "Persuitnodigingen versturen", status: "open", deadline: "1 aug", category: "PR" },
      { id: 2, text: "Presentatie CEO afstemmen", status: "in progress", deadline: "1 sep", category: "Inhoud" },
      { id: 3, text: "Demo-stands ontwerpen", status: "open", deadline: "15 aug", category: "Productie" },
      { id: 4, text: "Catering offerte aanvragen", status: "open", deadline: "1 jul", category: "Catering" },
    ],
    budget: [
      { category: "Locatiehuur", estimated: 12000, actual: 12000 },
      { category: "Productie & stands", estimated: 18000, actual: 0 },
      { category: "Catering", estimated: 8400, actual: 0 },
      { category: "AV & licht", estimated: 6500, actual: 0 },
      { category: "PR & communicatie", estimated: 4000, actual: 0 },
    ],
    timeline: [
      { date: "1 jun", title: "Locatie geboekt", done: true },
      { date: "1 jul", title: "Catering offerte aangevraagd", done: false, linkedTodoId: 4 },
      { date: "1 aug", title: "Persuitnodigingen verstuurd", done: false, linkedTodoId: 1 },
      { date: "15 aug", title: "Demo-stands ontworpen", done: false, linkedTodoId: 3 },
      { date: "1 sep", title: "Presentatie afgerond", done: false, linkedTodoId: 2 },
      { date: "4 okt", title: "Event", done: false },
    ],
    contacts: [
      { name: "Fleur Janssen", role: "Westergasfabriek", phone: "06-33445566", email: "fleur@westergasfabriek.nl" },
    ],
  },
  {
    id: 5,
    name: "Team Retreat — Winter Edition",
    date: "5 december 2025",
    startTime: "10:00",
    endTime: "16:00",
    location: "Landgoed De Witte Berken, Drenthe",
    guests: 22,
    status: "concept",
    type: "Team Retreat",
    coverColor: "#6ec8b4",
    concept: "",
    audience: "22 teamleden",
    theme: "Nog te bepalen",
    format: "Dagprogramma met activiteiten en diner",
    notes: "",
    program: [],
    todos: [
      { id: 1, text: "Datum en locatie intern bevestigen", status: "open", deadline: "1 sep", category: "Logistiek" },
    ],
    budget: [
      { category: "Locatie & accommodatie", estimated: 3300, actual: 0 },
      { category: "Activiteiten", estimated: 1200, actual: 0 },
      { category: "Catering", estimated: 1100, actual: 0 },
    ],
    timeline: [
      { date: "1 sep", title: "Locatie bevestigd", done: false },
      { date: "5 dec", title: "Event", done: false },
    ],
    contacts: [],
  },
  {
    id: 6,
    name: "Nieuwjaarsreceptie 2025",
    date: "10 januari 2025",
    startTime: "16:00",
    endTime: "19:00",
    location: "Stadsschouwburg, Amsterdam",
    guests: 195,
    status: "afgerond",
    type: "Receptie",
    coverColor: "#8b8a7a",
    concept: "Jaarlijkse nieuwjaarsreceptie voor relaties en medewerkers. Toespraak directie, buffet, netwerken.",
    audience: "195 relaties en medewerkers",
    theme: "Nieuw jaar, nieuwe kansen",
    format: "Staande receptie, toespraak, buffet",
    notes: "Goed verlopen. Catering was uitstekend. Parkeren was knelpunt — voor volgend jaar alternatief zoeken.",
    program: [
      { time: "16:00", title: "Inloop" },
      { time: "16:30", title: "Toespraak directie" },
      { time: "17:00", title: "Buffet open" },
      { time: "19:00", title: "Einde" },
    ],
    todos: [],
    budget: [
      { category: "Locatiehuur", estimated: 5000, actual: 4800 },
      { category: "Catering", estimated: 7800, actual: 7950 },
      { category: "AV", estimated: 800, actual: 750 },
      { category: "Overig", estimated: 400, actual: 310 },
    ],
    timeline: [
      { date: "1 nov", title: "Locatie geboekt", done: true },
      { date: "1 dec", title: "Uitnodigingen verstuurd", done: true },
      { date: "10 jan", title: "Event", done: true },
    ],
    contacts: [
      { name: "Bas Vermeer", role: "Stadsschouwburg", email: "bas@schouwburg.nl" },
    ],
  },
];
