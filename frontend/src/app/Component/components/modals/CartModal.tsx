"use client";

import React from "react";
import { Instrument } from "../types";

export interface CartLine {
  item: Instrument;
  qty: number;
}

interface Props {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onUpdateQty: (itemId: number, qty: number) => void;
  onRemove: (itemId: number) => void;
  onSubmit: () => void;
  isBusy: boolean;
  error?: string;
}

export default function CartModal({ open, lines, onClose, onUpdateQty, onRemove, onSubmit, isBusy, error }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="dialog-surface-login w-full max-w-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b dialog-divider-login">
          <h3 className="text-lg font-semibold text-slate-800">Your Cart</h3>
          <button onClick={onClose} className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer">✕</button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="mb-3 text-xs rounded-md bg-slate-50 text-slate-600 px-3 py-2">
            These quantities will be reserved only after you click <span className="font-medium text-slate-800">Issue</span>.
          </div>
          {lines.length === 0 ? (
            <div className="text-slate-500 text-center py-10">No items added yet.</div>
          ) : (
            <div className="space-y-3">
              {lines.map(({ item, qty }) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border dialog-divider-login p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Min/Max per issue: {item.min_issue_limit}/{item.max_issue_limit}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                        Will reserve: <span className="font-semibold">{qty}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 rounded-md input-login-like px-2 py-1 text-sm"
                      min={item.min_issue_limit}
                      max={item.max_issue_limit}
                      value={qty}
                      onChange={(e) => onUpdateQty(item.id, Math.max(item.min_issue_limit, Math.min(item.max_issue_limit, Number(e.target.value) || item.min_issue_limit)))}
                    />
                    <button onClick={() => onRemove(item.id)} className="rounded-md border dialog-divider-login px-2 py-1 text-sm hover:bg-slate-50 cursor-pointer">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t dialog-divider-login flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border dialog-divider-login px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">Close</button>
          <button onClick={onSubmit} disabled={isBusy || lines.length === 0} className="rounded-md bg-indigo-600 text-white px-4 py-1.5 text-sm disabled:opacity-50 cursor-pointer">
            {isBusy ? "Submitting…" : "Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}
