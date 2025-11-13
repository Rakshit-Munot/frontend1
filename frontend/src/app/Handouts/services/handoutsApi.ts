const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export interface HandoutRecord {
  id: number;
  title?: string | null;
  comment?: string | null;
  file_url: string;
  original_filename?: string | null;
  uploaded_at: string;
  lab_id?: number | null;
  lab_name?: string | null;
}

export interface PaginatedHandouts {
  items: HandoutRecord[];
  page: number;
  total_pages: number;
  total: number;
}

// Cache settings (match billsApi behavior)
const NOW = () => Date.now();
const TTL_MS = 120_000; // 2 minutes in-memory
const PERSIST_TTL_MS = 21_600_000; // 6 hours persistent

type Key = string;
const inFlight = new Map<Key, Promise<void>>();
let inFlightYears: Promise<void> | null = null;

const memCache = new Map<Key, { at: number; data: PaginatedHandouts }>();
const yearsMem = new Map<string, { at: number; data: number[] }>();

function lsGet<T>(key: string): { at: number; data: T } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.at !== "number" || !("data" in parsed)) return null;
    if (NOW() - parsed.at > PERSIST_TTL_MS) return null;
    return parsed as { at: number; data: T };
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify({ at: NOW(), data })); } catch {}
}

function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch {}
}

function keyFor(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): Key {
  const p = params.page ?? 1;
  const l = params.limit ?? 10;
  const q = (params.q || "").trim();
  const lab = params.labId === undefined ? "" : params.labId === "all" ? "all" : String(params.labId);
  const yr = params.year ? String(params.year) : "";
  return `${p}|${l}|${q}|${lab}|${yr}`;
}

function lsKey(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): string {
  return `handouts:persist:${keyFor(params)}`;
}

function yearsLsKey(): string { return "handouts:persist:years"; }

function getCached(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): PaginatedHandouts | null {
  const e = memCache.get(keyFor(params));
  if (!e) return null;
  if (NOW() - e.at > TTL_MS) return null;
  return e.data;
}

function setCached(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}, data: PaginatedHandouts) {
  memCache.set(keyFor(params), { at: NOW(), data });
  lsSet(lsKey(params), data);
}

export function invalidateHandoutsCache(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): void {
  memCache.delete(keyFor(params));
  lsRemove(lsKey(params));
}

export function readCachedHandoutsSync(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): PaginatedHandouts | null {
  const mem = getCached(params);
  if (mem) return mem;
  const ls = lsGet<PaginatedHandouts>(lsKey(params));
  return ls ? ls.data : null;
}

function getCachedYears(): number[] | null {
  const e = yearsMem.get("years");
  if (!e) return null;
  if (NOW() - e.at > TTL_MS) return null;
  return e.data;
}

function setCachedYears(data: number[]) {
  yearsMem.set("years", { at: NOW(), data });
  lsSet(yearsLsKey(), data);
}

export function readCachedHandoutYearsSync(): number[] | null {
  const mem = getCachedYears();
  if (mem) return mem;
  const ls = lsGet<number[]>(yearsLsKey());
  return ls ? ls.data : null;
}

async function revalidate(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): Promise<void> {
  const key = keyFor(params);
  if (inFlight.has(key)) return inFlight.get(key)!;
  const p = (async () => {
    try {
      if (!API_URL) return;
      const q = new URLSearchParams();
      if (params.page) q.set("page", String(params.page));
      if (params.limit) q.set("limit", String(params.limit));
      if (params.q) q.set("q", params.q.trim());
      if (params.labId && params.labId !== "all") q.set("lab_id", String(params.labId));
  if (params.year) q.set("year", String(params.year));
      const url = `${API_URL}/api/handouts${q.toString() ? `?${q.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: PaginatedHandouts = {
        items: (data.items || []).map((h: any) => ({
          id: Number(h.id),
          title: h.title ?? null,
          comment: h.comment ?? null,
          file_url: h.file_url,
          original_filename: h.original_filename ?? null,
          uploaded_at: h.uploaded_at,
          lab_id: h.lab_id ?? null,
          lab_name: h.lab_name ?? null,
        })),
        page: data.page,
        total_pages: data.total_pages,
        total: data.total,
      };
      setCached(params, mapped);
    } catch {}
    finally { inFlight.delete(key); }
  })();
  inFlight.set(key, p);
  return p;
}

export async function listHandouts(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): Promise<PaginatedHandouts> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const mem = getCached(params);
  const persisted = !mem ? lsGet<PaginatedHandouts>(lsKey(params))?.data ?? null : null;
  const cached = mem || persisted;
  if (cached) {
    if (typeof window !== "undefined") revalidate(params);
    return cached;
  }
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.q) q.set("q", params.q.trim());
  if (params.labId && params.labId !== "all") q.set("lab_id", String(params.labId));
  if (params.year) q.set("year", String(params.year));
  const url = `${API_URL}/api/handouts${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch handouts");
  const data = await res.json();
  const mapped: PaginatedHandouts = {
    items: (data.items || []).map((h: any) => ({
      id: Number(h.id),
      title: h.title ?? null,
      comment: h.comment ?? null,
      file_url: h.file_url,
      original_filename: h.original_filename ?? null,
      uploaded_at: h.uploaded_at,
      lab_id: h.lab_id ?? null,
      lab_name: h.lab_name ?? null,
    })),
    page: data.page,
    total_pages: data.total_pages,
    total: data.total,
  };
  setCached(params, mapped);
  return mapped;
}

export async function prefetchHandouts(params: { page?: number; limit?: number; q?: string; labId?: number | "all"; year?: number } = {}): Promise<void> {
  try {
    if (getCached(params)) return;
    const data = await listHandouts(params);
    setCached(params, data);
  } catch {}
}

export async function listHandoutYears(): Promise<number[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const mem = getCachedYears();
  const persisted = !mem ? lsGet<number[]>(yearsLsKey())?.data ?? null : null;
  const cached = mem || persisted;
  if (cached) {
    if (typeof window !== "undefined") {
      if (!inFlightYears) {
        inFlightYears = (async () => {
          try {
            const res = await fetch(`${API_URL}/api/handouts/years`, { credentials: "include", cache: "no-store" });
            if (!res.ok) return;
            const list = (await res.json()) as number[];
            setCachedYears(list);
          } catch {} finally { inFlightYears = null; }
        })();
      }
    }
    return cached;
  }
  const res = await fetch(`${API_URL}/api/handouts/years`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch handout years");
  const list = (await res.json()) as number[];
  setCachedYears(list);
  return list;
}
