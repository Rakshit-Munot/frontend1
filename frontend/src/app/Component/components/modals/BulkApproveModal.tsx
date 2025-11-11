"use client";
import React, { useState } from "react";

interface Props {
  open: boolean;
  count: number;
  onClose: () => void;
  onApprove: (opts: { returnDays?: number | null; returnDate?: string | null; remark?: string | null }) => void;
  isBusy: boolean;
}

export default function BulkApproveModal({ open, count, onClose, onApprove, isBusy }: Props) {
  const [preset, setPreset] = useState<"7" | "15" | "30" | "custom">("7");
  const [customDate, setCustomDate] = useState("");
  const [remark, setRemark] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
        <div className="dialog-surface-login w-full max-w-lg">
          <div className="px-5 py-3 border-b dialog-divider-login flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Approve {count} Requests</h3>
            <button onClick={onClose} className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-800 mb-1">Return by</div>
            <div className="flex items-center gap-2">
              {(["7","15","30","custom"] as const).map((opt) => (
                <label key={opt} className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${preset === opt ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"}`}>
                  <input type="radio" name="bulk_return_preset" className="sr-only" checked={preset===opt} onChange={() => setPreset(opt)} />
                  {opt === "custom" ? "Custom" : `${opt} days`}
                </label>
              ))}
            </div>
            {preset === "custom" && (
                <div className="mt-2">
                  <input type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} className="rounded-md input-login-like text-sm" />
                </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800 mb-1">Remark (optional)</div>
              <textarea value={remark} onChange={(e)=>setRemark(e.target.value)} rows={3} className="w-full rounded-md border dialog-divider-login px-3 py-2 text-sm" placeholder="Add a note (optional)" />
          </div>
        </div>
          <div className="px-5 py-3 border-t dialog-divider-login flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-md border dialog-divider-login px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button
            disabled={isBusy || (preset === "custom" && !customDate)}
            onClick={() => {
              const payload = preset === "custom"
                ? { returnDays: null, returnDate: customDate || null, remark: remark || null }
                : { returnDays: Number(preset), returnDate: null, remark: remark || null };
              onApprove(payload);
              onClose();
            }}
            className="rounded-md bg-emerald-600 text-white px-4 py-1.5 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isBusy ? "Approving…" : "Approve Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
