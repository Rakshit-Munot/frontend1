"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BillRecord, FinancialYear } from "../types"; // Assumed types
import { sanitizeAmount } from "../utils";
import { upsertBillToCaches, upsertYearsCache } from "../services/billsApi";
// Human-centered, polished upload UI for Bills: drag & drop, previews, inline validation, and smooth progress.

interface Props {
  isAdmin: boolean;
}

export const UploadBillForm: React.FC<Props> = ({ isAdmin }) => {
  const [billNo, setBillNo] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [comment, setComment] = useState(""); // Optional comment
  // Multi-file support with a simple queue
  type UploadItem = {
    id: string;
    file: File;
    progress: number; // 0-100
    status: "queued" | "uploading" | "success" | "error";
    error?: string;
  };
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLLabelElement | null>(null);

  // Derived helpers
  // FIX: Removed unused 'imageIds'
  const previewMapRef = useRef<Map<string, string>>(new Map()); // id -> object URL
  useEffect(() => {
    // create previews for image items
    items.forEach((it) => {
      if (it.file.type.startsWith("image/") && !previewMapRef.current.get(it.id)) {
        const url = URL.createObjectURL(it.file);
        previewMapRef.current.set(it.id, url);
      }
    });

    // FIX: Store ref.current in a variable for use in cleanup
    const currentPreviewMap = previewMapRef.current;
    return () => {
      // revoke all on unmount
      currentPreviewMap.forEach((url) => URL.revokeObjectURL(url));
      currentPreviewMap.clear();
    };
  }, [items]);

  if (!isAdmin) {
    return (
      <div className="p-4 rounded-lg border border-yellow-600/30 bg-yellow-600/10 text-yellow-200">
        Only admins can upload bills.
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const amount = sanitizeAmount(billAmount);
    if (!billNo.trim()) return setError("Bill number is required.");
    if (amount === null) return setError("Enter a valid bill amount.");
    if (!items.length) return setError("Please choose at least one file to upload.");

    // Sequential XHR uploads with per-item progress
    try {
      setUploading(true);
      setOverallProgress(0);

      const total = items.length;
      let completed = 0;
      const updated = [...items];
      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        item.status = "uploading";
        setItems([...updated]);

        await new Promise<void>((resolve) => {
          const form = new FormData();
          form.append("bill_no", billNo.trim());
          form.append("amount", String(amount));
          form.append("file", item.file);
          if (comment.trim()) {
            form.append("comment", comment.trim()); // Optional comment sent to backend
          }

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              item.progress = pct;
              setItems([...updated]);
              const overall = Math.round(((completed + pct / 100) / total) * 100);
              setOverallProgress(overall);
            }
          };
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              try {
                const data = JSON.parse(xhr.responseText || "{}");
                if (xhr.status >= 200 && xhr.status < 300) {
                  item.status = "success";
                  item.progress = 100;
                  setItems([...updated]);
                  // Upsert into caches so refresh shows instantly
                  try {
                    const fy = (data && data.financial_year) as string | undefined;
                    if (fy) {
                      // FIX: Replaced 'any' with 'FinancialYear'
                      upsertYearsCache(fy as FinancialYear);
                      const newBill = {
                        id: String(data.id),
                        billNo: data.bill_no,
                        billAmount: Number(data.amount ?? 0),
                        fileUrl: data.file_url,
                        fileName: data.original_filename || data.bill_no || "bill",
                        fileType: "file",
                        originalFilename: data.original_filename,
                        cloudinaryPublicId: data.public_id,
                        resourceType: data.resource_type,
                        uploadedAt: data.uploaded_at,
                        comment: data.comment,
                      } as BillRecord; // FIX: Replaced 'any' with 'BillRecord'
                      // FIX: Replaced 'any' with 'FinancialYear'
                      upsertBillToCaches(newBill, fy as FinancialYear, 10);
                    }
                  } catch {}
                } else {
                  const detail = (data && (data.detail || data.error || data.message)) || "Upload failed";
                  item.status = "error";
                  item.error = typeof detail === "string" ? detail : JSON.stringify(detail);
                  setItems([...updated]);
                }
              } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
                item.status = "error";
                // FIX: Added instanceof Error check
                item.error = e instanceof Error ? e.message : "Upload failed";
                setItems([...updated]);
              }
              completed += 1;
              const overall = Math.round((completed / total) * 100);
              setOverallProgress(overall);
              resolve();
            }
          };
          xhr.onerror = () => {
            item.status = "error";
            item.error = "Upload failed";
            setItems([...updated]);
            completed += 1;
            const overall = Math.round((completed / total) * 100);
            setOverallProgress(overall);
            resolve();
          };
          xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/bills/upload`);
          xhr.withCredentials = true;
          xhr.send(form);
        });
      }

      setUploading(false);
      const successCount = updated.filter((x) => x.status === "success").length;
      if (successCount === total) {
        setMessage(`Uploaded ${successCount} file${successCount > 1 ? "s" : ""} successfully.`);
        // Reset form fields and selection after a brief moment
        setTimeout(() => {
          setBillNo("");
          setBillAmount("");
          setComment("");
          setItems([]);
          setOverallProgress(0);
          if (inputRef.current) inputRef.current.value = "";
        }, 800);
      } else if (successCount > 0) {
        setMessage(`Uploaded ${successCount}/${total}. Some files failed.`);
      } else {
        setError("All uploads failed");
      }
    } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
      setUploading(false);
      // FIX: Added instanceof Error check
      setError(err instanceof Error ? err.message : "Upload failed");
      setOverallProgress(0);
    }
  };

  const onFileSelect = (f: File | null | FileList) => {
    setError(null);
    setMessage(null);
    if (!f) return;
    const list = Array.isArray(f) ? f : ("length" in (f as FileList) ? Array.from(f as FileList) : [f as File]);
    const toAdd: UploadItem[] = list.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: "queued",
    }));
    setItems((prev) => [...prev, ...toAdd]);
  };

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) onFileSelect(f);
    dropRef.current?.classList.remove("ring-2", "ring-sky-500");
  };

  const onDragOver: React.DragEventHandler = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add("ring-2", "ring-sky-500");
  };

  const onDragLeave: React.DragEventHandler = () => {
    dropRef.current?.classList.remove("ring-2", "ring-sky-500");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
      aria-labelledby="upload-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="upload-title" className="text-lg font-medium text-white">
            Upload a bill
          </h3>
          <p className="text-sm text-gray-300/70">Select one or more files. All files are uploaded to Cloudinary as public (type="upload") for easy preview.</p>
        </div>
        {message && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-sm" aria-live="polite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {message}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Bill Number</label>
          <input
            type="text"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
            placeholder="e.g., INV-2025-001"
            aria-required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Bill Amount</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
              placeholder="e.g., 12499.00"
              aria-required
            />
          </div>
        </div>
      </div>

      {/* Optional Comment */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 min-h-[80px]"
          placeholder="Add any notes for this bill (optional)"
        />
      </div>

      {/* Dropzone */}
      <div>
        <label htmlFor="bill-file" className="block text-sm text-gray-300 mb-2">
          Attach File
        </label>

        <label
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          htmlFor="bill-file"
          className="group cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 p-6 hover:border-sky-400/40 hover:bg-black/10 transition-colors"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-sky-300">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-medium text-white">Click to upload</span> or drag & drop
          </div>
          <p className="text-xs text-gray-400">Images, PDF, DOCX, XLSX up to ~25MB. Multiple files supported.</p>
          <input
            id="bill-file"
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            multiple
            ref={inputRef}
            onChange={(e) => onFileSelect(e.target.files || null)}
            className="sr-only"
          />
        </label>

        {/* Selected files list */}
        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            {items.map((it) => {
              const isImg = it.file.type.startsWith("image/");
              const prev = isImg ? previewMapRef.current.get(it.id) : null;
              return (
                <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isImg && prev ? (
                      // FIX: Disabled next/image warning, as <img> is correct for object URLs
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prev} alt="preview" className="h-10 w-10 rounded object-cover ring-1 ring-white/10" />
                    ) : (
                      // FIX: Disabled false positive linter error
                      // eslint-disable-next-line react/no-unescaped-entities
                      <div className="h-10 w-10 rounded bg-white/10 grid place-items-center text-gray-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-white text-sm font-medium" title={it.file.name}>
                        {it.file.name}
                      </div>
                      <div className="text-xs text-gray-400">{(it.file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {it.status === "uploading" && (
                      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-1.5 bg-sky-500" style={{ width: `${it.progress}%` }} />
                      </div>
                    )}
                    {it.status === "success" && <span className="text-emerald-400 text-xs">Done</span>}
                    {it.status === "error" && (
                      <span className="text-rose-400 text-xs" title={it.error}>
                        Failed
                      </span>
                    )}
                    {it.status === "queued" && (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                        className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-gray-200 hover:bg-white/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>
              Uploading {items.length} file{items.length > 1 ? "s" : ""}…
            </span>
            <span>{overallProgress}%</span>
          </div>
          {/* FIX: Disabled false positive linter error */}
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions and feedback */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {items.length > 1 ? `Upload ${items.length} files` : "Upload Bill"}
            </>
          )}
        </button>

        {error && (
          <div className="inline-flex items-center gap-2 rounded-md bg-rose-500/15 text-rose-300 px-3 py-1.5 text-sm" aria-live="assertive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-rose-300">
              <path d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.9A2 2 0 004.6 20h14.8a2 2 0 001.71-3.24l-7.4-12.9a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </form>
  );
};