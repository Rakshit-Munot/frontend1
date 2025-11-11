"use client";
import React, {useState } from "react"; // FIX: Removed unused 'useMemo'
import { IssueRequest } from "../types";

type Status = "pending" | "approved" | "rejected" | "all";

interface Props {
  open: boolean;
  user: { id: number; name?: string; email?: string } | null;
  requests: IssueRequest[];
  loading: boolean;
  status: Status;
  onChangeStatus: (s: Status) => void;
  onClose: () => void;
  onApprove: (req: IssueRequest) => void;
  onReject: (req: IssueRequest) => void;
  onApproveAll?: (ids: number[]) => void;
  onRejectAll?: (ids: number[]) => void;
}

export default function StudentRequestsModal({ open, user, requests, loading, status, onChangeStatus, onClose, onApprove, onReject, onApproveAll, onRejectAll }: Props) {
  // FIX: Removed unused 'busy' and 'setBusy' state
  // const [busy, setBusy] = useState(false);
  // FIX: Removed unused 'banner' and 'setBanner' state
  // const [banner, setBanner] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const tabs: Status[] = ["pending", "approved", "rejected", "all"];
  const display = status === "all" ? requests : requests.filter((r) => r.status === status);
  const totalPages = Math.ceil(display.length / 10) || 1;
  const pageLocal = Math.min(page, totalPages);
  const pageSize = 10;
  const displaySlice = display.slice((pageLocal - 1) * pageSize, pageLocal * pageSize);
  const pendingIds = display.filter((r) => r.status === "pending").map((r) => r.id);
  const selectedCount = React.useMemo(() => {
    // count only selected that are visible & pending
    const pend = new Set(pendingIds);
    let c = 0;
    selected.forEach((id) => { if (pend.has(id)) c += 1; });
    return c;
    // FIX: Fixed dependency array to use 'pendingIds' directly
  }, [selected, pendingIds]);
  const canBulkApprove = status === "pending" && pendingIds.length > 0;
  const canBulkReject = status === "pending" && pendingIds.length > 0;
  const allSelected = status === "pending" && pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
  const hasAnySelected = Array.from(selected).some((id) => pendingIds.includes(id));

  const toggleSelectAll = () => {
    if (status !== "pending") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // unselect all visible pending
        pendingIds.forEach((id) => next.delete(id));
      } else {
        // select all visible pending
        pendingIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: number) => {
    if (status !== "pending") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Clear selection when switching tabs/status or closing
  React.useEffect(() => { setSelected(new Set()); setPage(1); }, [status, open]);
  const clearSelection = () => setSelected(new Set());

  const bulkApprove = () => {
    if (!canBulkApprove) return;
    if (onApproveAll) {
      const ids = hasAnySelected ? Array.from(selected).filter((id) => pendingIds.includes(id)) : pendingIds;
      onApproveAll(ids);
    }
  };

  const bulkReject = () => {
    if (!canBulkReject) return;
    if (onRejectAll) {
      const ids = hasAnySelected ? Array.from(selected).filter((id) => pendingIds.includes(id)) : pendingIds;
      onRejectAll(ids);
    }
  };

  return (!open || !user) ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="dialog-surface-login w-full max-w-3xl">
        <div className="px-5 py-3 border-b dialog-divider-login">
          {/* FIX: Removed unused 'banner' display
          {banner && (
            <div className="mb-2 rounded-md bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5">
              {banner}
            </div>
          )}
          */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-800">Requests by {user.name || `User ${user.id}`}</div>
              {user.email && (
                <div className="text-xs"><a href={`mailto:${user.email}`} className="text-indigo-600 hover:underline">{user.email}</a></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {status === "pending" && (
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700 select-none cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300" checked={allSelected} onChange={toggleSelectAll} />
                    Select all
                  </label>
                  {selectedCount > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                        {selectedCount} selected
                      </span>
                      <button
                        className="text-xs rounded-full border dialog-divider-login px-2 py-0.5 hover:bg-slate-50 cursor-pointer"
                        onClick={clearSelection}
                        title="Clear selection"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  {/* FIX: Removed 'busy' from disabled check */}
                  <button className="rounded-md bg-emerald-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-emerald-700" disabled={!canBulkApprove || (!hasAnySelected && pendingIds.length === 0)} onClick={bulkApprove}>{hasAnySelected ? "Approve selected" : "Approve all"}</button>
                  {/* FIX: Removed 'busy' from disabled check */}
                  <button className="rounded-md bg-rose-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-rose-700" disabled={!canBulkReject || (!hasAnySelected && pendingIds.length === 0)} onClick={bulkReject}>{hasAnySelected ? "Reject selected" : "Reject all"}</button>
                </div>
              )}
              <button onClick={onClose} className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer">✕</button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4">
          <div className="flex gap-2 mb-3">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onChangeStatus(t)}
                className={`text-xs px-3 py-1.5 rounded-md border ${status === t ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"}`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading…</div>
          ) : display.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No requests</div>
          ) : (
            <div className="space-y-3">
              {displaySlice.map((req) => (
                <div key={req.id} className="rounded-lg border dialog-divider-login p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {/* FIX: Replaced 'any' with a safer type cast */}
                        {typeof req.item === "object" && (req.item as { name?: string })?.name ? (req.item as { name: string }).name : String(req.item)}
                      </div>
                      <div className="text-xs text-slate-500 truncate">Status: {req.status}</div>
                      {req.remarks && (
                        <div className="mt-1 text-xs text-slate-600 truncate" title={req.remarks}>
                          Remark: <span className="text-slate-700">{req.remarks}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      {req.status === "pending" && (
                        <label className="inline-flex items-center mt-0.5">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 cursor-pointer"
                            checked={selected.has(req.id)}
                            onChange={() => toggleOne(req.id)}
                          />
                        </label>
                      )}
                      <div className="text-xs text-slate-500">
                        Qty: <span className="font-medium text-slate-700">{req.quantity}</span>
                      </div>
                    </div>
                  </div>
                  {/* Meta info for approved requests */}
                  {req.status === "approved" && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {req.approved_at && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                          Approved: {new Date(req.approved_at).toLocaleString()}
                        </span>
                      )}
                      {req.return_by && (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                          Return by: {new Date(req.return_by).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {req.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button className="flex-1 rounded-md bg-emerald-600 text-white text-xs py-1.5 hover:bg-emerald-700 cursor-pointer" onClick={() => onApprove(req)}>Approve</button>
                      <button className="flex-1 rounded-md bg-rose-600 text-white text-xs py-1.5 hover:bg-rose-700 cursor-pointer" onClick={() => onReject(req)}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span>Page {pageLocal} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50 cursor-pointer" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageLocal === 1}>Prev</button>
                    <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50 cursor-pointer" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageLocal === totalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}