export type Status = "in voorbereiding" | "bevestigd" | "afgerond" | "concept";

export interface ProgramItem {
  time: string;
  title: string;
  notes?: string;
}

export interface Todo {
  id: number;
  text: string;
  status: "open" | "done";
  deadline?: string;
  category: string;
}

export interface BudgetLineItem {
  id: number;
  description: string;
  amountExclVat: number;
  vatRate: number;
}

export interface BudgetCategory {
  id: number;
  name: string;
  items: BudgetLineItem[];
}

export interface TimelineItem {
  id: number;
  date: string;
  title: string;
  done: boolean;
  type: "user" | "suggestion";
  linkedTodoId?: number;
}

export interface EventBriefing {
  concept: string;
  doelgroep: string;
  sfeerThema: string;
  format: string;
  bijzonderheden: string;
  dresscode: string;
  cateringWensen: string;
  avTechniek: string;
  vrijeNotities: string;
}

export interface NoteWindow {
  id: number;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
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
  totalBudget: number;
  briefing: EventBriefing;
  program: ProgramItem[];
  todos: Todo[];
  budgetCategories: BudgetCategory[];
  timeline: TimelineItem[];
  noteWindows?: NoteWindow[];
  briefingFieldOrder?: Array<keyof EventBriefing>;
}

// ─── Leveranciers ──────────────────────────────────────────────────────────

export interface SupplierContact {
  name: string;
  phone: string;
  email: string;
}

export interface Supplier {
  id: number;
  name: string;
  category: string;
  subcategories: string[];
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  contact: SupplierContact;
  priceIndication: string;
  notes: string;
  // Extra filter fields (relevant for all, especially sprekers)
  typeEvent?: string;
  taal?: string;
  dagdeelVoorkeur?: string;
  regio?: string;
  eerderGebruikt?: boolean;
}
