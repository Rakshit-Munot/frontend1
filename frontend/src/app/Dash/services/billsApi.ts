import type { BillRecord, FinancialYear } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export interface PaginatedBills {
  items: BillRecord[];
  page: number;
  total_pages: number;
  total: number;
}

// Lightweight in-memory cache with TTL for instant-feel navigation
type BillsKey = string;
const NOW = () => Date.now();
// Extended TTL to keep UI feeling "live" longer (2 minutes)
const TTL_MS = 120_000; // 120s in-memory SWR window
// Reduced persistent cache window to 6 hours to lower stale risk after backend changes
const PERSIST_TTL_MS = 21_600_000; // 6 hours persistent cache

// In-flight trackers to avoid duplicate background revalidation fetches
const inFlightBills = new Map<string, Promise<void>>();
let inFlightYears: Promise<void> | null = null;

const billsCache = new Map<BillsKey, { at: number; data: PaginatedBills }>();
const yearsCache = new Map<string, { at: number; data: FinancialYear[] }>();

// Persistent cache via localStorage (safe access guarded for SSR)
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
  try {
    window.localStorage.setItem(key, JSON.stringify({ at: NOW(), data }));
  } catch {
    /* ignore quota errors */
  }
}

function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function lsKeyBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): string {
  return `bills:persist:${billsKey(params)}`;
}

function lsKeyYears(): string {
  return "bills:persist:years";
}

function billsKey(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): BillsKey {
  const fy = params.fy || "ALL";
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  return `${fy}|${page}|${limit}`;
}

function getCachedBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): PaginatedBills | null {
  const k = billsKey(params);
  const e = billsCache.get(k);
  if (!e) return null;
  if (NOW() - e.at > TTL_MS) return null;
  return e.data;
}

function setCachedBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}, data: PaginatedBills) {
  billsCache.set(billsKey(params), { at: NOW(), data });
  // Also persist for 1 day to survive reloads
  lsSet(lsKeyBills(params), data);
}

export function invalidateBillsCache(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): void {
  const k = billsKey(params);
  billsCache.delete(k);
  lsRemove(lsKeyBills(params));
}

function getCachedYears(): FinancialYear[] | null {
  const e = yearsCache.get("years");
  if (!e) return null;
  if (NOW() - e.at > TTL_MS) return null;
  return e.data;
}

function setCachedYears(data: FinancialYear[]) {
  yearsCache.set("years", { at: NOW(), data });
  lsSet(lsKeyYears(), data);
}

// Synchronous readers for UI to render immediately from persistent cache
export function readCachedBillsSync(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): PaginatedBills | null {
  const mem = getCachedBills(params);
  if (mem) return mem;
  const ls = lsGet<PaginatedBills>(lsKeyBills(params));
  return ls ? ls.data : null;
}

export function readCachedYearsSync(): FinancialYear[] | null {
  const mem = getCachedYears();
  if (mem) return mem;
  const ls = lsGet<FinancialYear[]>(lsKeyYears());
  return ls ? ls.data : null;
}

