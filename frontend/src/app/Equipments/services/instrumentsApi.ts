import type { Category, Subcategory, Instrument } from "../types/dashboard";
import { API_URL } from "../constants/dashboard";

// Simple in-memory caches with short TTL to make the UI feel instant
type Key = string;
const now = () => Date.now();

const TTL_CATS = 60_000; // 60s
const TTL_SUBS = 60_000; // 60s
const TTL_ITEMS = 45_000; // 45s

const catsCache = new Map<Key, { at: number; data: Category[] }>();
const subsCache = new Map<Key, { at: number; data: Subcategory[] }>();
const itemsCache = new Map<Key, { at: number; data: Instrument[] }>();

// Persistent cache (1 day) via localStorage to survive refreshes
const PERSIST_TTL = 86_400_000; // 1 day
function lsGet<T>(key: string): { at: number; data: T } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    if (typeof obj.at !== 'number' || !('data' in obj)) return null;
    if (now() - obj.at > PERSIST_TTL) return null;
    return obj as { at: number; data: T };
  } catch { return null; }
}
function lsSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify({ at: now(), data })); } catch {}
}
const LS_CATS = 'instruments:persist:categories';
const LS_SUBS = (catId: number) => `instruments:persist:subs:${catId}`;
const LS_ITEMS = (subId: number) => `instruments:persist:items:${subId}`;

function isFresh<T>(entry: { at: number; data: T } | undefined, ttl: number): entry is { at: number; data: T } {
  return !!entry && now() - entry.at <= ttl;
}

// Categories
export async function listCategories(): Promise<Category[]> {
  const key = "categories";
  const cached = catsCache.get(key);
  if (isFresh(cached, TTL_CATS)) return cached.data;
  const persisted = lsGet<Category[]>(LS_CATS);
  if (persisted) {
    // return persisted immediately and refresh in background
    catsCache.set(key, { at: persisted.at, data: persisted.data });
    return persisted.data;
  }
  const res = await fetch(`${API_URL}/categories`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  const data = (await res.json()) as Category[];
  catsCache.set(key, { at: now(), data });
  lsSet(LS_CATS, data);
  return data;
}

export async function prefetchCategories(): Promise<void> {
  try {
    const data = await listCategories();
    lsSet(LS_CATS, data);
  } catch { /* ignore */ }
}

// Subcategories by category
export async function listSubcategories(categoryId: number): Promise<Subcategory[]> {
  const key = `subs:${categoryId}`;
  const cached = subsCache.get(key);
  if (isFresh(cached, TTL_SUBS)) return cached.data;
  const persisted = lsGet<Subcategory[]>(LS_SUBS(categoryId));
  if (persisted) {
    subsCache.set(key, { at: persisted.at, data: persisted.data });
    return persisted.data;
  }
  // Prefer proper subcategories endpoint
  const res = await fetch(`${API_URL}/subcategories?category_id=${categoryId}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load subcategories");
  const data = (await res.json()) as Subcategory[];
  // Ensure category_id present (backend provides it)
  subsCache.set(key, { at: now(), data });
  lsSet(LS_SUBS(categoryId), data);
  return data;
}

export async function prefetchSubcategories(categoryId: number): Promise<void> {
  try {
    const data = await listSubcategories(categoryId);
    lsSet(LS_SUBS(categoryId), data);
  } catch { /* ignore */ }
}

// Instruments by subcategory
export async function listInstrumentsBySubcategory(subcategoryId: number): Promise<Instrument[]> {
  const key = `items:sub:${subcategoryId}`;
  const cached = itemsCache.get(key);
  if (isFresh(cached, TTL_ITEMS)) return cached.data;
  const persisted = lsGet<Instrument[]>(LS_ITEMS(subcategoryId));
  if (persisted) {
    itemsCache.set(key, { at: persisted.at, data: persisted.data });
    return persisted.data;
  }
  const res = await fetch(`${API_URL}/items?subcategory=${subcategoryId}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load instruments");
  const data = (await res.json()) as Instrument[];
  itemsCache.set(key, { at: now(), data });
  lsSet(LS_ITEMS(subcategoryId), data);
  return data;
}

export async function prefetchInstruments(subcategoryId: number): Promise<void> {
  try {
    const data = await listInstrumentsBySubcategory(subcategoryId);
    lsSet(LS_ITEMS(subcategoryId), data);
  } catch { /* ignore */ }
}

// Sync readers for immediate hydration without awaiting network
export function readCachedCategoriesSync(): Category[] | null {
  const persisted = lsGet<Category[]>(LS_CATS);
  return persisted ? persisted.data : null;
}
export function readCachedSubcategoriesSync(categoryId: number): Subcategory[] | null {
  const persisted = lsGet<Subcategory[]>(LS_SUBS(categoryId));
  return persisted ? persisted.data : null;
}
export function readCachedInstrumentsSync(subcategoryId: number): Instrument[] | null {
  const persisted = lsGet<Instrument[]>(LS_ITEMS(subcategoryId));
  return persisted ? persisted.data : null;
}

// Utility: warm next subcategory instruments within a category list
export async function prefetchAdjacentSubcategory(
  subcategories: Subcategory[],
  currentSubId: number
): Promise<void> {
  try {
    const idx = subcategories.findIndex((s) => s.id === currentSubId);
    if (idx >= 0 && idx + 1 < subcategories.length) {
      await prefetchInstruments(subcategories[idx + 1].id);
    }
  } catch { /* ignore */ }
}

// Prefetch entire instruments catalog (categories -> subcategories -> items)
export async function prefetchAllInstruments(concurrency = 5): Promise<void> {
  try {
    const cats = await listCategories();
    const subsArrays = await Promise.all(cats.map(c => listSubcategories(c.id).catch(() => [] as Subcategory[])));
    const subs = ([] as Subcategory[]).concat(...subsArrays);
    const tasks: Array<() => Promise<void>> = subs.map((s) => async () => {
      try { await listInstrumentsBySubcategory(s.id); } catch {}
    });
    const pool = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
      while (tasks.length) {
        const t = tasks.shift();
        if (!t) break;
        await t();
      }
    });
    await Promise.all(pool);
  } catch {
    // ignore
  }
}
