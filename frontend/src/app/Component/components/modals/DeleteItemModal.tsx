"use client";
import { Instrument } from "../types";

export default function DeleteItemModal({
  open,
  item,
  isBusy,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  item: Instrument | null;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="dialog-surface-login p-6 w-full max-w-sm relative">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 className="text-lg font-semibold text-rose-600 mb-2">Delete Item</h3>
        <p className="text-sm text-slate-700">
          Delete <span className="font-medium">{item.name}</span>? This action cannot be undone.
        </p>
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-5 flex gap-2">
          <button className="flex-1 rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button
            className="flex-1 rounded-lg bg-rose-600 text-white px-4 py-2 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
