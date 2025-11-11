"use client";
import { Instrument } from "../types";

export default function EditItemModal({
  open,
  item,
  editData,
  setEditData,
  isBusy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  item: Instrument | null;
  editData: Partial<Instrument>;
  setEditData: (d: Partial<Instrument>) => void;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="dialog-surface-login p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700" onClick={onClose} aria-label="Close">
          ×
        </button>
  <h3 className="text-lg font-semibold text-indigo-600 mb-4">Edit Item</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Name</div>
            <input
              className="w-full rounded-lg input-login-like"
              value={editData.name ?? item.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Quantity</div>
              <input
                type="number"
                className="w-full rounded-lg input-login-like"
                value={Number(editData.quantity ?? item.quantity)}
                onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Consumable</div>
              <select
                className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
                value={(editData.is_consumable ?? item.is_consumable) ? "yes" : "no"}
                onChange={(e) => setEditData({ ...editData, is_consumable: e.target.value === "yes" })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Location</div>
            <input
              className="w-full rounded-lg input-login-like"
              value={editData.location ?? item.location ?? ""}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Availability</div>
            <select
              className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
              value={(editData.is_available ?? item.is_available ?? true) ? "available" : "unavailable"}
              onChange={(e) => setEditData({ ...editData, is_available: e.target.value === "available" })}
            >
              <option value="available">Available</option>
              <option value="unavailable">Not available</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Min per issue</div>
              <input
                type="number"
                className="w-full rounded-lg input-login-like"
                value={Number(editData.min_issue_limit ?? item.min_issue_limit)}
                onChange={(e) => setEditData({ ...editData, min_issue_limit: Number(e.target.value) })}
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Max per issue</div>
              <input
                type="number"
                className="w-full rounded-lg input-login-like"
                value={Number(editData.max_issue_limit ?? item.max_issue_limit)}
                onChange={(e) => setEditData({ ...editData, max_issue_limit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Description</div>
            <textarea
              className="w-full rounded-lg border dialog-divider-login px-3 py-2"
              rows={3}
              value={editData.description ?? item.description ?? ""}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-5 flex gap-2">
          <button className="flex-1 rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button
            className="flex-1 rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            onClick={onSave}
            disabled={isBusy}
          >
            {isBusy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
