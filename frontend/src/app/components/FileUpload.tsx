'use client';

import { useState, useRef, useEffect } from 'react';
import { CloudUpload, CheckCircle, XCircle, FileText, Trash2, Eye, X, Search, ArrowDownUp } from 'lucide-react';

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  year?: string;
  uploaded_at?: string;
}

interface UploadedFileAPI {
  id: number;
  filename: string;
  file?: string;
  cdn_url?: string;
  size: number;
  year?: string;
  uploaded_at?: string;
}

interface AuthCheckResponse {
  user?: {
    role?: 'admin' | 'faculty' | 'staff' | 'student';
    roll_number?: string;
  };
}

type UserRole = 'admin' | 'faculty' | 'staff' | 'student' | null;

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [role, setRole] = useState<UserRole>(null);
  const [year, setYear] = useState<string>('Y22');
  const [customYear, setCustomYear] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'filename' | 'year' | 'size' | 'uploaded_at'>('uploaded_at');
  const [sortAsc, setSortAsc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const yearOptions = ['All', 'Y22', 'Y23', 'Y24', 'Custom'];

  useEffect(() => {
    fetch("https://backend-4-x6ud.onrender.com/api/auth/check", { credentials: "include" })
      .then(res => res.json())
      .then((data: AuthCheckResponse) => setRole(data?.user?.role || null));

    fetch("https://backend-4-x6ud.onrender.com/api/uploaded-files", { credentials: "include" })
      .then(res => res.json())
      .then((data: UploadedFileAPI[]) => {
        setUploadedFiles(
          data.map(file => ({
            id: file.id,
            filename: file.filename,
            url: file.cdn_url || (file.file ? `https://backend-4-x6ud.onrender.com${file.file}` : ""),
            size: file.size,
            year: file.year,
            uploaded_at: file.uploaded_at,
          }))
        );
      });
  }, []);

  const simulateProgress = () => {
    setProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setProgress(prog);
      if (prog >= 90) clearInterval(interval);
    }, 80);
    return interval;
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    const selectedYear = year === 'Custom' ? customYear : year;
    formData.append('file', file);
    formData.append('year', selectedYear);

    setUploading(true);
    setMessage('');
    setSuccess(null);
    const interval = simulateProgress();

    try {
      const response = await fetch("https://backend-4-x6ud.onrender.com/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();
      clearInterval(interval);
      setProgress(100);

      if (result.success) {
        setMessage(`Uploaded: ${result.filename}`);
        setSuccess(true);
        setUploadedFiles(prev => [{
          id: result.id,
          filename: result.filename,
          url: result.url,
          size: result.size,
          year: selectedYear,
          uploaded_at: result.uploaded_at,
        }, ...prev]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: unknown) {
      clearInterval(interval);
      const error = err as Error;
      setProgress(100);
      setMessage(error.message);
      setSuccess(false);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      const response = await fetch(`https://backend-4-x6ud.onrender.com/api/uploaded-files/${fileId}/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
        setMessage("File deleted successfully.");
        setSuccess(true);
      } else {
        const result = await response.json();
        setMessage(result.detail || "Failed to delete file.");
        setSuccess(false);
      }
    } catch {
      setMessage("Failed to delete file.");
      setSuccess(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isPreviewable = (url: string) => /\.(pdf|png|jpe?g|gif|webp)$/i.test(url);

  const canUpload = role === 'admin' || role === 'faculty';
  const canDelete = canUpload;

  const filteredFiles = uploadedFiles.filter(file => {
    const matchesYear = year === 'All' || (year === 'Custom' ? customYear : year) === file.year;
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    const aVal = a[sortKey] || '';
    const bVal = b[sortKey] || '';
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex gap-3 w-full">
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="px-3 py-2 bg-slate-800 text-white rounded border border-slate-600"
            >
              {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {year === 'Custom' && (
              <input
                type="text"
                placeholder="Custom Year"
                value={customYear}
                onChange={e => setCustomYear(e.target.value)}
                className="px-3 py-2 bg-slate-800 text-white rounded border border-slate-600"
              />
            )}
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename..."
                className="px-3 py-2 w-full bg-slate-800 text-white rounded border border-slate-600 pl-10"
              />
              <Search className="absolute left-3 top-2.5 text-white w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-2 text-white px-3 py-2 border border-slate-600 rounded hover:bg-slate-700"
          >
            <ArrowDownUp className="w-4 h-4" /> Sort: {sortKey} {sortAsc ? '↑' : '↓'}
          </button>
        </div>

        <div className="space-y-3">
          {sortedFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-xl border border-white/10">
              <div className="flex gap-4 items-center">
                <FileText className="w-6 h-6 text-indigo-300" />
                <div>
                  <div className="text-white font-medium truncate max-w-xs">{file.filename}</div>
                  <div className="text-xs text-slate-400">{formatFileSize(file.size)} • {file.year} • {new Date(file.uploaded_at || '').toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-3">
                {isPreviewable(file.url) && (
                  <button onClick={() => setPreviewUrl(file.url)} title="Preview">
                    <Eye className="w-5 h-5 text-indigo-400 hover:text-indigo-200" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(file.id)}>
                    <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {previewUrl && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl w-full max-w-4xl h-[90vh] overflow-hidden">
              <button onClick={() => setPreviewUrl(null)} className="absolute top-2 right-2 text-gray-600 hover:text-black z-10">
                <X className="w-6 h-6" />
              </button>
              {previewUrl.endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-full" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
