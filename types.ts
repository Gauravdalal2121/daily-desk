export type Priority = 'high' | 'medium' | 'low';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate: number; // Timestamp for the due date
  priority: Priority;
  checklist?: ChecklistItem[]; // Pre-requisites/Subtasks
  isTimeSet?: boolean; // Whether a specific time was set
  recurrence?: Recurrence;
}

export type Theme = 'light' | 'dark';

export interface AIAnalysisResponse {
  checklist: string[];
  priority: Priority;
  suggestedTime?: string; // "HH:MM" 24h format
}

// Updated to support modifying existing tasks
export interface AICommandResult {
  action: 'create' | 'update';
  originalId?: string; // If updating, which ID
  text: string;
  priority: Priority;
  checklist: string[];
  dueDateOffset?: number; 
  suggestedTime?: string; 
  reason?: string; // Why the AI did this (e.g., "Rescheduled per request")
}

export type View = 'today' | 'calendar' | 'insights';

export interface Reminder {
  todo: Todo;
  active: boolean;
}