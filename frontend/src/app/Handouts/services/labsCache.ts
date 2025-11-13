export interface Lab { id: number; name: string }

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const NOW = () => Date.now();
const TTL_MS = 5 * 60 * 1000; // 5 minutes persistent TTL

function lsKey() { return "labs:persist:list"; }

function lsGet(): { at: number; data: Lab[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lsKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.at !== "number" || !Array.isArray(parsed.data)) return null;
    if (NOW() - parsed.at > TTL_MS) return null;
    return parsed as { at: number; data: Lab[] };
  } catch { return null; }
}

function lsSet(labs: Lab[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(lsKey(), JSON.stringify({ at: NOW(), data: labs })); } catch {}
}

let mem: { at: number; data: Lab[] } | null = null;

export function readCachedLabsSync(): Lab[] | null {
  if (mem && NOW() - mem.at <= TTL_MS) return mem.data;
  const ls = lsGet();
  return ls ? ls.data : null;
}

export async function listLabsCached(): Promise<Lab[]> {
  if (mem && NOW() - mem.at <= TTL_MS) return mem.data;
  const ls = lsGet();
  if (ls) return ls.data;
  const res = await fetch(`${API}/api/labs`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch labs");
  const labs = (await res.json()) as Lab[];
  mem = { at: NOW(), data: labs };
  lsSet(labs);
  return labs;
}

export function upsertLabCache(lab: Lab): void {
  const current = readCachedLabsSync() || [];
  const updated = [...current.filter((l) => l.id !== lab.id), lab].sort((a, b) => a.name.localeCompare(b.name));
  mem = { at: NOW(), data: updated };
  lsSet(updated);
}
