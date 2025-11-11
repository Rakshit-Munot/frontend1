"use client";
import type { BillRecord, FinancialYear } from "../types";
import { getFinancialYear } from "../utils";

const STORAGE_KEY = "dash-bills";

function readAll(): BillRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BillRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(bills: BillRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

export function addBill(bill: BillRecord) {
  const bills = readAll();
  bills.unshift(bill); // newest first
  writeAll(bills);
}

export function getAllBills(): BillRecord[] {
  return readAll();
}

export function getBillsByFY(fy: FinancialYear): BillRecord[] {
  return readAll().filter((b) => getFinancialYear(new Date(b.uploadedAt)) === fy);
}

export function getAvailableFYs(): FinancialYear[] {
  const set = new Set<string>();
  readAll().forEach((b) => set.add(getFinancialYear(new Date(b.uploadedAt))));
  return Array.from(set).sort().reverse() as FinancialYear[];
}
