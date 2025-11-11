"use client";
import React, { useEffect, useRef, useState } from "react"; // FIX: Removed unused 'useMemo'
import type { BillRecord, FinancialYear } from "../types";
import { getFinancialYear } from "../utils";
// FIX: Removed unused 'PaginatedBills'
import { listBills, listBillYears, deleteBill, prefetchBills, prefetchBillYears, readCachedBillsSync, readCachedYearsSync, upsertBillToCaches, upsertYearsCache, updateBillComment, replaceBillInCaches } from "../services/billsApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UploadBillForm } from "./UploadBillForm";
import { useAuth } from "../../AuthContext";

export const BillList: React.FC = () => {
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
  // Background save: no spinner/state required

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Hydrate immediately from persistent cache to avoid flicker
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

        // 2) Warm years cache and fetch fresh
        await prefetchBillYears();
        const yearsData = await listBillYears().catch(() => [] as FinancialYear[]);
        if (mounted) setYears(yearsData.length ? yearsData : [selectedFY]);
        // 3) Fetch fresh page (SWR revalidate)
        const data = await listBills({ fy: selectedFY, page, limit: LIMIT });
        if (!mounted) return;
        setBills(data.items);
        setTotalPages(data.total_pages || 1);
        // Prefetch next page to make navigation instant
        if (data.page < (data.total_pages || 1)) {
          prefetchBills({ fy: selectedFY, page: data.page + 1, limit: LIMIT });
        }
      } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
        // FIX: Added instanceof Error check
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load bills');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [selectedFY, page]);

  // Keep refs in sync to avoid re-creating WS on every state change
  useEffect(() => { billsRef.current = bills; }, [bills]);
  useEffect(() => { yearsRef.current = years; }, [years]);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { selectedFYRef.current = selectedFY; }, [selectedFY]);

  // Live updates via WebSocket
  useEffect(() => {
    // Determine WS base: prefer env, else derive from window.location
    const base = WS_URL || (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}` : undefined);
    if (!base) return;
    const url = `${base.replace(/\/$/, '')}/ws/bills/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = async (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // Expecting: { event, id, bill_no, amount, file_url, uploaded_at, financial_year, ... }
        if (!data?.event) return;
        if (data.event === 'created') {
          // Optimistically add to the current list without a full refetch
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
              fileName: data.original_filename || data.bill_no || 'bill',
              fileType: 'file',
              originalFilename: data.original_filename,
              cloudinaryPublicId: data.public_id,
              resourceType: data.resource_type,
              uploadedAt: data.uploaded_at,
              comment: data.comment,
            } as BillRecord;
            setBills((prev) => [newBill, ...prev].slice(0, LIMIT));
            // Persist to caches so refresh shows it immediately
            upsertBillToCaches(newBill, fy, LIMIT);
          }
        } else if (data.event === 'updated') {
          const id = String(data.id);
          setBills((prev) => prev.map((b) => b.id === id ? { ...b,
            billNo: data.bill_no ?? b.billNo,
            billAmount: Number(data.amount ?? b.billAmount),
            fileUrl: data.file_url ?? b.fileUrl,
            originalFilename: data.original_filename ?? b.originalFilename,
            cloudinaryPublicId: data.public_id ?? b.cloudinaryPublicId,
            resourceType: data.resource_type ?? b.resourceType,
            uploadedAt: data.uploaded_at ?? b.uploadedAt,
            comment: data.comment ?? b.comment,
          } : b));
          if (data.financial_year) {
            replaceBillInCaches({
              id: String(data.id),
              billNo: data.bill_no,
              billAmount: Number(data.amount ?? 0),
              fileUrl: data.file_url,
              fileName: data.original_filename || data.bill_no || 'bill',
              fileType: 'file',
              originalFilename: data.original_filename,
              cloudinaryPublicId: data.public_id,
              resourceType: data.resource_type,
              uploadedAt: data.uploaded_at,
              comment: data.comment,
            } as BillRecord, data.financial_year as FinancialYear, LIMIT); // FIX: Replaced 'any'
          }
        } else if (data.event === 'deleted') {
          // If current page contains deleted bill, refetch current page
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
          setYears(yrs.length ? yrs : [selectedFY]); // FIX: 'selectedFY' was used here
        }
      } catch { /* ignore */ }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [WS_URL, selectedFY]); // FIX: Added 'selectedFY' to dependency array

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-white font-semibold">Bills by Financial Year</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value as FinancialYear)}
            className="px-3 py-2 rounded-md bg-black/30 text-white border border-white/10"
          >
            {years.length === 0 && (
              <option value={selectedFY}>{selectedFY}</option>
            )}
            {years.map((fy) => (
              <option key={fy} value={fy}>
                {fy}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setShowUpload(true)}
            >
              Upload Bill
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading bills…</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : bills.length === 0 ? (
        <div className="text-gray-400">No bills found for {selectedFY}.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((b) => (
              <div key={b.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="text-gray-300 text-sm">Uploaded: {new Date(b.uploadedAt).toLocaleString()}</div>
                <div className="mt-2 text-white font-medium">Bill No: {b.billNo}</div>
                <div className="text-gray-300">Amount: {(b.billAmount ?? 0).toFixed(2)}</div>
                {b.originalFilename && (
                  <div className="text-gray-400 text-xs mt-1">File: {b.originalFilename}</div>
                )}
                {/* Comment editable inline for admins */}
                {editingId === b.id ? (
                  <div className="mt-2">
                    <textarea
                      className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-white text-sm"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Add a comment"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                        onClick={() => {
                          const old = b.comment || "";
                          const newVal = editingText;
                          // Optimistic update and close editor immediately
                          setBills((prev) => prev.map((x) => x.id === b.id ? { ...x, comment: newVal } : x));
                          setEditingId(null);
                          setEditingText("");
                          // Background save; on failure, silently revert
                          updateBillComment(Number(b.id), newVal)
                            .then((updated) => {
                              replaceBillInCaches(updated, selectedFY, LIMIT);
                            })
                            .catch(() => {
                              setBills((prev) => prev.map((x) => x.id === b.id ? { ...x, comment: old } : x));
                              replaceBillInCaches({ ...b, comment: old }, selectedFY, LIMIT);
                            });
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-white/10 text-gray-200 text-xs"
                        onClick={() => { setEditingId(null); setEditingText(""); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="text-gray-300 text-sm whitespace-pre-wrap flex-1">
                      Comment: {b.comment || '—'}
                    </div>
                    {isAdmin && (
                      <button
                        className="px-2 py-1 rounded bg-white/10 text-gray-200 text-xs hover:bg-white/20"
                        onClick={() => { setEditingId(b.id); setEditingText(b.comment || ''); }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/bills/${b.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline text-sm"
                  >
                    View {b.originalFilename || 'file'}
                  </a>
                  {['image','video'].includes(String(b.resourceType || '').toLowerCase()) && (
                    <>
                      <span className="text-gray-600">|</span>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/bills/${b.id}/download`}
                        className="text-indigo-400 hover:underline text-sm"
                      >
                        Download
                      </a>
                    </>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-3">
                    <button
                      className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                      onClick={async () => {
                        if (!confirm("Delete this bill? This will also remove the Cloudinary asset if possible.")) return;

                        // Optimistic update: remove from UI immediately
                        const billId = Number(b.id);
                        setBills((prev) => prev.filter((bill) => bill.id !== b.id));

                        try {
                          await deleteBill(billId);
                          // Refresh years in case this was the last bill in a FY
                          const yrs = await listBillYears().catch(() => years);
                          setYears(yrs.length ? yrs : [selectedFY]);
                        } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
                          // On error, refetch to restore correct state
                          // FIX: Added instanceof Error check
                          alert(e instanceof Error ? e.message : "Failed to delete bill");
                          const data = await listBills({ fy: selectedFY, page, limit: LIMIT });
                          setBills(data.items);
                          setTotalPages(data.total_pages || 1);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-400">{page} of {totalPages}</span>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                onMouseEnter={() => {
                  if (page < totalPages) prefetchBills({ fy: selectedFY, page: page + 1, limit: LIMIT });
                }}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
      {/* Modal for Upload */}
      {showUpload && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowUpload(false)}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b0b0f] text-white shadow-2xl">
              <div className="flex items-center justify-between px-6 pt-5">
                <h3 className="text-base font-semibold">Upload Bill</h3>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowUpload(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <UploadBillForm isAdmin={isAdmin} />
                <div className="mt-4 flex justify-end">
                  <button
                    className="px-3 py-2 rounded-md bg-white/10 text-gray-200 hover:bg-white/20"
                    onClick={() => setShowUpload(false)}
                  >
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