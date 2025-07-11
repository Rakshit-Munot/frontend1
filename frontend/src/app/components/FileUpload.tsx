'use client';

import { useState, useRef, useEffect } from 'react';
import { CloudUpload, CheckCircle, XCircle, FileText, Trash2, Eye } from 'lucide-react';

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  year?: string;
}

interface UploadedFileAPI {
  id: number;
  filename: string;
  file?: string;
  cdn_url?: string;
  url?: string;
  size: number;
  year?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [year, setYear] = useState<string>('Y22');
  const [customYear, setCustomYear] = useState<string>('');
  const yearOptions = ['All', 'Y22', 'Y23', 'Y24', 'Custom'];

  useEffect(() => {
    fetch("https://backend-4-x6ud.onrender.com/api/auth/check", {
      credentials: "include",
    })
      .then(res => res.json())
      .then((data: AuthCheckResponse) => {
        setRole(data?.user?.role || null);
      });

    fetch("https://backend-4-x6ud.onrender.com/api/uploaded-files", {
      credentials: "include",
    })
      .then(res => res.json())
      .then((data: UploadedFileAPI[]) => {
        setUploadedFiles(
          data.map(file => ({
            id: file.id,
            filename: file.filename,
            url: file.url || file.cdn_url || (file.file ? `https://backend-4-x6ud.onrender.com${file.file}` : ""),
            size: file.size,
            year: file.year,
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
    setProgress(0);
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
        setUploadedFiles(prev => [
          {
            id: result.id,
            filename: result.filename,
            url: result.url || result.cdn_url,
            size: result.size,
            year: selectedYear,
          },
          ...prev,
        ]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: unknown) {
      clearInterval(interval);
      const error = err as Error;
      setProgress(100);
      setMessage(error.message || 'Upload failed');
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const canUpload = role === 'admin' || role === 'faculty';
  const canDelete = canUpload;

  const filesToShow =
    role === "student"
      ? year === "All"
        ? uploadedFiles
        : uploadedFiles.filter((file) =>
            file.year === "All" || file.year === (year === "Custom" ? customYear : year)
          )
      : uploadedFiles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 flex flex-col items-center justify-start p-6">
      {canUpload && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center border border-white/20 mt-10">
          <div className="mb-6 flex flex-col items-center">
            <CloudUpload className="w-14 h-14 text-indigo-400 mb-2 drop-shadow-lg" />
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Upload File</h1>
            <p className="text-slate-300 text-center text-sm">
              Upload your files securely and quickly.<br />
              Supported: images, docs, and more.
            </p>
          </div>

          <div className="w-full flex flex-col items-center mb-4">
            <label className="text-white mb-2 font-medium">Select Year:</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full rounded px-3 py-2 bg-slate-800 text-white border border-slate-600 focus:outline-none"
            >
              {yearOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {year === 'Custom' && (
              <input
                type="text"
                placeholder="Enter custom year (e.g. Y25)"
                value={customYear}
                onChange={e => setCustomYear(e.target.value)}
                className="w-full mt-2 rounded px-3 py-2 bg-slate-800 text-white border border-slate-600 focus:outline-none"
              />
            )}
          </div>

          <label
            htmlFor="file-upload"
            className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
              ${uploading ? 'border-indigo-400 bg-indigo-100/30' : 'border-slate-400 hover:border-indigo-400 hover:bg-indigo-100/10'}
              py-8 mb-6`}
          >
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={onFileChange}
              disabled={uploading}
            />
            <span className="text-lg text-indigo-300 font-medium mb-2">
              Click or drag file to upload
            </span>
          </label>

          {uploading && (
            <div className="w-full max-w-xs mb-2 bg-slate-200 h-2 rounded overflow-hidden">
              <div
                className="bg-indigo-500 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium
              ${success === true ? 'bg-green-100 text-green-700' : ''}
              ${success === false ? 'bg-red-100 text-red-700' : ''}
              ${success === null ? 'bg-slate-100 text-slate-700' : ''}`}
            >
              {success === true && <CheckCircle className="w-5 h-5 text-green-500" />}
              {success === false && <XCircle className="w-5 h-5 text-red-500" />}
              {message}
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl mt-12">
        <h2 className="text-xl font-semibold text-white mb-4">Uploaded Files</h2>
        {filesToShow.length === 0 ? (
          <div className="text-slate-400 text-center py-8 bg-white/10 rounded-xl">
            No files uploaded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {filesToShow.map((file, idx) => (
              <div
                key={file.url + idx}
                className="flex items-center gap-4 bg-white/10 hover:bg-indigo-100/20 transition rounded-xl px-4 py-3 border border-white/10"
              >
                <FileText className="w-7 h-7 text-indigo-300" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{file.filename}</div>
                  <div className="text-xs text-slate-400">{formatFileSize(file.size)}</div>
                  {file.year && (
                    <div className="text-xs text-indigo-300">Year: {file.year}</div>
                  )}
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 text-xs font-mono underline flex items-center gap-1"
                  title="View"
                >
                  <Eye className="w-5 h-5" />
                  View
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
