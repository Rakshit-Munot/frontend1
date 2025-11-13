"use client";
import React, { useMemo, useState } from "react";

interface Props {
  open: boolean;
  student: { roll: string; email: string } | null;
  request: { id: number; itemName: string; quantity: number } | null;
  onClose: () => void;
  onApprove: (opts: { returnDays?: number | null; returnDate?: string | null; remark?: string | null; markSubmitted?: boolean }) => void;
  isBusy: boolean;
}

export default function AdminApproveModal({ open, student, request, onClose, onApprove, isBusy }: Props) {
  const [preset, setPreset] = useState<"7" | "15" | "30" | "custom">("7");
  const [customDate, setCustomDate] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [markSubmitted, setMarkSubmitted] = useState<boolean>(false);
  // FIX: Removed 'banner' and 'setBanner' as they were unused
  // const [banner, setBanner] = useState<string | null>(null); 

  const summary = useMemo(() => {
    if (!request) return "";
    return `${request.itemName} × ${request.quantity}`;
  }, [request]);

  if (!open || !request) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
      <div className="dialog-surface-login w-full max-w-lg">
        <div className="px-5 py-3 border-b dialog-divider-login flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Approve Request</h3>
          {/* FIX: Removed unused 'banner' display */}
          <button onClick={onClose} className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {student && (
            <div className="text-sm text-slate-700">
              <div>Roll: <span className="font-medium">{student.roll}</span></div>
              <div>Email: <a className="text-indigo-600 hover:underline" href={`mailto:${student.email}`}>{student.email}</a></div>
            </div>
          )}

          <div className="text-sm text-slate-700">
            <div className="font-medium">{summary}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-800 mb-1">Return by</div>
            <div className="flex items-center gap-2">
              {(["7", "15", "30", "custom"] as const).map((opt) => (
                <label key={opt} className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${preset === opt ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"}`}>
                  <input type="radio" name="return_preset" className="sr-only" checked={preset === opt} onChange={() => setPreset(opt)} />
                  {opt === "custom" ? "Custom" : `${opt} days`}
                </label>
              ))}
            </div>
            {preset === "custom" && (
              <div className="mt-2">
                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="rounded-md input-login-like text-sm" />
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-slate-800 mb-1">Remark (optional)</div>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className="w-full rounded-md border dialog-divider-login px-3 py-2 text-sm" placeholder="Add a note (optional)" />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={markSubmitted} onChange={(e) => setMarkSubmitted(e.target.checked)} />
            Mark as submitted immediately
          </label>
        </div>

        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border dialog-divider-login px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button
            disabled={isBusy || (preset === "custom" && !customDate)}
            onClick={() => {
              const payload = preset === "custom"
                ? { returnDays: null, returnDate: customDate || null, remark: remark || null, markSubmitted }
                : { returnDays: Number(preset), returnDate: null, remark: remark || null, markSubmitted };
              // Fire approve and close immediately for instant UX; parent will handle actual update & WS revalidation
              onApprove(payload);
              onClose();
            }}
            className="rounded-md bg-emerald-600 text-white px-4 py-1.5 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isBusy ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}