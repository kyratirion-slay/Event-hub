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
  vatRate: number; // percentage, e.g. 21
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
}
