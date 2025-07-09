'use client'

import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploaded_at?: string;
  year?: string;
}

const PAGE_SIZE = 7; // Number of files per page

const Sidebar = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [page, setPage] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [studentYear, setStudentYear] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch user role and uploaded files
  useEffect(() => {
    // Fetch user role
    fetch("http://localhost:8000/api/auth/check", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setRole(data?.user?.role || null);

        // If student, extract year from roll number
        if (data?.user?.role === "student" && data?.user?.roll_number) {
          const match = data.user.roll_number.match(/^(\d{2})/);
          if (match) setStudentYear(`Y${match[1]}`);
        }
      });

    // Fetch uploaded files
    fetch("http://localhost:8000/api/uploaded-files", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setFiles(
          data.map((file: any) => ({
            id: file.id,
            filename: file.filename,
            url: file.cdn_url || (file.file ? `http://localhost:8000${file.file}` : ""),
            size: file.size,
            uploaded_at: file.uploaded_at,
            year: file.year,
          }))
        );
      });
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  // Filter files for students: show files for their year or year === "All" (case-insensitive)
  const filteredFiles =
  role === "student" && studentYear
    ? files.filter(file =>
        (file.year && file.year.toLowerCase() === "all") ||
        (file.year && file.year.toLowerCase() === studentYear.toLowerCase())
      )
    : files;

  // Pagination logic
  const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE);
  const paginatedFiles = filteredFiles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Helper to check if file is new (uploaded within 48 hours)
  const isNew = (uploaded_at?: string) => {
    if (!uploaded_at) return false;
    const uploadedTime = new Date(uploaded_at).getTime();
    const now = Date.now();
    return now - uploadedTime < 48 * 60 * 60 * 1000; // 48 hours in ms
  };

  return (
    <aside className="w-72 bg-slate-900 text-white h-full p-4 flex flex-col gap-6 rounded-xl">
      <h2 className="text-xl font-bold mb-2">Uploaded Files</h2>
      {filteredFiles.length === 0 ? (
        <div className="text-slate-400 text-sm">No files uploaded.</div>
      ) : (
        <>
          <ul
            className="space-y-2 overflow-y-auto max-h-[60vh] pr-2"
            ref={listRef}
          >
            {paginatedFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2"
              >
                {isNew(file.uploaded_at) && (
                  <span
                    title="New"
                    className="flex items-center gap-1 text-xs text-yellow-400 font-semibold animate-bounce"
                  >
                    New
                  </span>
                )}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-indigo-300 hover:underline flex-1"
                  title={file.filename}
                >
                  {file.filename}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`p-1 rounded ${page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              aria-label="Previous"
            >
              <ArrowLeft className="w-5 h-5 cursor-pointer" />
            </button>
            <span className="text-xs text-slate-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`p-1 rounded ${page >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              aria-label="Next"
            >
              <ArrowRight className="w-5 h-5 cursor-pointer" />
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;