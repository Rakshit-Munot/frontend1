"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";

interface Lab {
  id: number;
  name: string;
  created_at: string;
}

interface Handout {
  id: number;
  title: string | null;
  description: string | null;
  file_url: string;
  original_filename: string | null;
  uploaded_at: string;
}

export default function HandoutManager() {
  const { user } = useAuth() as any;
  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLabName, setNewLabName] = useState("");
  const [activeLab, setActiveLab] = useState<Lab | null>(null);
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loadingHandouts, setLoadingHandouts] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "https://backend-4-x6ud.onrender.com").replace(/\/$/, "");

  const loadLabs = async () => {
    setLoadingLabs(true);
    setLabError(null);
    try {
      const res = await fetch(`${apiBase}/api/labs`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load labs (${res.status})`);
      const data = await res.json();
      setLabs(data || []);
      if (!activeLab && data && data.length) setActiveLab(data[0]);
    } catch (e: any) {
      setLabError(e?.message || "Failed to load labs");
    } finally {
      setLoadingLabs(false);
    }
  };

  const loadHandouts = async (labId: number, targetPage: number = 1) => {
    setLoadingHandouts(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: "6" });
      if (search.trim()) params.append("q", search.trim());
      const res = await fetch(`${apiBase}/api/labs/${labId}/handouts?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load handouts (${res.status})`);
      const data = await res.json();
      setHandouts(data.items || []);
      setTotalPages(data.total_pages || 1);
      setPage(data.page || 1);
    } catch (e) {
      // silent
    } finally {
      setLoadingHandouts(false);
    }
  };

  useEffect(() => {
    loadLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeLab) loadHandouts(activeLab.id, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLab?.id, page]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLab) loadHandouts(activeLab.id, 1);
  };

  const onCreateLab = async () => {
    const name = newLabName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const form = new FormData();
      form.append("name", name);
      const res = await fetch(`${apiBase}/api/labs/create`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create lab");
      setNewLabName("");
      await loadLabs();
    } catch (e) {
      // could toast error
    } finally {
      setCreating(false);
    }
  };

  const onUpload = async () => {
    if (!activeLab || !uploadFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      if (uploadTitle) form.append("title", uploadTitle);
      if (uploadDesc) form.append("description", uploadDesc);
      const res = await fetch(`${apiBase}/api/labs/${activeLab.id}/handouts/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      setUploadFile(null);
      setUploadTitle("");
      setUploadDesc("");
      await loadHandouts(activeLab.id);
    } catch (e) {
      // could toast error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Lab selector and creation */}
      <div className="flex items-center gap-2">
        <select
          className="border dialog-divider-login rounded-md px-2 py-1 text-sm flex-1"
          value={activeLab?.id || ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const lab = labs.find((l) => l.id === id) || null;
            setActiveLab(lab);
          }}
        >
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          {!labs.length && <option value="">No labs yet</option>}
        </select>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input
              className="border dialog-divider-login rounded-md px-2 py-1 text-sm"
              placeholder="New lab name"
              value={newLabName}
              onChange={(e) => setNewLabName(e.target.value)}
            />
            <button
              onClick={onCreateLab}
              disabled={creating || !newLabName.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
        )}
      </div>

      {/* Upload (admin only) */}
      {isAdmin && activeLab && (
        <div className="space-y-2 p-3 rounded-lg border dialog-divider-login bg-white/60">
          <div className="grid grid-cols-1 gap-2">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="border dialog-divider-login rounded-md px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              className="border dialog-divider-login rounded-md px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={onUpload}
            disabled={uploading || !uploadFile}
            className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Handout"}
          </button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search handouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border dialog-divider-login rounded-md px-2 py-1 text-sm flex-1"
        />
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-xs font-medium"
        >
          Search
        </button>
      </form>

      {/* Handouts list styled similar to bill cards */}
      <div className="space-y-3 max-h-64 overflow-auto pr-1">
        {loadingHandouts ? (
          <p className="text-xs text-slate-500">Loading handouts...</p>
        ) : handouts.length ? (
          handouts.map((h) => (
            <div key={h.id} className="group rounded-xl border dialog-divider-login bg-white shadow-sm hover:shadow-md transition-shadow p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-black">
                  {h.title || h.original_filename || "handout"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {h.description || h.original_filename || ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.uploaded_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <a
                  href={h.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  View
                </a>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      await fetch(`${apiBase}/api/handouts/${h.id}`, { method: 'DELETE', credentials: 'include' });
                      if (activeLab) loadHandouts(activeLab.id, page);
                    }}
                    className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No handouts yet.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs px-2 py-1 rounded-md border dialog-divider-login disabled:opacity-40"
          >
            Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - page) <= 2)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`text-xs w-7 h-7 rounded-full border dialog-divider-login ${n === page ? 'bg-black text-white' : 'bg-white hover:bg-slate-100'}`}
                >
                  {n}
                </button>
              ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs px-2 py-1 rounded-md border dialog-divider-login disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
