"use client";
import { Instrument } from "../types";

export default function IssueRequestModal({
  open,
  item,
  qty,
  setQty,
  error,
  isBusy,
  onClose,
  onSubmit,
  availableForItem,
}: {
  open: boolean;
  item: Instrument | null;
  qty: string;
  setQty: (v: string) => void;
  error?: string;
  isBusy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  availableForItem: (i: Instrument) => number;
}) {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="dialog-surface-login p-6 w-full max-w-sm relative">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">Issue Request</h3>
        <div className="text-sm text-slate-700 mb-3">
          <span className="text-slate-500">Item:</span> {item.name}
        </div>
        <div className="text-sm text-slate-700 mb-3">
          <span className="text-slate-500">Available:</span> {availableForItem(item)}
        </div>
        <div className="text-sm text-slate-700 mb-3">
          <span className="text-slate-500">Min/Max:</span> {item.min_issue_limit}/{item.max_issue_limit}
        </div>
        <input
          type="number"
          min={item.min_issue_limit}
          max={item.max_issue_limit}
          value={qty}
          onChange={(e) => {
            setQty(e.target.value);
          }}
          placeholder="Enter quantity"
          className="w-full rounded-lg input-login-like mb-2"
        />
        {error && <div className="text-sm text-rose-600 mb-2">{error}</div>}
        <div className="flex gap-2">
          <button className="flex-1 rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button
            className="flex-1 rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            onClick={onSubmit}
            disabled={isBusy}
          >
            {isBusy ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
