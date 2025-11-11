"use client";
import React, { useEffect, useRef, useState } from "react";
import type { BillRecord, FinancialYear } from "../types";
import { getFinancialYear } from "../utils";
import {
  listBills,
  listBillYears,
  deleteBill,
  prefetchBills,
  prefetchBillYears,
  readCachedBillsSync,
  readCachedYearsSync,
  upsertBillToCaches,
  upsertYearsCache,
  updateBillComment,
  replaceBillInCaches,
  removeBillFromCaches,
} from "../services/billsApi";
import { UploadBillForm } from "./UploadBillForm";
import { useAuth } from "../../AuthContext";
import { ChevronLeft, ChevronRight, ChevronDown, Pencil, Trash2, Download } from "lucide-react";

// File-manager style Bills UI replacing the previous card grid.
// Assumptions:
// - Backend does not currently provide file size or owner; we show placeholders.
// - "Last Changes" uses uploadedAt timestamp (no separate updated timestamp available).
// - Share link generated on demand via createPublicViewPath.

export const BillManager: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || "guest") === "admin";
  const [selectedFY, setSelectedFY] = useState<FinancialYear>(() => getFinancialYear(new Date()));
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;
  const wsRef = useRef<WebSocket | null>(null);
  const billsRef = useRef<BillRecord[]>([]);
  const yearsRef = useRef<FinancialYear[]>([]);
  const pageRef = useRef<number>(1);
  const selectedFYRef = useRef<FinancialYear>(selectedFY);
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL as string | undefined;
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [search, setSearch] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [showFYDropdown, setShowFYDropdown] = useState(false);

  // Local CSV export removed per request; using server-side Excel export only.

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cachedYears = readCachedYearsSync();
        if (cachedYears && mounted) setYears(cachedYears);
        const cachedPage = readCachedBillsSync({ fy: selectedFY, page, limit: LIMIT });
        if (cachedPage && mounted) {
          setBills(cachedPage.items);
          setTotalPages(cachedPage.total_pages || 1);
          setLoading(false);
        } else {
          setLoading(true);
        }
        await prefetchBillYears();
        const yearsData = await listBillYears().catch(() => [] as FinancialYear[]);
        if (mounted) setYears(yearsData.length ? yearsData : [selectedFY]);
        const data = await listBills({ fy: selectedFY, page, limit: LIMIT });
        if (!mounted) return;
        setBills(data.items);
        setTotalPages(data.total_pages || 1);
        if (data.page < (data.total_pages || 1)) {
          prefetchBills({ fy: selectedFY, page: data.page + 1, limit: LIMIT });
        }
      } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
        // FIX: Added instanceof Error check
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load bills");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedFY, page]);

  useEffect(() => {
    billsRef.current = bills;
  }, [bills]);
  useEffect(() => {
    yearsRef.current = years;
  }, [years]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    selectedFYRef.current = selectedFY;
  }, [selectedFY]);

  // FIX: Removed unused 'pageButtons' variable
  
  // Range pages for bottom display: current page with -2 to +2 window
  const rangePages = React.useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  useEffect(() => {
    const base = WS_URL || (typeof window !== "undefined" ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}` : undefined);
    if (!base) return;
    const url = `${base.replace(/\/$/, "")}/ws/bills/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = async (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (!data?.event) return;
        if (data.event === "created") {
          const fy: FinancialYear | undefined = data.financial_year as FinancialYear | undefined;
          if (fy && !yearsRef.current.includes(fy)) {
            setYears((prev) => [fy, ...prev]);
            upsertYearsCache(fy);
          }
          if (fy === selectedFYRef.current && pageRef.current === 1) {
            const newBill = {
              id: String(data.id),
              billNo: data.bill_no,
              billAmount: Number(data.amount ?? 0),
              fileUrl: data.file_url,
              fileName: data.original_filename || data.bill_no || "bill",
              fileType: "file",
              originalFilename: data.original_filename,
              cloudinaryPublicId: data.public_id,
              resourceType: data.resource_type,
              uploadedAt: data.uploaded_at,
              comment: data.comment,
            } as BillRecord;
            setBills((prev) => [newBill, ...prev].slice(0, LIMIT));
            upsertBillToCaches(newBill, fy!, LIMIT);
          }
        } else if (data.event === "updated") {
          const id = String(data.id);
          setBills((prev) =>
            prev.map((b) =>
              b.id === id
                ? {
                    ...b,
                    billNo: data.bill_no ?? b.billNo,
                    billAmount: Number(data.amount ?? b.billAmount),
                    fileUrl: data.file_url ?? b.fileUrl,
                    originalFilename: data.original_filename ?? b.originalFilename,
                    cloudinaryPublicId: data.public_id ?? b.cloudinaryPublicId,
                    resourceType: data.resource_type ?? b.resourceType,
                    uploadedAt: data.uploaded_at ?? b.uploadedAt,
                    comment: data.comment ?? b.comment,
                  }
                : b
            )
          );
          if (data.financial_year) {
            // FIX: Cast 'data.financial_year' to FinancialYear (it's checked)
            const fy = data.financial_year as FinancialYear;
            replaceBillInCaches(
              {
                id: String(data.id),
                billNo: data.bill_no,
                billAmount: Number(data.amount ?? 0),
                fileUrl: data.file_url,
                fileName: data.original_filename || data.bill_no || "bill",
                fileType: "file",
                originalFilename: data.original_filename,
                cloudinaryPublicId: data.public_id,
                resourceType: data.resource_type,
                uploadedAt: data.uploaded_at,
                comment: data.comment,
              } as BillRecord, // FIX: Cast inner object to BillRecord
              fy,
              LIMIT
            );
          }
        } else if (data.event === "deleted") {
          const exists = billsRef.current.some((b) => String(b.id) === String(data.id));
          if (exists) {
            setLoading(true);
            try {
              const resp = await listBills({ fy: selectedFYRef.current, page: pageRef.current, limit: LIMIT });
              setBills(resp.items);
              setTotalPages(resp.total_pages || 1);
            } finally {
              setLoading(false);
            }
          }
          const yrs = await listBillYears().catch(() => yearsRef.current);
          setYears(yrs.length ? yrs : [selectedFYRef.current]);
        }
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [WS_URL]);

  // Derived filtering
  const filteredBills = bills.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [b.billNo, b.fileName, b.originalFilename, b.comment].some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <div className="rounded-xl border-2 border-[#A31F34] bg-[#FFFDF7] p-4">
      {/* Main panel */}
      <div className="w-full">
        {/* Toolbar */}
        <div className="flex gap-3 items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">FY {selectedFY}</span>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowFYDropdown((v) => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/30 text-white border border-white/10 text-xs hover:bg-black/40"
                aria-haspopup="true"
                aria-expanded={showFYDropdown}
              >
                <ChevronDown className={"w-3 h-3 transition-transform " + (showFYDropdown ? "rotate-180" : "rotate-0")} />
              </button>
              {showFYDropdown && (
                <div className="absolute left-0 z-20 mt-1 w-36 rounded-md border border-white/10 bg-[#121216] shadow-lg">
                  <ul className="py-1 max-h-60 overflow-y-auto text-xs">
                    {years.map((fy) => (
                      <li key={fy}>
                        <button
                          onClick={() => {
                            setSelectedFY(fy);
                            setPage(1);
                            setShowFYDropdown(false);
                          }}
                          className={"w-full text-left px-3 py-1.5 hover:bg-white/10 " + (fy === selectedFY ? "text-white" : "text-gray-300")}
                        >
                          {fy}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search bills..."
              className="input-login-like px-3 py-2 w-56 text-sm"
            />
            {/* Removed local CSV export per request; only server Excel remains */}
            {API_URL && (
              <button
                onClick={() => {
                  const q = new URLSearchParams();
                  if (selectedFY) q.set("fy", selectedFY);
                  if (search.trim()) q.set("q", search.trim());
                  // Server-side streaming export (use dot-free, top-level alias to avoid 405s on some setups)
                  window.open(`${API_URL}/api/bills-export?${q.toString()}`, "_blank", "noopener,noreferrer");
                }}
                className="px-3 py-2 rounded-md bg-black/5 hover:bg-black/10 text-gray-800 text-sm border border-black/10"
                title="Download Excel generated by server (better for large datasets)"
              >
                Excel Export
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                Upload Bill
              </button>
            )}
          </div>
        </div>

        {/* Centered Prev/Next controls (icons only) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex items-center gap-4">
              <button
                aria-label="Previous page"
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-gray-700 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Next page"
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-gray-700 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                onMouseEnter={() => {
                  if (page < totalPages) prefetchBills({ fy: selectedFY, page: page + 1, limit: LIMIT });
                }}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-gray-400 py-10 text-center">Loading bills…</div>
        ) : error ? (
          <div className="text-red-500 py-10 text-center">{error}</div>
        ) : filteredBills.length === 0 ? (
          <div className="text-gray-400 py-10 text-center">No bills match your query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-fixed">
              <colgroup>
                <col className="w-60" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-56" />
                <col className="w-72" />
                <col className="w-52" />
              </colgroup>
              <thead>
                <tr className="text-left text-gray-800 bg-[#FFF9F2]">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Name</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Bill No</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Amount</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Upload Date</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Comment</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-[#A31F34]/30">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-black/10 hover:bg-black/5 cursor-pointer group"
                    onClick={(e) => {
                      // Prevent opening view while editing this row's comment
                      if (editingId === b.id) return;
                      window.open(`${API_URL}/api/bills/${b.id}/view`, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <td className="p-3 text-gray-900 font-medium">
                      <span
                        title={b.originalFilename || b.fileName}
                        className="block group-hover:underline align-middle"
                        // FIX: Replaced 'as any' with 'React.CSSProperties'
                        style={
                          {
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            maxWidth: 220,
                          } as React.CSSProperties
                        }
                      >
                        {b.originalFilename || b.fileName}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700 font-mono whitespace-nowrap">{b.billNo}</td>
                    <td className="p-3 text-gray-800 whitespace-nowrap">{(b.billAmount ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(b.uploadedAt).toLocaleString()}</td>
                    <td className="p-3 text-gray-700">
                      {editingId === b.id ? (
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
                              onClick={(e) => {
                                e.stopPropagation();
                                const old = b.comment || "";
                                const newVal = editingText;
                                setBills((prev) => prev.map((x) => (x.id === b.id ? { ...x, comment: newVal } : x)));
                                setEditingId(null);
                                setEditingText("");
                                updateBillComment(Number(b.id), newVal)
                                  .then((updated) => replaceBillInCaches(updated, selectedFY, LIMIT))
                                  .catch(() => {
                                    setBills((prev) => prev.map((x) => (x.id === b.id ? { ...x, comment: old } : x)));
                                    replaceBillInCaches({ ...b, comment: old }, selectedFY, LIMIT);
                                  });
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
                          <span
                            className="text-xs leading-snug text-gray-700 block"
                            title={b.comment || "—"}
                            // FIX: Replaced 'as any' with 'React.CSSProperties'
                            style={
                              {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                maxWidth: 270,
                              } as React.CSSProperties
                            }
                          >
                            {b.comment || "—"}
                          </span>
                          {isAdmin && (
                            <button
                              className="text-gray-500 hover:text-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(b.id);
                                setEditingText(b.comment || "");
                              }}
                              aria-label="Edit comment"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">
                      <div className="flex items-center gap-2 flex-wrap">
                        {["image", "video"].includes(String(b.resourceType || "").toLowerCase()) && (
                          <div className="inline-flex flex-col items-center ml-4" style={{ marginLeft: "1rem" }}>
                            <a
                              href={`${API_URL}/api/bills/${b.id}/download`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 rounded bg-black/5 hover:bg-black/10 text-xs text-teal-700 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                            {isAdmin && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Delete this bill? This will also remove the Cloudinary asset if possible.")) return;
                                  const billId = Number(b.id);
                                  setBills((prev) => prev.filter((x) => x.id !== b.id));
                                  removeBillFromCaches(b.id);
                                  try {
                                    await deleteBill(billId);
                                    const yrs = await listBillYears().catch(() => years);
                                    setYears(yrs.length ? yrs : [selectedFY]);
                                  } catch (err: unknown) { // FIX: 'any' to 'unknown'
                                    // FIX: Added instanceof Error check
                                    alert(err instanceof Error ? err.message : "Failed to delete bill");
                                    if (API_URL) {
                                      const q = new URLSearchParams({ fy: selectedFY, page: String(page), limit: String(LIMIT) });
                                      const res = await fetch(`${API_URL}/api/bills?${q.toString()}`, { credentials: "include", cache: "no-store" });
                                      if (res.ok) {
                                        const data = await res.json();
                                        // FIX: Added type for 'item'
                                        const mapped = (data.items || []).map((item: {
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
                                        }));
                                        setBills(mapped);
                                      }
                                    }
                                  }
                                }}
                                className="mt-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                        {/* Overflow menu removed as requested */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom pagination: show current page with -2 to +2 range */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1">
              {rangePages.map((pno) => (
                <button
                  key={pno}
                  onClick={() => setPage(pno)}
                  aria-current={pno === page ? "page" : undefined}
                  className={
                    "px-2.5 py-1.5 rounded text-sm " +
                    (pno === page ? "bg-[#A31F34] text-white" : "bg-black/5 hover:bg-black/10 text-gray-800")
                  }
                >
                  {pno}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpload(false)} aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 bg-[#0b0b0f] text-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 pt-5">
                <h3 className="text-base font-semibold">Upload Bill</h3>
                <button className="text-gray-400 hover:text-white" onClick={() => setShowUpload(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                <UploadBillForm isAdmin={isAdmin} />
                <div className="mt-4 flex justify-end">
                  <button className="px-3 py-2 rounded-md bg-white/10 text-gray-200 hover:bg-white/20" onClick={() => setShowUpload(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};