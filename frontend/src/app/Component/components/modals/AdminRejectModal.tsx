"use client";
import React, { useState } from "react";

interface Props {
  open: boolean;
  request: { id: number; itemName: string; quantity: number } | null;
  onClose: () => void;
  onReject: (opts: { remark: string }) => void;
  isBusy: boolean;
}

export default function AdminRejectModal({ open, request, onClose, onReject, isBusy }: Props) {
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  if (!open || !request) return null;

  const submit = () => {
    if (!remark.trim()) {
      setError("Remark is required");
      return;
    }
    onReject({ remark: remark.trim() });
    setBanner("Rejected successfully");
    setTimeout(() => setBanner(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
      <div className="dialog-surface-login w-full max-w-lg">
        <div className="px-5 py-3 border-b dialog-divider-login">
          {banner && (<div className="mb-2 rounded-md bg-rose-50 text-rose-700 text-xs px-3 py-1.5">{banner}</div>)}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Reject Request</h3>
            <button onClick={onClose} className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-sm text-slate-700">
            <div className="font-medium">{request.itemName} × {request.quantity}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800 mb-1">Remark (required)</div>
            <textarea value={remark} onChange={(e)=>{ setRemark(e.target.value); setError(""); }} rows={3} className="w-full rounded-md border dialog-divider-login px-3 py-2 text-sm" placeholder="Reason for rejection" />
            {error && <div className="mt-1 text-sm text-rose-600">{error}</div>}
          </div>
        </div>
        <div className="px-5 py-3 border-t dialog-divider-login flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border dialog-divider-login px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={() => { submit(); onClose(); }} disabled={isBusy} className="rounded-md bg-rose-600 text-white px-4 py-1.5 text-sm disabled:opacity-50 cursor-pointer">
            {isBusy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
