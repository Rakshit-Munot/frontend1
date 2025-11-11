// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { Package, ChevronLeft, ChevronRight } from "lucide-react";
// import { useAuth } from "../AuthContext";
// import type { UserRole, Instrument } from "./types/dashboard";

// // Components
// import { DashboardHeader } from "./components/DashboardHeader";
// import { CategorySection } from "./components/CategorySection";
// import { AdminRequests } from "./components/AdminRequests";
// import { ViewInstrumentModal } from "./components/modals/ViewInstrumentModal";
// import { ModifyInstrumentModal } from "./components/modals/ModifyInstrumentModal";
// import { DeleteInstrumentModal } from "./components/modals/DeleteInstrumentModal";
// import { IssueRequestModal } from "./components/modals/IssueRequestModal";

// // Hooks
// import { useDashboardData } from "./hooks/useDashboardData";
// import { useSearch } from "./hooks/useSearch";
// import { useInstrumentActions } from "./hooks/useInstrumentActions";
// import { PAGE_SIZE } from "./constants/dashboard";
// import { prefetchInstruments, prefetchSubcategories, listSubcategories } from "./services/instrumentsApi";

// export default function DashboardPage() {
//   const { user, loader } = useAuth();
//   const role = (user?.role as UserRole) || "guest";

//   // Data hooks
//   const {
//     categories,
//     subcategories,
//     loading,
//     error,
//     requests,
//     requestsLoading,
//     subcategoryInstruments,
//     fetchInstruments,
//     updateInstrument,
//     removeInstrument,
//     removeRequest,
//   } = useDashboardData(user?.role);

//   // Search hooks
//   const {
//     categorySearch,
//     setCategorySearch,
//     subcategorySearches,
//     updateSubcategorySearch,
//     requestSearch,
//     setRequestSearch,
//     page,
//     setPage,
//     categoriesWithSubcategories,
//     getFilteredSubcategories,
//     filteredRequests,
//     paginatedRequests,
//     totalPages,
//     clearCategorySearch,
//     clearSubcategorySearch,
//   } = useSearch(categories, subcategories, requests);

//   // Instrument actions hook
//   const {
//     isIssuing,
//     issueError,
//     successMessage,
//     handleModifySubmit,
//     handleDeleteSubmit,
//     handleIssueSubmit,
//     clearMessages,
//     setSuccessMessage,
//   } = useInstrumentActions(updateInstrument, removeInstrument);

//   // Local state (per-category)
//   const [expandedCategories, setExpandedCategories] = useState<
//     Record<number, boolean>
//   >({});
//   const [subcategorySearchesLocal, setSubcategorySearchesLocal] = useState<
//     Record<number, string>
//   >({});
//   const [selectedSubcategories, setSelectedSubcategories] = useState<
//     Record<number, number | null>
//   >({});
//   const [subcatPages, setSubcatPages] = useState<Record<number, number>>({});
//   const [catPage, setCatPage] = useState(1);

//   const [instrumentsLoading, setInstrumentsLoading] = useState(false);
//   const [hideInstruments, setHideInstruments] = useState<
//     Record<number, boolean>
//   >({});
//   // Modal states
//   const [showViewPopup, setShowViewPopup] = useState(false);
//   const [showModifyPopup, setShowModifyPopup] = useState(false);
//   const [showDeletePopup, setShowDeletePopup] = useState(false);
//   const [showIssuePopup, setShowIssuePopup] = useState(false);
//   const [selectedInstrument, setSelectedInstrument] =
//     useState<Instrument | null>(null);

//   // Effects
//   useEffect(() => {
//     Object.values(selectedSubcategories).forEach((subcatId) => {
//       if (subcatId && !subcategoryInstruments[subcatId]) {
//         setInstrumentsLoading(true);
//         fetchInstruments(subcatId).finally(() => setInstrumentsLoading(false));
//       }
//     });
//   }, [selectedSubcategories, subcategoryInstruments, fetchInstruments]);

//   useEffect(() => {
//     if (successMessage) {
//       const timer = setTimeout(() => {
//         setSuccessMessage("");
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [successMessage, setSuccessMessage]);

//   // Reset category pagination on category search change
//   useEffect(() => {
//     setCatPage(1);
//   }, [categorySearch]);

//   // ✅ Keyboard accessibility for modals
//   useEffect(() => {
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setShowViewPopup(false);
//         setShowModifyPopup(false);
//         setShowDeletePopup(false);
//         setShowIssuePopup(false);
//         clearMessages();
//       }
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [clearMessages]);

