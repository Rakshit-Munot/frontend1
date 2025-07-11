'use client'

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface UploadedFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploaded_at?: string;
  year?: string;
}
interface ApiFileResponse {
  id: number;
  filename: string;
  file?: string;
  cdn_url?: string;
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
    fetch("https://backend-4-x6ud.onrender.com/api/auth/check", {
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
    fetch("https://backend-4-x6ud.onrender.com/api/uploaded-files", {
      credentials: "include",
    })
      .then(res => res.json())
      .then((data: ApiFileResponse[]) => {
        setFiles(
          data.map((file) => ({
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



// 'use client'

// import { useEffect, useRef, useState } from 'react';
// import { Sparkles, ArrowLeft, ArrowRight, FileText, Download, Calendar, Users, Clock, Star } from 'lucide-react';

// interface UploadedFile {
//   id: number;
//   filename: string;
//   url: string;
//   size: number;
//   uploaded_at?: string;
//   year?: string;
// }

// const PAGE_SIZE = 7; // Number of files per page

// const Sidebar = () => {
//   const [files, setFiles] = useState<UploadedFile[]>([]);
//   const [page, setPage] = useState(0);
//   const [role, setRole] = useState<string | null>(null);
//   const [studentYear, setStudentYear] = useState<string | null>(null);
//   const [hoveredFile, setHoveredFile] = useState<number | null>(null);
//   const listRef = useRef<HTMLUListElement>(null);

//   // Fetch user role and uploaded files
//   useEffect(() => {
//     // Fetch user role
//     fetch("http://localhost:8000/api/auth/check", {
//       credentials: "include",
//     })
//       .then(res => res.json())
//       .then(data => {
//         setRole(data?.user?.role || null);

//         // If student, extract year from roll number
//         if (data?.user?.role === "student" && data?.user?.roll_number) {
//           const match = data.user.roll_number.match(/^(\d{2})/);
//           if (match) setStudentYear(`Y${match[1]}`);
//         }
//       });

//     // Fetch uploaded files
//     fetch("http://localhost:8000/api/uploaded-files", {
//       credentials: "include",
//     })
//       .then(res => res.json())
//       .then(data => {
//         setFiles(
//           data.map((file: any) => ({
//             id: file.id,
//             filename: file.filename,
//             url: file.cdn_url || (file.file ? `http://localhost:8000${file.file}` : ""),
//             size: file.size,
//             uploaded_at: file.uploaded_at,
//             year: file.year,
//           }))
//         );
//       });
//   }, []);

//   // Scroll to top when page changes
//   useEffect(() => {
//     if (listRef.current) {
//       listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   }, [page]);

//   // Filter files for students: show files for their year or year === "All" (case-insensitive)
//   const filteredFiles =
//     role === "student" && studentYear
//       ? files.filter(file =>
//           (file.year && file.year.toLowerCase() === "all") ||
//           (file.year && file.year.toLowerCase() === studentYear.toLowerCase())
//         )
//       : files;

//   // Pagination logic
//   const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE);
//   const paginatedFiles = filteredFiles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

//   // Helper to check if file is new (uploaded within 48 hours)
//   const isNew = (uploaded_at?: string) => {
//     if (!uploaded_at) return false;
//     const uploadedTime = new Date(uploaded_at).getTime();
//     const now = Date.now();
//     return now - uploadedTime < 48 * 60 * 60 * 1000; // 48 hours in ms
//   };

//   // Helper to format file size
//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Helper to get file extension
//   const getFileExtension = (filename: string): string => {
//     return filename.split('.').pop()?.toLowerCase() || '';
//   };

//   // Helper to get file icon based on extension
//   const getFileIcon = (filename: string) => {
//     const ext = getFileExtension(filename);
//     const iconClass = "w-4 h-4";
    
//     switch (ext) {
//       case 'pdf':
//         return <FileText className={`${iconClass} text-red-400`} />;
//       case 'doc':
//       case 'docx':
//         return <FileText className={`${iconClass} text-blue-400`} />;
//       case 'xls':
//       case 'xlsx':
//         return <FileText className={`${iconClass} text-green-400`} />;
//       case 'ppt':
//       case 'pptx':
//         return <FileText className={`${iconClass} text-orange-400`} />;
//       default:
//         return <FileText className={`${iconClass} text-gray-400`} />;
//     }
//   };

//   // Helper to format relative time
//   const formatRelativeTime = (dateString?: string): string => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
//     if (diffInHours < 1) return 'Just now';
//     if (diffInHours < 24) return `${diffInHours}h ago`;
//     if (diffInHours < 48) return 'Yesterday';
//     return date.toLocaleDateString();
//   };

//   return (
//     <aside className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-6 border-b border-white/10">
//         <div className="flex items-center space-x-3">
//           <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
//             <FileText className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <h2 className="text-lg font-bold text-white">Files Library</h2>
//             <p className="text-sm text-gray-300">
//               {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} available
//             </p>
//           </div>
//         </div>
        
//         {/* Role Badge */}
//         {role && (
//           <div className="mt-4 flex items-center space-x-2">
//             <div className="flex items-center space-x-1 px-3 py-1 bg-white/10 rounded-full text-xs">
//               <Users className="w-3 h-3" />
//               <span className="text-gray-300 capitalize">{role}</span>
//             </div>
//             {studentYear && (
//               <div className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 rounded-full text-xs">
//                 <Calendar className="w-3 h-3" />
//                 <span className="text-blue-300">{studentYear}</span>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Content */}
//       <div className="p-6">
//         {filteredFiles.length === 0 ? (
//           <div className="text-center py-12">
//             <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
//               <FileText className="w-8 h-8 text-white" />
//             </div>
//             <h3 className="text-lg font-semibold text-white mb-2">No files yet</h3>
//             <p className="text-gray-400 text-sm">Files will appear here once uploaded</p>
//           </div>
//         ) : (
//           <>
//             {/* Files List */}
//             <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar" ref={listRef}>
//               {paginatedFiles.map((file) => (
//                 <div
//                   key={file.id}
//                   className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
//                   onMouseEnter={() => setHoveredFile(file.id)}
//                   onMouseLeave={() => setHoveredFile(null)}
//                 >
//                   {/* New Badge */}
//                   {isNew(file.uploaded_at) && (
//                     <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
//                       <div className="flex items-center space-x-1">
//                         <Sparkles className="w-3 h-3" />
//                         <span>NEW</span>
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex items-start space-x-3">
//                     {/* File Icon */}
//                     <div className="flex-shrink-0 mt-1">
//                       {getFileIcon(file.filename)}
//                     </div>

//                     {/* File Info */}
//                     <div className="flex-1 min-w-0">
//                       <a
//                         href={file.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="block group-hover:text-blue-300 transition-colors duration-200"
//                       >
//                         <h4 className="font-medium text-white truncate mb-1" title={file.filename}>
//                           {file.filename}
//                         </h4>
//                       </a>
                      
//                       <div className="flex items-center space-x-3 text-xs text-gray-400">
//                         <span className="flex items-center space-x-1">
//                           <Download className="w-3 h-3" />
//                           <span>{formatFileSize(file.size)}</span>
//                         </span>
                        
//                         {file.uploaded_at && (
//                           <span className="flex items-center space-x-1">
//                             <Clock className="w-3 h-3" />
//                             <span>{formatRelativeTime(file.uploaded_at)}</span>
//                           </span>
//                         )}
//                       </div>

//                       {/* Year Badge */}
//                       {file.year && (
//                         <div className="mt-2">
//                           <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
//                             {file.year}
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Download Button */}
//                     <div className={`flex-shrink-0 transition-opacity duration-200 ${hoveredFile === file.id ? 'opacity-100' : 'opacity-0'}`}>
//                       <a
//                         href={file.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-lg"
//                         title="Download file"
//                       >
//                         <Download className="w-4 h-4 text-white" />
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
//                 <button
//                   onClick={() => setPage(p => Math.max(0, p - 1))}
//                   disabled={page === 0}
//                   className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
//                     page === 0
//                       ? 'opacity-40 cursor-not-allowed bg-white/5'
//                       : 'bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95'
//                   }`}
//                 >
//                   <ArrowLeft className="w-4 h-4" />
//                   <span className="text-sm font-medium">Prev</span>
//                 </button>

//                 {/* Page Indicators */}
//                 <div className="flex items-center space-x-2">
//                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                     let pageNum;
//                     if (totalPages <= 5) {
//                       pageNum = i;
//                     } else if (page < 3) {
//                       pageNum = i;
//                     } else if (page >= totalPages - 2) {
//                       pageNum = totalPages - 5 + i;
//                     } else {
//                       pageNum = page - 2 + i;
//                     }
                    
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => setPage(pageNum)}
//                         className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${
//                           pageNum === page
//                             ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
//                             : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white hover:scale-110'
//                         }`}
//                       >
//                         {pageNum + 1}
//                       </button>
//                     );
//                   })}
//                 </div>

//                 <button
//                   onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
//                   disabled={page >= totalPages - 1}
//                   className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
//                     page >= totalPages - 1
//                       ? 'opacity-40 cursor-not-allowed bg-white/5'
//                       : 'bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95'
//                   }`}
//                 >
//                   <span className="text-sm font-medium">Next</span>
//                   <ArrowRight className="w-4 h-4" />
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Custom Scrollbar Styles */}
//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.1);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: linear-gradient(135deg, #3b82f6, #8b5cf6);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: linear-gradient(135deg, #2563eb, #7c3aed);
//         }
//       `}</style>
//     </aside>
//   );
// };

// export default Sidebar;