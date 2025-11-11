"use client";
import { Instrument } from "../types";

export default function ViewItemModal({
  open,
  item,
  onClose,
  availableForItem,
}: {
  open: boolean;
  item: Instrument | null;
  onClose: () => void;
  availableForItem: (i: Instrument) => number;
}) {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="dialog-surface-login p-6 w-full max-w-lg relative">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Item Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
          <div><span className="text-slate-500">Name:</span> {item.name}</div>
          <div><span className="text-slate-500">Quantity:</span> {item.quantity}</div>
          <div>
            <span className="text-slate-500">Consumable:</span>{" "}
            {item.is_consumable ? (
              <span className="text-emerald-600 font-medium">Yes</span>
            ) : (
              <span className="text-red-600 font-medium">No</span>
            )}
          </div>
          <div><span className="text-slate-500">Location:</span> {item.location || "-"}</div>
          <div><span className="text-slate-500">Min/Max:</span> {item.min_issue_limit}/{item.max_issue_limit}</div>
          <div><span className="text-slate-500">Available:</span> {availableForItem(item)}</div>
        </div>
        {item.description && (
          <div className="mt-4 text-sm">
            <div className="text-slate-500">Description</div>
            <div className="mt-1 p-2 rounded border dialog-divider-login bg-slate-50">{item.description || "—"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