//   // Handlers
//   const handleView = useCallback((item: Instrument) => {
//     setSelectedInstrument(item);
//     setShowViewPopup(true);
//   }, []);

//   const handleModify = useCallback((item: Instrument) => {
//     setSelectedInstrument(item);
//     setShowModifyPopup(true);
//   }, []);

//   const handleDelete = useCallback((item: Instrument) => {
//     setSelectedInstrument(item);
//     setShowDeletePopup(true);
//   }, []);

//   const handleIssue = useCallback((item: Instrument) => {
//     setSelectedInstrument(item);
//     setShowIssuePopup(true);
//   }, []);

//   const onModifySubmit = async (modifyData: Partial<Instrument>) => {
//     if (!selectedInstrument) return false;
//     return await handleModifySubmit(selectedInstrument, modifyData);
//   };

//   const onDeleteSubmit = async () => {
//     if (!selectedInstrument) return false;
//     return await handleDeleteSubmit(selectedInstrument);
//   };

//   const onIssueSubmit = async (quantity: string) => {
//     if (!selectedInstrument) return false;
//     return await handleIssueSubmit(selectedInstrument, quantity, role);
//   };

//   // Per-category handlers for independent state
//   const handleToggleCategory = useCallback((categoryId: number) => {
//     setExpandedCategories((prev) => ({
//       ...prev,
//       [categoryId]: !prev[categoryId],
//     }));
//   }, []);

//   const handleSubcategorySearch = useCallback(
//     (categoryId: number, value: string) => {
//       setSubcategorySearchesLocal((prev) => ({
//         ...prev,
//         [categoryId]: value,
//       }));
//     },
//     []
//   );

//   const handleSelectSubcategory = useCallback(
//     (categoryId: number, subcategoryId: number) => {
//       setSelectedSubcategories((prev) => ({
//         ...prev,
//         [categoryId]: subcategoryId, // only update this category
//       }));
//     },
//     []
//   );

//   const handleSubcategoryPageChange = useCallback(
//     (categoryId: number, newPage: number) => {
//       setSubcatPages((prev) => ({ ...prev, [categoryId]: newPage }));
//     },
//     []
//   );

//   const handleToggleHideInstruments = useCallback((subcategoryId: number) => {
//     setHideInstruments((prev) => ({
//       ...prev,
//       [subcategoryId]: !prev[subcategoryId],
//     }));
//   }, []);

//   const handleClearSubcategorySearch = useCallback((categoryId: number) => {
//     setSubcategorySearchesLocal((prev) => ({
//       ...prev,
//       [categoryId]: "",
//     }));
//   }, []);

//   // ✅ Loader for auth
//   if (loader) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
//       <DashboardHeader user={user} role={role} />

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Success Message */}
//         {successMessage && (
//           <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl backdrop-blur-sm animate-fade-in">
//             <div className="flex items-center gap-2">
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               {successMessage}
//             </div>
//           </div>
//         )}

//         {/* Enhanced Search Bar */}
//         <div className="mb-8">
//           <div className="relative max-w-md mx-auto">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <svg
//                 className="h-5 w-5 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//             </div>
//             <input
//               type="text"
//               placeholder="Search categories..."
//               value={categorySearch}
//               onChange={(e) => setCategorySearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
//             />
//           </div>
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <div className="relative">
//               <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
//               <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin animate-reverse"></div>
//             </div>
//           </div>
//         ) : error ? (
//           <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm">
//             <div className="flex items-center gap-2">
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//               {error}
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {/* Categories as cards with pagination */}
//               {(() => {
//                 const totalCatPages = Math.ceil(
//                   categoriesWithSubcategories.length / PAGE_SIZE
//                 );
//                 const paginatedCategories = categoriesWithSubcategories.slice(
//                   (catPage - 1) * PAGE_SIZE,
//                   catPage * PAGE_SIZE
//                 );
//                 // Clamp current page if data shrinks
//                 if (totalCatPages > 0 && catPage > totalCatPages) {
//                   setCatPage(totalCatPages);
//                 }
//                 return paginatedCategories;
//               })().map((category) => (
//               <div key={category.id}>
//                 <CategorySection
//                   key={category.id}
//                   category={category}
//                   expandedCategories={expandedCategories}
//                   subcategorySearches={subcategorySearchesLocal}
//                   selectedSubcategory={
//                     selectedSubcategories[category.id] || null
//                   }
//                   onSelectSubcategory={(subcategoryId) =>
//                     handleSelectSubcategory(category.id, subcategoryId)
//                   }
//                   subcategoryInstruments={subcategoryInstruments}
//                   instrumentsLoading={instrumentsLoading}
//                   hideInstruments={hideInstruments}
//                   role={role}
//                   onToggleCategory={handleToggleCategory}
//                   onUpdateSubcategorySearch={handleSubcategorySearch}
//                   onClearSubcategorySearch={handleClearSubcategorySearch}
//                   onPrefetchSubcategory={(subId) => { prefetchInstruments(subId); }}
//                   onToggleHideInstruments={handleToggleHideInstruments}
//                   onViewInstrument={handleView}
//                   onModifyInstrument={handleModify}
//                   onDeleteInstrument={handleDelete}
//                   onIssueInstrument={handleIssue}
//                   subcategoryPage={subcatPages[category.id] || 1}
//                   onSubcategoryPageChange={(newPage) =>
//                     handleSubcategoryPageChange(category.id, newPage)
//                   }
//                 />
//               </div>
//               ))}

