"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { UploadHandoutForm } from "./UploadHandoutForm";
import { useAuth } from "../../AuthContext";
import { listHandouts, readCachedHandoutsSync, listHandoutYears, prefetchHandouts } from "../services/handoutsApi";
import { listLabsCached, type Lab } from "../services/labsCache";

export default function HandoutManagerPage() {
  const { user } = useAuth() as any;
  const isAdmin = (user?.role || "guest") === "admin";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  type Handout = {
    id: number;
    title?: string | null;
    description?: string | null;
    comment?: string | null;
    file_url: string;
    original_filename?: string | null;
    uploaded_at: string;
  };

  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const LIMIT = 10;
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<number | "all">("all");
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | "all">("all");
  const wsRef = useRef<WebSocket | null>(null);

  const rangePages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
  const cached = readCachedHandoutsSync({ page, limit: LIMIT, q: search.trim() || undefined, labId: selectedLab, year: year === "all" ? undefined : year });
      if (cached) {
        setHandouts(cached.items as any);
        setTotalPages(cached.total_pages || 1);
      }
  const data = await listHandouts({ page, limit: LIMIT, q: search.trim() || undefined, labId: selectedLab, year: year === "all" ? undefined : year });
      setHandouts(data.items as any);
      setTotalPages(data.total_pages || 1);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, selectedLab, year]);

  useEffect(() => {
  // Prefetch labs (cached) and years list for filters
    (async () => {
      try {
        const [labsList, yrs] = await Promise.all([
          listLabsCached().catch(() => []),
          listHandoutYears().catch(() => []),
        ]);
        setLabs(labsList || []);
        setYears(yrs || []);
      } catch {}
    })();
  }, []);

  // WebSocket for live handout updates (parity with Bills)
  useEffect(() => {
    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}` : undefined);
    if (!WS_BASE) return;
    const url = `${WS_BASE.replace(/\/$/, '')}/ws/handouts/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = async (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (!data?.event) return;
        if (data.event === 'created') {
          // Only inject if either All Labs is selected or it matches selectedLab
          const uploadedAt = typeof data.uploaded_at === 'string' ? new Date(data.uploaded_at) : new Date();
          const yr = uploadedAt.getFullYear();
          const yearOk = year === 'all' || year === yr;
          if ((selectedLab === 'all' || Number(data.lab_id) === selectedLab) && yearOk) {
            const newItem: Handout = {
              id: Number(data.id),
              title: data.title,
              description: null,
              comment: data.comment ?? null,
              file_url: data.file_url,
              original_filename: data.original_filename,
              uploaded_at: data.uploaded_at,
            };
            if (page === 1) setHandouts((prev) => [newItem, ...prev].slice(0, LIMIT));
          }
        } else if (data.event === 'updated') {
          setHandouts((prev) => prev.map((h) => (h.id === Number(data.id) ? { ...h, title: data.title ?? h.title, comment: data.comment ?? h.comment, file_url: data.file_url ?? h.file_url, original_filename: data.original_filename ?? h.original_filename, uploaded_at: data.uploaded_at ?? h.uploaded_at } : h)));
        } else if (data.event === 'deleted') {
          setHandouts((prev) => prev.filter((h) => h.id !== Number(data.id)));
          // Refresh current page to keep counts/pages correct
          load();
        }
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLab, page]);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  return (
    <div className="rounded-xl border-2 border-[#A31F34] bg-[#FFFDF7] p-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search handouts..."
              className="input-login-like px-3 py-2 w-56 text-sm"
            />
            <button className="px-3 py-2 rounded-md bg-black/5 hover:bg-black/10 text-gray-800 text-sm border border-black/10" type="submit">Search</button>
          </form>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Lab</label>
            <select
              value={selectedLab}
              onChange={(e)=> setSelectedLab(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="px-2 py-2 rounded-md bg-black/5 border border-black/10 text-gray-800 text-sm cursor-pointer"
            >
              <option value="all">All Labs</option>
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Year</label>
            <select
              value={year}
              onChange={(e)=> setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="px-2 py-2 rounded-md bg-black/5 border border-black/10 text-gray-800 text-sm cursor-pointer"
            >
              <option value="all">All</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const q = new URLSearchParams();
              if (search.trim()) q.set("q", search.trim());
              if (selectedLab !== "all") q.set("lab_id", String(selectedLab));
              if (year !== "all") q.set("year", String(year));
              window.open(`${API_URL}/api/handouts-export?${q.toString()}`, "_blank", "noopener,noreferrer");
            }}
            className="px-3 py-2 rounded-md bg-black/5 hover:bg-black/10 text-gray-800 text-sm border border-black/10"
            title="Download Excel (server-generated)"
          >
            Excel Export
          </button>
          {isAdmin && (
            <button onClick={() => setShowUpload(true)} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              Upload Handout
            </button>
          )}
        </div>
      </div>

      {/* Centered Prev/Next controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-4">
            <button
              aria-label="Previous page"
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-gray-700 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {/* Left chevron */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              aria-label="Next page"
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-gray-700 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              onMouseEnter={() => {
                const next = Math.min(totalPages, page + 1);
                if (next !== page) {
                  prefetchHandouts({ page: next, limit: LIMIT, q: search.trim() || undefined, labId: selectedLab, year: year === 'all' ? undefined : year }).catch(() => {});
                }
              }}
              disabled={page === totalPages}
            >
              {/* Right chevron */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-gray-400 py-10 text-center">Loading handouts…</div>
      ) : error ? (
        <div className="text-red-500 py-10 text-center">{error}</div>
      ) : handouts.length === 0 ? (
        <div className="text-gray-400 py-10 text-center">No handouts match your query.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
            <colgroup>
              <col className="w-60" />
              <col className="w-40" />
              <col className="w-72" />
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="text-left text-gray-800 bg-[#FFF9F2]">
                <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Name</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Upload Date</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Comment</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {handouts.map((h) => (
                <tr key={h.id} className="border-t border-black/10 hover:bg-black/5 cursor-pointer group" onClick={()=>{ if (editingId === h.id) return; window.open(`${API_URL}/api/handouts/${h.id}/view`, "_blank", "noopener,noreferrer"); }}>
                  <td className="p-3 text-gray-900 font-medium">
                    <span className="block group-hover:underline align-middle" style={{display:"-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 220}}>
                      {h.title || h.original_filename || "handout"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(h.uploaded_at).toLocaleString()}</td>
                  <td className="p-3 text-gray-700">
                    {editingId === h.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
                          placeholder="Add a comment"
                        />
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const old = h.comment || "";
                              const newVal = editingText;
                              setHandouts((prev) => prev.map((x) => (x.id === h.id ? { ...x, comment: newVal } : x)));
                              setEditingId(null);
                              setEditingText("");
                              try {
                                await fetch(`${API_URL}/api/handouts/${h.id}/comment`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ comment: newVal }),
                                });
                              } catch {
                                setHandouts((prev) => prev.map((x) => (x.id === h.id ? { ...x, comment: old } : x)));
                              }
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-white/10 text-gray-200 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                              setEditingText("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs leading-snug text-gray-700 block" title={h.comment || "—"} style={{display:"-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 270}}>
                          {h.comment || "—"}
                        </span>
                        {isAdmin && (
                          <button
                            className="text-gray-500 hover:text-gray-800"
                            onClick={(e) => { e.stopPropagation(); setEditingId(h.id); setEditingText(h.comment || ""); }}
                            aria-label="Edit comment"
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`${API_URL}/api/handouts/${h.id}/download`} onClick={(e)=>e.stopPropagation()} className="px-3 py-1 rounded bg-black/5 hover:bg-black/10 text-xs text-teal-700">Download</a>
                      {isAdmin && (
                        <button
                          onClick={async (e)=>{ e.stopPropagation(); if(!confirm('Delete this handout?')) return; await fetch(`${API_URL}/api/handouts/${h.id}`, { method:'DELETE', credentials:'include' }); load(); }}
                          className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom pagination: -2/+2 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-1">
            {rangePages.map((pno) => (
              <button key={pno} onClick={() => setPage(pno)} aria-current={pno === page ? "page" : undefined} className={"px-2.5 py-1.5 rounded text-sm " + (pno === page ? "bg-[#A31F34] text-white" : "bg-black/5 hover:bg-black/10 text-gray-800")}>
                {pno}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpload(false)} aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 bg-[#0b0b0f] text-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 pt-5">
                <h3 className="text-base font-semibold">Upload Handout</h3>
                <button className="text-gray-400 hover:text-white" onClick={() => setShowUpload(false)} aria-label="Close">✕</button>
              </div>
              <div className="p-6 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                <UploadHandoutForm isAdmin={isAdmin} onUploaded={()=>{ setShowUpload(false); setPage(1); load(); }} />
                <div className="mt-4 flex justify-end">
                  <button className="px-3 py-2 rounded-md bg-white/10 text-gray-200 hover:bg-white/20" onClick={() => setShowUpload(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
