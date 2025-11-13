"use client";

// Shared types for the Instruments/Components UI

export interface Category { id: number; name: string }

export interface Subcategory { id: number; name: string; category_id: number }

export interface Instrument {
  id: number;
  name: string;
  quantity: number;
  is_consumable: boolean;
  is_available?: boolean;
  location?: string;
  min_issue_limit: number;
  max_issue_limit: number;
  description?: string;
  available_quantity?: number;
  // Fallback numeric IDs if backend returns them
  category_id?: number;
  sub_category_id?: number;
  category?: { id: number; name: string };
  sub_category?: { id: number; name: string };
}

export interface IssueRequest {
  id: number;
  item: { id: number; name?: string } | number;
  user?: { id: number; name?: string; email?: string };
  user_id: number;
  quantity: number;
  status: string;
  created_at: string;
  approved_at?: string | null;
  return_by?: string | null;
  remarks?: string;
  submission_status?: "not_required" | "pending" | "submitted";
  submitted_at?: string | null;
}

export type UserRole = "admin" | "faculty" | "staff" | "student" | "guest" | null;

export const PAGE_SIZE = 10;

// Small helper if needed by subcomponents
export const availableForItem = (item: Instrument) =>
  item.is_available === false
    ? 0
    : (item.is_consumable ? item.quantity : item.available_quantity ?? item.quantity);
