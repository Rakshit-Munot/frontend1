"use client";
import React, { useEffect, useRef, useState } from "react";
import { listLabsCached, upsertLabCache, type Lab } from "../services/labsCache";

interface Props { isAdmin: boolean; onUploaded?: () => void; }

export const UploadHandoutForm: React.FC<Props> = ({ isAdmin, onUploaded }) => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labId, setLabId] = useState<number | "">("");
  const [newLabName, setNewLabName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLLabelElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  type UploadItem = {
    id: string;
    file: File;
    progress: number;
    status: "queued" | "uploading" | "success" | "error";
    error?: string;
  };

  const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    (async () => {
      try {
        const data = await listLabsCached();
        setLabs(data || []);
        if (!labId && data?.length) setLabId(data[0].id);
      } catch {}
    })();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-4 rounded-lg border border-yellow-600/30 bg-yellow-600/10 text-yellow-200">Only admins can upload handouts.</div>
    );
  }

  const createLab = async () => {
    const name = newLabName.trim();
    if (!name) return;
    const form = new FormData();
    form.append("name", name);
    const res = await fetch(`${API}/api/labs/create`, { method: "POST", body: form, credentials: "include" });
    if (res.ok) {
      const lab = await res.json();
      setLabs((prev) => [...prev, lab]);
      setLabId(lab.id);
      setNewLabName("");
      upsertLabCache(lab);
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
    const f = e.dataTransfer?.files;
    if (f && f.length) onFileSelect(f);
    dropRef.current?.classList.remove("ring-2", "ring-sky-500");
  };
  const onDragOver: React.DragEventHandler = (e) => { e.preventDefault(); dropRef.current?.classList.add("ring-2", "ring-sky-500"); };
  const onDragLeave: React.DragEventHandler = () => { dropRef.current?.classList.remove("ring-2", "ring-sky-500"); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!labId) return setError("Please select a lab.");
    if (!items.length) return setError("Please choose at least one file to upload.");

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
          form.append("file", item.file);
          if (title.trim()) form.append("title", title.trim());
          if (comment.trim()) form.append("comment", comment.trim());

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
                } else {
                  const detail = (data && (data.detail || data.error || data.message)) || "Upload failed";
                  item.status = "error";
                  item.error = typeof detail === "string" ? detail : JSON.stringify(detail);
                  setItems([...updated]);
                }
              } catch (e) {
                item.status = "error";
                item.error = "Upload failed";
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
          xhr.open("POST", `${API}/api/labs/${labId}/handouts/upload`);
          xhr.withCredentials = true;
          xhr.send(form);
        });
      }
      setUploading(false);
      const successCount = updated.filter((x) => x.status === "success").length;
      if (successCount === total) {
        setMessage(`Uploaded ${successCount} file${successCount > 1 ? "s" : ""} successfully.`);
        setTimeout(() => {
          setTitle("");
          setComment("");
          setItems([]);
          setOverallProgress(0);
          if (inputRef.current) inputRef.current.value = "";
          onUploaded?.();
        }, 600);
      } else if (successCount > 0) {
        setMessage(`Uploaded ${successCount}/${total}. Some files failed.`);
      } else {
        setError("All uploads failed");
      }
    } catch (err) {
      setUploading(false);
      setError("Upload failed");
      setOverallProgress(0);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm" aria-labelledby="upload-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="upload-title" className="text-lg font-medium text-white">Upload a handout</h3>
          <p className="text-sm text-gray-300/70">Select a lab, enter a name and optional comment. Supports multiple files and shows progress.</p>
        </div>
        {message && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-sm" aria-live="polite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {message}
          </div>
        )}
      </div>

      {/* Lab selection and quick add */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Select Lab</label>
          <div className="flex gap-2">
            <select value={labId} onChange={(e)=>setLabId(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white">
              {labs.map((l)=> <option key={l.id} value={l.id}>{l.name}</option>)}
              {!labs.length && <option value="">No labs yet</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Quick Add Lab</label>
          <div className="flex gap-2">
            <input value={newLabName} onChange={(e)=>setNewLabName(e.target.value)} placeholder="New lab name" className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white" />
            <button type="button" onClick={createLab} disabled={!newLabName.trim()} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">Add</button>
          </div>
        </div>
      </div>

      {/* Name + Comment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white" placeholder="e.g., Lab 2 Handout" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Comment (optional)</label>
          <input type="text" value={comment} onChange={(e)=>setComment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white" placeholder="Any note..." />
        </div>
      </div>

      {/* Dropzone */}
      <div>
        <label htmlFor="handout-file" className="block text-sm text-gray-300 mb-2">Attach Files</label>
        <label ref={dropRef} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} htmlFor="handout-file" className="group cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 p-6 hover:border-sky-400/40 hover:bg-black/10 transition-colors">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-sky-300"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="text-sm text-gray-300"><span className="font-medium text-white">Click to upload</span> or drag & drop</div>
          <p className="text-xs text-gray-400">Images, PDF, DOCX, XLSX up to ~25MB. Multiple files supported.</p>
          <input id="handout-file" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple ref={inputRef} onChange={(e)=>onFileSelect(e.target.files || null)} className="sr-only" />
        </label>
        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            {items.map((it)=> (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="truncate text-white text-sm font-medium" title={it.file.name}>{it.file.name}</div>
                  <div className="text-xs text-gray-400">{(it.file.size/(1024*1024)).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center gap-2">
                  {it.status === 'uploading' && (
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-1.5 bg-sky-500" style={{ width: `${it.progress}%` }} /></div>
                  )}
                  {it.status === 'success' && <span className="text-emerald-400 text-xs">Done</span>}
                  {it.status === 'error' && <span className="text-rose-400 text-xs" title={it.error}>Failed</span>}
                  {it.status === 'queued' && (
                    <button type="button" onClick={()=>setItems((prev)=>prev.filter((x)=>x.id!==it.id))} className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-gray-200 hover:bg-white/20">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-300"><span>Uploading {items.length} file{items.length>1? 's': ''}…</span><span>{overallProgress}%</span></div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-2 rounded-full bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500 transition-all duration-300" style={{ width: `${overallProgress}%` }}/></div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed">
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              Uploading…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {items.length > 1 ? `Upload ${items.length} files` : "Upload Handout"}
            </>
          )}
        </button>
        {error && (
          <div className="inline-flex items-center gap-2 rounded-md bg-rose-500/15 text-rose-300 px-3 py-1.5 text-sm" aria-live="assertive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-rose-300"><path d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.9A2 2 0 004.6 20h14.8a2 2 0 001.71-3.24l-7.4-12.9a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {error}
          </div>
        )}
      </div>
    </form>
  );
};