//               {categoriesWithSubcategories.length === 0 && (
//               <div className="text-center py-12 col-span-full">
//                 <Package className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
//                 <p className="text-gray-400 text-lg mb-2">
//                   {categorySearch
//                     ? "No matching categories found"
//                     : "No categories available"}
//                 </p>
//                 {categorySearch && (
//                   <button
//                     onClick={clearCategorySearch}
//                     className="text-indigo-400 hover:underline text-sm"
//                   >
//                     Clear search to see all categories
//                   </button>
//                 )}
//               </div>
//               )}
//             </div>

//             {/* Categories pagination controls */}
//             {(() => {
//               const totalCatPages = Math.ceil(
//                 categoriesWithSubcategories.length / PAGE_SIZE
//               );
//               return totalCatPages > 1 ? (
//                 <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-4">
//                   <button
//                     className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
//                     onClick={() => setCatPage((p) => Math.max(1, p - 1))}
//                     disabled={catPage === 1}
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                     Prev
//                   </button>
//                   <span className="text-sm text-gray-400">
//                     {catPage} of {totalCatPages}
//                   </span>
//                   <button
//                     className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
//                     onMouseEnter={async () => {
//                       // Prefetch subcategories (and first subcategory instruments) for next category page
//                       const start = catPage * PAGE_SIZE;
//                       const end = Math.min(start + PAGE_SIZE, categoriesWithSubcategories.length);
//                       const nextCats = categoriesWithSubcategories.slice(start, end);
//                       for (const cat of nextCats) {
//                         try {
//                           await prefetchSubcategories(cat.id);
//                           const subs = await listSubcategories(cat.id).catch(() => [] as any[]);
//                           if (subs && subs.length > 0) {
//                             prefetchInstruments(subs[0].id);
//                           }
//                         } catch {}
//                       }
//                     }}
//                     onClick={() =>
//                       setCatPage((p) => Math.min(totalCatPages, p + 1))
//                     }
//                     disabled={catPage === totalCatPages}
//                   >
//                     Next
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               ) : null;
//             })()}
//           </>
//         )}
//       </div>

//       {/* Modals */}
//       <ViewInstrumentModal
//         instrument={selectedInstrument}
//         isOpen={showViewPopup}
//         onClose={() => {
//           setShowViewPopup(false);
//           clearMessages();
//         }}
//       />

//       <ModifyInstrumentModal
//         instrument={selectedInstrument}
//         isOpen={showModifyPopup}
//         onClose={() => {
//           setShowModifyPopup(false);
//           clearMessages();
//         }}
//         onSubmit={onModifySubmit}
//         isSubmitting={isIssuing}
//         error={issueError}
//       />

//       <DeleteInstrumentModal
//         instrument={selectedInstrument}
//         isOpen={showDeletePopup}
//         onClose={() => {
//           setShowDeletePopup(false);
//           clearMessages();
//         }}
//         onConfirm={onDeleteSubmit}
//         isDeleting={isIssuing}
//         error={issueError}
//       />

//       <IssueRequestModal
//         instrument={selectedInstrument}
//         isOpen={showIssuePopup}
//         onClose={() => {
//           setShowIssuePopup(false);
//           clearMessages();
//         }}
//         onSubmit={onIssueSubmit}
//         isSubmitting={isIssuing}
//         error={issueError}
//       />
//     </div>
//   );
// }

'use client'

import InstrumentsPage from "../Component/page"
const Equipments = () =>{
  return(
    <>
      <InstrumentsPage/>
    </>
  )
}
export default Equipments