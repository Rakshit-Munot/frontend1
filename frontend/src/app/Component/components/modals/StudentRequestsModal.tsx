"use client";
import React, {useState } from "react"; // FIX: Removed unused 'useMemo'
import { IssueRequest } from "../types";

type Status = "pending" | "approved" | "rejected" | "submitted" | "all";

interface Props {
  open: boolean;
  user: { id: number; name?: string; email?: string } | null;
  requests: IssueRequest[];
  loading: boolean;
  status: Status;
  unreadIds?: Set<number>;
  lastMsgAt?: Record<number, string>;
  onChangeStatus: (s: Status) => void;
  onClose: () => void;
  onApprove: (req: IssueRequest) => void;
  onReject: (req: IssueRequest) => void;
  onApproveAll?: (ids: number[]) => void;
  onRejectAll?: (ids: number[]) => void;
  onMarkSubmitted?: (ids: number[]) => void;
  onOpenThread?: (reqId: number) => void;
}

export default function StudentRequestsModal({ open, user, requests, loading, status, unreadIds, lastMsgAt, onChangeStatus, onClose, onApprove, onReject, onApproveAll, onRejectAll, onMarkSubmitted, onOpenThread }: Props) {
  // FIX: Removed unused 'busy' and 'setBusy' state
  // const [busy, setBusy] = useState(false);
  // FIX: Removed unused 'banner' and 'setBanner' state
  // const [banner, setBanner] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const tabs: Status[] = ["pending", "approved", "submitted", "rejected", "all"]; 
  let display = status === "all"
    ? requests
    : status === "submitted"
      ? requests.filter((r) => r.status === "approved" && (r.submission_status === "submitted" || r.submission_status === "not_required"))
      : status === "approved"
        ? requests.filter((r) => r.status === "approved" && !(r.submission_status === "submitted" || r.submission_status === "not_required"))
        : requests.filter((r) => r.status === status);
  // Optional sorting for approved tab
  const [sortApproved, setSortApproved] = useState<"newest" | "oldest" | "unread">("newest");
  if (status === "approved") {
    display = [...display].sort((a, b) => {
      if (sortApproved === "unread") {
        const au = unreadIds?.has(a.id) ? 1 : 0;
        const bu = unreadIds?.has(b.id) ? 1 : 0;
        if (bu !== au) return bu - au; // unread first
        const la = lastMsgAt?.[a.id] || a.approved_at || a.created_at || "";
        const lb = lastMsgAt?.[b.id] || b.approved_at || b.created_at || "";
        return (lb || "").localeCompare(la || "");
      }
      const ta = a.approved_at || a.created_at || "";
      const tb = b.approved_at || b.created_at || "";
      return sortApproved === "newest" ? (tb || "").localeCompare(ta || "") : (ta || "").localeCompare(tb || "");
    });
  }
  const totalPages = Math.ceil(display.length / 10) || 1;
  const pageLocal = Math.min(page, totalPages);
  const pageSize = 10;
  const displaySlice = display.slice((pageLocal - 1) * pageSize, pageLocal * pageSize);
  const pendingIds = display.filter((r) => r.status === "pending").map((r) => r.id);
  const approvedIds = display.filter((r) => r.status === "approved").map((r) => r.id);
  const selectedCount = React.useMemo(() => {
    const ids = status === "pending" ? pendingIds : status === "approved" ? approvedIds : [];
    const set = new Set(ids);
    let c = 0;
    selected.forEach((id) => { if (set.has(id)) c += 1; });
    return c;
  }, [selected, pendingIds, approvedIds, status]);
  const canBulkApprove = status === "pending" && pendingIds.length > 0;
  const canBulkReject = status === "pending" && pendingIds.length > 0;
  const canBulkApprovedActions = status === "approved" && approvedIds.length > 0;
  const allSelected = (status === "pending" && pendingIds.length > 0 && pendingIds.every((id) => selected.has(id))) || (status === "approved" && approvedIds.length > 0 && approvedIds.every((id) => selected.has(id)));
  const hasAnySelected = Array.from(selected).some((id) => (status === "pending" ? pendingIds : approvedIds).includes(id));

  const toggleSelectAll = () => {
    if (!(status === "pending" || status === "approved")) return;
    const ids = status === "pending" ? pendingIds : approvedIds;
    setSelected((prev) => {
      const next = new Set(prev);
      if ((status === "pending" && pendingIds.every((id) => next.has(id))) || (status === "approved" && approvedIds.every((id) => next.has(id)))) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: number) => {
    if (!(status === "pending" || status === "approved")) return;
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

  // Approved tab actions: mark consumed (submit) or message
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgNotify, setMsgNotify] = useState(true);
  const [busyApproved, setBusyApproved] = useState(false);

  const markConsumedSubmit = async () => {
    if (!canBulkApprovedActions) return;
    const optimisticIds = Array.from(selected).filter((id) => approvedIds.includes(id));
    if (optimisticIds.length === 0) {
      alert("Please select at least one request to submit.");
      return;
    }
    // Optimistic: mark selected as submitted immediately
    if (onMarkSubmitted) {
      try { onMarkSubmitted(optimisticIds); } catch {}
    }
    setBusyApproved(true);
    try {
      for (const id of optimisticIds) {
        // Best-effort; ignore per-item failures
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instruments/issue-requests/${id}/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          // Do not override remark; let backend add IST timestamped default
          body: JSON.stringify({ notify_email: true }),
        }).catch(() => {});
      }
      // No local list mutation here; the WS refresh will update state
    } finally {
      setBusyApproved(false);
      setSelected(new Set());
    }
  };

  // Messages thread state per request
  const [msgThreadOpenFor, setMsgThreadOpenFor] = useState<number | null>(null);
  const [msgThreadLoading, setMsgThreadLoading] = useState(false);
  const [msgThread, setMsgThread] = useState<Array<{ id: number; text: string; created_at: string; sender?: string }>>([]);
  const openThread = async (reqId: number) => {
    setMsgThreadOpenFor(reqId);
    setMsgThreadLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instruments/issue-requests/${reqId}/messages`, { credentials: "include" });
      const d = await r.json();
      setMsgThread(Array.isArray(d) ? d : []);
    } catch {
      setMsgThread([]);
    } finally {
      setMsgThreadLoading(false);
    }
  };
  const closeThread = () => { setMsgThreadOpenFor(null); setMsgThread([]); };

  // Live-append messages via WS event dispatched from page-level socket
  React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        const reqId = detail?.issue_request_id as number | undefined;
        if (!reqId || reqId !== msgThreadOpenFor) return;
        const text = (detail?.text as string) || "";
        const id = (detail?.id as number) || Math.floor(Math.random() * 1e9);
        const created_at = (detail?.created_at as string) || new Date().toISOString();
        const sender = detail?.msg_type === 'system' ? 'System' : (detail?.sender || 'Admin');
        setMsgThread((arr) => [...arr, { id, text, created_at, sender }]);
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('issue-request-message', handler as EventListener);
      return () => window.removeEventListener('issue-request-message', handler as EventListener);
    }
  }, [msgThreadOpenFor]);

  const openMessageModal = () => {
    if (!canBulkApprovedActions) return;
    setMsgText("");
    setMsgNotify(true);
    setMsgOpen(true);
  };

  const sendMessages = async () => {
    setBusyApproved(true);
    try {
      const ids = hasAnySelected ? Array.from(selected).filter((id) => approvedIds.includes(id)) : approvedIds;
      for (const id of ids) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instruments/issue-requests/${id}/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msgText || "Please return the instrument.", notify_email: msgNotify }),
        }).catch(() => {});
      }
    } finally {
      setBusyApproved(false);
      setMsgOpen(false);
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
              {(status === "pending" || status === "approved") && (
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
                  {status === "pending" && (
                    <>
                      <button className="rounded-md bg-emerald-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-emerald-700" disabled={!canBulkApprove || (!hasAnySelected && pendingIds.length === 0)} onClick={bulkApprove}>{hasAnySelected ? "Approve selected" : "Approve all"}</button>
                      <button className="rounded-md bg-rose-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-rose-700" disabled={!canBulkReject || (!hasAnySelected && pendingIds.length === 0)} onClick={bulkReject}>{hasAnySelected ? "Reject selected" : "Reject all"}</button>
                    </>
                  )}
                  {status === "approved" && (
                    <>
                      <button className="rounded-md bg-emerald-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-emerald-700" disabled={!canBulkApprovedActions || busyApproved || !hasAnySelected} onClick={markConsumedSubmit} title="Mark selected as submitted">Mark Submitted</button>
                      <button className="rounded-md bg-slate-800 text-white text-xs px-3 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-slate-700" disabled={!canBulkApprovedActions || busyApproved} onClick={openMessageModal} title="Not submitted → send message">Not Submitted → Message</button>
                    </>
                  )}
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
          {status === "approved" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Sort:</span>
              <select className="rounded border px-2 py-1 bg-white" value={sortApproved} onChange={(e) => setSortApproved(e.target.value as any)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="unread">Unread first</option>
              </select>
            </div>
          )}
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
                      {(req.status === "pending" || req.status === "approved") && (
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
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded-md border dialog-divider-login px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer relative" onClick={() => { if (onOpenThread) onOpenThread(req.id); openThread(req.id); }}>
                      Messages
                      {unreadIds?.has(req.id) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  </div>
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
      {/* Messages thread modal (separate overlay) */}
      {msgThreadOpenFor != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="dialog-surface-login w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-slate-800">Messages</div>
              <button className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer" onClick={closeThread}>✕</button>
            </div>
            {msgThreadLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading…</div>
            ) : msgThread.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">No messages</div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {msgThread.map((m) => (
                  <div key={m.id} className="rounded-md border dialog-divider-login p-2">
                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>{m.sender || "System"}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Message modal for approved actions */}
      {msgOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="dialog-surface-login w-full max-w-lg p-5">
            <div className="text-lg font-semibold text-slate-800 mb-2">Send message to student</div>
            <textarea className="w-full rounded-md border dialog-divider-login p-2 min-h-[120px]" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Write a message..." />
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={msgNotify} onChange={(e) => setMsgNotify(e.target.checked)} />
              Notify via email
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-md border dialog-divider-login px-3 py-1.5 hover:bg-slate-50" onClick={() => setMsgOpen(false)}>Cancel</button>
              <button className="rounded-md bg-indigo-600 text-white px-3 py-1.5 disabled:opacity-50" disabled={busyApproved} onClick={sendMessages}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}