async function revalidateBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): Promise<void> {
  const key = billsKey(params);
  if (inFlightBills.has(key)) return inFlightBills.get(key)!;
  const p = (async () => {
    try {
      if (!API_URL) return; // cannot fetch without URL
      const q = new URLSearchParams();
      if (params.fy) q.set("fy", params.fy);
      if (params.page) q.set("page", String(params.page));
      if (params.limit) q.set("limit", String(params.limit));
      const url = `${API_URL}/api/bills${q.toString() ? `?${q.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (!res.ok) return; // silent fail keeps existing cache
      const data = await res.json();
      const mapped: PaginatedBills = {
        // FIX: Replaced 'any' with a specific inline type for the raw item
        items: (data.items || []).map((item: {
          id: string | number;
          bill_no: string;
          amount: number;
          file_url: string;
          original_filename: string;
          public_id: string;
          resource_type: string;
          uploaded_at: string;
          comment: string;
        }) => ({
          id: String(item.id),
          billNo: item.bill_no,
          billAmount: item.amount,
          fileUrl: item.file_url,
          fileName: item.original_filename || item.bill_no || "bill",
          fileType: "file",
          originalFilename: item.original_filename,
          cloudinaryPublicId: item.public_id,
          resourceType: item.resource_type,
          uploadedAt: item.uploaded_at,
          comment: item.comment,
        })),
        page: data.page,
        total_pages: data.total_pages,
        total: data.total,
      };
      setCachedBills(params, mapped);
    } catch {
      // ignore network errors
    } finally {
      inFlightBills.delete(key);
    }
  })();
  inFlightBills.set(key, p);
  return p;
}

export async function listBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): Promise<PaginatedBills> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  // Try memory first (fresh window) else persistent storage
  const mem = getCachedBills(params);
  const persisted = !mem ? lsGet<PaginatedBills>(lsKeyBills(params))?.data ?? null : null;
  const cached = mem || persisted;
  if (cached) {
    // SWR behavior: trigger background revalidation always (unless already in-flight)
    if (typeof window !== "undefined") revalidateBills(params);
    return cached;
  }
  const q = new URLSearchParams();
  if (params.fy) q.set("fy", params.fy);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const url = `${API_URL}/api/bills${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch bills");
  const data = await res.json();
  // Transform backend response to frontend format
  const mapped: PaginatedBills = {
    // FIX: Replaced 'any' with a specific inline type for the raw item
    items: (data.items || []).map((item: {
      id: string | number;
      bill_no: string;
      amount: number;
      file_url: string;
      original_filename: string;
      public_id: string;
      resource_type: string;
      uploaded_at: string;
      comment: string;
    }) => ({
      id: String(item.id),
      billNo: item.bill_no,
      billAmount: item.amount,
      fileUrl: item.file_url,
      fileName: item.original_filename || item.bill_no || "bill",
      fileType: "file",
      originalFilename: item.original_filename,
      cloudinaryPublicId: item.public_id,
      resourceType: item.resource_type,
      uploadedAt: item.uploaded_at,
      comment: item.comment,
    })),
    page: data.page,
    total_pages: data.total_pages,
    total: data.total,
  };
  setCachedBills(params, mapped);
  return mapped;
}

async function revalidateYears(): Promise<void> {
  if (inFlightYears) return inFlightYears;
  inFlightYears = (async () => {
    try {
      if (!API_URL) return;
      const res = await fetch(`${API_URL}/api/bills/years`, { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const years = (await res.json()) as FinancialYear[];
      setCachedYears(years);
    } catch {
      // ignore
    } finally {
      inFlightYears = null;
    }
  })();
  return inFlightYears;
}

export async function listBillYears(): Promise<FinancialYear[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const mem = getCachedYears();
  const persisted = !mem ? lsGet<FinancialYear[]>(lsKeyYears())?.data ?? null : null;
  const cached = mem || persisted;
  if (cached) {
    if (typeof window !== "undefined") revalidateYears();
    return cached;
  }
  const res = await fetch(`${API_URL}/api/bills/years`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch bill years");
  const years = (await res.json()) as FinancialYear[];
  setCachedYears(years);
  return years;
}

// --- Cache upsert helpers for instant hydration on refresh ---
export function upsertYearsCache(fy: FinancialYear) {
  const mem = getCachedYears() || [];
  const ls = lsGet<FinancialYear[]>(lsKeyYears())?.data || [];
  const combined = Array.from(new Set([fy, ...mem, ...ls]));
  setCachedYears(combined);
}

export function upsertBillToCaches(bill: BillRecord, fy: FinancialYear, limit = 10) {
  const keyParams = { fy, page: 1, limit };
  // read current from mem or ls
  const mem = getCachedBills(keyParams);
  const ls = lsGet<PaginatedBills>(lsKeyBills(keyParams))?.data || null;
  const base = mem || ls || ({ items: [], page: 1, total_pages: 1, total: 0 } as PaginatedBills);
  // upsert at top
  const items = [bill, ...base.items.filter((b) => String(b.id) !== String(bill.id))].slice(0, limit);
  const updated: PaginatedBills = { ...base, items, total: Math.max(base.total + 1, items.length) };
  setCachedBills(keyParams, updated);
  // ensure FY exists in years cache
  upsertYearsCache(fy);
}

export function removeBillFromCaches(billId: string): void {
  // In-memory cache pruning
  for (const [k, v] of Array.from(billsCache.entries())) {
    const filtered = v.data.items.filter((b) => String(b.id) !== String(billId));
    if (filtered.length !== v.data.items.length) {
      billsCache.set(k, { at: v.at, data: { ...v.data, items: filtered, total: Math.max(0, v.data.total || filtered.length) } });
    }
  }
  // Persistent cache pruning (best-effort)
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("bills:persist:") && key !== "bills:persist:years") {
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as { at: number; data: PaginatedBills };
          if (!parsed || !parsed.data || !Array.isArray(parsed.data.items)) continue;
          // FIX: Replaced 'any' with a specific inline type
          const filtered = parsed.data.items.filter((b: { id: string | number }) => String(b.id) !== String(billId));
          if (filtered.length !== parsed.data.items.length) {
            const updated = { at: parsed.at, data: { ...parsed.data, items: filtered, total: Math.max(0, parsed.data.total || filtered.length) } };
            window.localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
}

export async function uploadBill(input: { billNo: string; amount: number; file: File }): Promise<BillRecord> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const form = new FormData();
  form.append("bill_no", input.billNo);
  form.append("amount", String(input.amount));
  form.append("file", input.file);
  const res = await fetch(`${API_URL}/api/bills/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let message = "Upload failed";
    
    // FIX: Replaced 'any' with specific type casts
    const typedData = data as { detail?: unknown; error?: string; message?: string };
    const detail = typedData?.detail;

    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) {
      // FIX: Replaced 'any' with specific inline type
      message = detail.map((d: { msg?: string }) => d?.msg || JSON.stringify(d)).join("; ");
    } else if (typedData?.error) message = typedData.error;
    else if (typedData?.message) message = typedData.message;
    throw new Error(message);
  }
  const data = await res.json();
  return {
    id: String(data.id),
    billNo: data.bill_no,
    billAmount: data.amount,
    fileUrl: data.file_url,
    fileName: data.original_filename || input.file.name,
    fileType: "file",
    originalFilename: data.original_filename,
    cloudinaryPublicId: data.public_id,
    resourceType: data.resource_type,
    uploadedAt: data.uploaded_at,
    comment: data.comment,
  } as BillRecord;
}

