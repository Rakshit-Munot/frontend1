"use client";
import { Category, Subcategory } from "../types";

export default function AddNewModal({
  open,
  onClose,
  addTab,
  setAddTab,
  categories,
  subByCat,
  // category
  newCatName,
  setNewCatName,
  onCreateCategory,
  // subcategory
  newSubCatId,
  setNewSubCatId,
  newSubName,
  setNewSubName,
  onCreateSubcategory,
  // item
  newItemCatId,
  setNewItemCatId,
  newItemSubId,
  setNewItemSubId,
  newItemName,
  setNewItemName,
  newItemQty,
  setNewItemQty,
  newItemConsumable,
  setNewItemConsumable,
  newItemLocation,
  setNewItemLocation,
  newItemMin,
  setNewItemMin,
  newItemMax,
  setNewItemMax,
  newItemDesc,
  setNewItemDesc,
  newItemAvailable,
  setNewItemAvailable,
  onCreateItem,
  isBusy,
  error,
}: {
  open: boolean;
  onClose: () => void;
  addTab: "category" | "subcategory" | "item";
  setAddTab: (t: "category" | "subcategory" | "item") => void;
  categories: Category[];
  subByCat: Record<number, Subcategory[]>;
  // category
  newCatName: string;
  setNewCatName: (v: string) => void;
  onCreateCategory: () => void;
  // subcategory
  newSubCatId: number | null;
  setNewSubCatId: (v: number | null) => void;
  newSubName: string;
  setNewSubName: (v: string) => void;
  onCreateSubcategory: () => void;
  // item
  newItemCatId: number | null;
  setNewItemCatId: (v: number | null) => void;
  newItemSubId: number | null;
  setNewItemSubId: (v: number | null) => void;
  newItemName: string;
  setNewItemName: (v: string) => void;
  newItemQty: number;
  setNewItemQty: (v: number) => void;
  newItemConsumable: boolean;
  setNewItemConsumable: (v: boolean) => void;
  newItemLocation: string;
  setNewItemLocation: (v: string) => void;
  newItemMin: number;
  setNewItemMin: (v: number) => void;
  newItemMax: number;
  setNewItemMax: (v: number) => void;
  newItemDesc: string;
  setNewItemDesc: (v: string) => void;
  newItemAvailable: boolean;
  setNewItemAvailable: (v: boolean) => void;
  onCreateItem: () => void;
  isBusy: boolean;
  error?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="dialog-surface-login p-6 w-full max-w-2xl relative max-h-[92vh] overflow-y-auto">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
              addTab === "category" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50"
            }`}
            onClick={() => setAddTab("category")}
          >
            Category
          </button>
          <button
            className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
              addTab === "subcategory" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50"
            }`}
            onClick={() => setAddTab("subcategory")}
          >
            Subcategory
          </button>
          <button
            className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
              addTab === "item" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50"
            }`}
            onClick={() => setAddTab("item")}
          >
            Item
          </button>
        </div>

        {addTab === "category" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Category Name</div>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full rounded-lg input-login-like"
                placeholder="e.g. Electronics"
              />
            </div>
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <div className="pt-2 flex justify-end gap-2">
              <button className="rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
                Close
              </button>
              <button
                className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                onClick={onCreateCategory}
                disabled={isBusy}
              >
                {isBusy ? "Creating…" : "Create Category"}
              </button>
            </div>
          </div>
        )}

        {addTab === "subcategory" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Select Category</div>
              <select
                value={newSubCatId ?? ""}
                onChange={(e) => setNewSubCatId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
              >
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Subcategory Name</div>
              <input
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full rounded-lg input-login-like"
                placeholder="e.g. Oscilloscopes"
              />
            </div>
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <div className="pt-2 flex justify-end gap-2">
              <button className="rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
                Close
              </button>
              <button
                className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                onClick={onCreateSubcategory}
                disabled={isBusy}
              >
                {isBusy ? "Creating…" : "Create Subcategory"}
              </button>
            </div>
          </div>
        )}

        {addTab === "item" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Category</div>
                <select
                  value={newItemCatId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setNewItemCatId(v);
                    setNewItemSubId(null);
                  }}
                  className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Subcategory (optional)</div>
                <select
                  value={newItemSubId ?? ""}
                  onChange={(e) => setNewItemSubId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
                  disabled={!newItemCatId}
                >
                  <option value="">— None —</option>
                  {newItemCatId &&
                    (subByCat[newItemCatId] || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Item Name</div>
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full rounded-lg input-login-like"
                placeholder="e.g. Soldering Iron"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Quantity</div>
                <input
                  type="number"
                  min={0}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="w-full rounded-lg input-login-like"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Consumable</div>
                <select
                  value={newItemConsumable ? "yes" : "no"}
                  onChange={(e) => setNewItemConsumable(e.target.value === "yes")}
                  className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Min per issue</div>
                <input
                  type="number"
                  min={1}
                  value={newItemMin}
                  onChange={(e) => setNewItemMin(Number(e.target.value))}
                  className="w-full rounded-lg input-login-like"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Max per issue</div>
                <input
                  type="number"
                  min={newItemMin}
                  value={newItemMax}
                  onChange={(e) => setNewItemMax(Number(e.target.value))}
                  className="w-full rounded-lg input-login-like"
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Location</div>
              <input
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value)}
                className="w-full rounded-lg input-login-like"
                placeholder="e.g. Lab A, Shelf 3"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Description</div>
              <textarea
                rows={3}
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-full rounded-lg border dialog-divider-login px-3 py-2"
              />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Availability</div>
              <select
                value={newItemAvailable ? "available" : "unavailable"}
                onChange={(e) => setNewItemAvailable(e.target.value === "available")}
                className="w-full rounded-lg border dialog-divider-login px-3 py-2 bg-white text-black"
              >
                <option value="available">Available</option>
                <option value="unavailable">Not available</option>
              </select>
            </div>

            {error && <div className="text-sm text-rose-600">{error}</div>}
            <div className="pt-2 flex justify-end gap-2">
              <button className="rounded-lg border dialog-divider-login px-4 py-2 hover:bg-slate-50 cursor-pointer" onClick={onClose} disabled={isBusy}>
                Close
              </button>
              <button
                className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                onClick={onCreateItem}
                disabled={isBusy}
              >
                {isBusy ? "Creating…" : "Create Item"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