export async function updateBillComment(id: number, comment: string | null): Promise<BillRecord> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const res = await fetch(`${API_URL}/api/bills/${id}/comment`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // FIX: Replaced 'any' with specific type casts
    throw new Error((data as { detail?: string }).detail || (data as { error?: string }).error || "Failed to update comment");
  }
  const data = await res.json();
  return {
    id: String(data.id),
    billNo: data.bill_no,
    billAmount: data.amount,
    fileUrl: data.file_url,
    fileName: data.original_filename || data.bill_no || "bill",
    fileType: "file",
    originalFilename: data.original_filename,
    cloudinaryPublicId: data.public_id,
    resourceType: data.resource_type,
    uploadedAt: data.uploaded_at,
    comment: data.comment,
  } as BillRecord;
}

export function replaceBillInCaches(bill: BillRecord, fy: FinancialYear, limit = 10) {
  const keyParams = { fy, page: 1, limit };
  const mem = getCachedBills(keyParams);
  const ls = lsGet<PaginatedBills>(lsKeyBills(keyParams))?.data || null;
  const base = mem || ls;
  if (!base) return;
  const items = base.items.map((b) => (String(b.id) === String(bill.id) ? bill : b));
  const updated: PaginatedBills = { ...base, items };
  setCachedBills(keyParams, updated);
}

export async function deleteBill(id: number): Promise<void> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const res = await fetch(`${API_URL}/api/bills/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || "Delete failed");
  }
}

// Prefetch helpers (fire-and-forget)
export async function prefetchBills(params: { fy?: FinancialYear; page?: number; limit?: number } = {}): Promise<void> {
  try {
    if (getCachedBills(params)) return; // already warm
    const data = await listBills(params);
    setCachedBills(params, data);
  } catch {
    // silent
  }
}

export async function prefetchBillYears(): Promise<void> {
  try {
    if (getCachedYears()) return;
    const years = await listBillYears();
    setCachedYears(years);
  } catch {
    // silent
  }
}

// Prefetch all bills for the provided FYs by walking all pages (throttled)
export async function prefetchAllBillsForYears(
  years: FinancialYear[],
  limitPerPage = 10,
  concurrency = 3
): Promise<void> {
  const tasks: Array<() => Promise<void>> = [];

  // First collect page 1 info to discover total_pages per FY
  const firstPages = await Promise.all(
    years.map(async (fy) => {
      try {
        const first = await listBills({ fy, page: 1, limit: limitPerPage });
        return { fy, first } as const;
      } catch {
        return { fy, first: null } as const;
      }
    })
  );

  for (const fp of firstPages) {
    if (!fp.first) continue;
    const total = fp.first.total_pages || 1;
    for (let p = 2; p <= total; p++) {
      const params = { fy: fp.fy, page: p, limit: limitPerPage } as const;
      tasks.push(async () => {
        try {
          await listBills(params);
        } catch {}
      });
    }
  }

  // Run tasks with limited concurrency
  const pool = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (tasks.length) {
      const t = tasks.shift();
      if (!t) break;
      await t();
    }
  });
  await Promise.all(pool);
}

// Best-effort warm-up for Supabase PDFs: fetch a single byte to warm CDN
export async function warmSupabasePdfs(bills: BillRecord[], maxFiles = 12): Promise<void> {
  const targets = bills.filter((b) => String(b.resourceType).toLowerCase() === "supabase" && (b.originalFilename || "").toLowerCase().endsWith(".pdf")).slice(0, maxFiles);
  if (targets.length === 0) return;
  for (const b of targets) {
    try {
      const path = encodeURIComponent(b.fileUrl);
      const res = await fetch(`${API_URL}/api/get-signed-url/${path}`, { credentials: "include", cache: "no-store" });
      if (!res.ok) continue;
      // FIX: Replaced 'any' with 'unknown' and added a type guard
      const data = (await res.json()) as { url?: unknown };
      if (typeof data.url !== "string") continue;
      const url = data.url;
      // Range request for first byte in no-cors mode warms CDN without large transfer
      fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, mode: "no-cors" }).catch(() => {});
    } catch {
      /* ignore */
    }
  }
}

export async function createPublicViewPath(id: number): Promise<string> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");
  const res = await fetch(`${API_URL}/api/bills/${id}/public-token`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    // FIX: Replaced 'any' with a specific type cast
    const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || "Failed to create public token");
  }
  // FIX: Replaced 'any' with 'unknown' and added a type guard
  const data = (await res.json()) as { path?: unknown };
  if (typeof data.path !== "string") {
    throw new Error("Invalid response from token endpoint");
  }
  return data.path; // e.g. /api/bills/15/public?exp=...&sig=...
}