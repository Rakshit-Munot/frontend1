'use client'

import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from "./AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./components/Sidebar";
import { useState } from "react";

const PAGE_SIZE = 10; // Adjust as needed

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  interface Item {
    id: number;
    title: string;
    description: string;
    // add more fields as needed
  }

 const [mainItems] = useState<Item[]>([]);
  const [mainPage, setMainPage] = useState(0);

  const totalMainPages = Math.ceil(mainItems.length / PAGE_SIZE);
  const paginatedMainItems = mainItems.slice(mainPage * PAGE_SIZE, (mainPage + 1) * PAGE_SIZE);

  if (isAuthenticated === null) return null;

  const handleLogout = async () => {
    try {
      await fetch('https://backend-4-x6ud.onrender.com/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* 🔷 Top Bar: always row layout */}
      <div className="w-full bg-black/80 text-white border-b border-black shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* 🔹 Logo on Left */}
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/globe.svg" alt="Logo" width={32} height={32} />
              <span className="text-xl font-bold">Brand</span>
            </Link>

            {/* 🔹 Auth Buttons on Right */}
            <div className="flex items-center gap-2 flex-wrap">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-black rounded-md text-sm font-medium text-white bg-black/60 hover:bg-rose-600 hover:border-rose-700 transition duration-200 cursor-pointer"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 border border-black rounded-md text-sm font-medium text-white bg-black/60 hover:bg-blue-600 hover:border-blue-700 transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/Register"
                    className="px-4 py-2 border border-black rounded-md text-sm font-medium text-white bg-black/60 hover:bg-indigo-600 hover:border-indigo-700 transition duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 🔽 Navbar below top bar */}
      <div>
        <Navbar/>
        <div className="flex">
          <div className="flex-1">
            {/* Main content area with pagination */}
            <div>
              {paginatedMainItems.map((item, idx) => (
                <div key={idx}>
                  {/* Render your main content item here */}
                  {JSON.stringify(item)}
                </div>
              ))}
              {totalMainPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => setMainPage(p => Math.max(0, p - 1))}
                    disabled={mainPage === 0}
                    className="p-2 rounded bg-slate-800 text-white disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-400">
                    Page {mainPage + 1} of {totalMainPages}
                  </span>
                  <button
                    onClick={() => setMainPage(p => Math.min(totalMainPages - 1, p + 1))}
                    disabled={mainPage >= totalMainPages - 1}
                    className="p-2 rounded bg-slate-800 text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 w-[290px]">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;



// 'use client'

// import { useRouter } from "next/navigation";
// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuth } from "./AuthContext";
// import Navbar from "./Navbar";
// import Sidebar from "./components/Sidebar";
// import { useState } from "react";

// const PAGE_SIZE = 10;

// const HomePage = () => {
//   const router = useRouter();
//   const { isAuthenticated, logout } = useAuth();

//   // Example main content pagination state (replace with your actual data/fetch logic)
//   const [mainItems, setMainItems] = useState<any[]>([
//     // Mock data for demonstration
//     { id: 1, title: "Welcome to the Platform", description: "Discover amazing features and content" },
//     { id: 2, title: "Latest Updates", description: "Check out what's new in our latest release" },
//     { id: 3, title: "Community Highlights", description: "See what our community is up to" },
//     { id: 4, title: "Featured Content", description: "Don't miss these trending items" },
//     { id: 5, title: "Getting Started", description: "Learn how to make the most of our platform" }
//   ]);
//   const [mainPage, setMainPage] = useState(0);

//   const totalMainPages = Math.ceil(mainItems.length / PAGE_SIZE);
//   const paginatedMainItems = mainItems.slice(mainPage * PAGE_SIZE, (mainPage + 1) * PAGE_SIZE);

//   if (isAuthenticated === null) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//       </div>
//     );
//   }

//   const handleLogout = async () => {
//     try {
//       await fetch('http://localhost:8000/api/logout', {
//         method: 'POST',
//         credentials: 'include',
//       });
//       logout();
//       router.push('/');
//     } catch (error) {
//       console.error('Logout failed:', error);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
//       {/* 🔷 Enhanced Top Bar with glassmorphism effect */}
//       <div className="w-full bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between flex-wrap gap-2">
//             {/* 🔹 Enhanced Logo */}
//             <Link href="/" className="flex items-center space-x-3 group">
//               <div className="relative">
//                 <Image 
//                   src="/globe.svg" 
//                   alt="Logo" 
//                   width={40} 
//                   height={40} 
//                   className="group-hover:rotate-12 transition-transform duration-300"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
//               </div>
//               <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//                 Brand
//               </span>
//             </Link>

//             {/* 🔹 Enhanced Auth Buttons */}
//             <div className="flex items-center gap-3 flex-wrap">
//               {isAuthenticated ? (
//                 <button
//                   onClick={handleLogout}
//                   className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95"
//                 >
//                   Logout
//                 </button>
//               ) : (
//                 <>
//                   <Link
//                     href="/auth/login"
//                     className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 active:scale-95"
//                   >
//                     Login
//                   </Link>
//                   <Link
//                     href="/auth/Register"
//                     className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
//                   >
//                     Sign Up
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 🔽 Enhanced Navbar */}
//       <div className="bg-black/10 backdrop-blur-sm border-b border-white/5">
//         <Navbar />
//       </div>

//       {/* Main Content Area */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Main Content */}
//           <div className="flex-1">
//             {/* Welcome Section */}
//             <div className="mb-12 text-center">
//               <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
//                 Welcome Back
//               </h1>
//               <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//                 Discover amazing content and connect with your community
//               </p>
//             </div>

//             {/* Content Grid */}
//             <div className="space-y-6">
//               {mainItems.length === 0 ? (
//                 <div className="text-center py-16">
//                   <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//                     <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                     </svg>
//                   </div>
//                   <h3 className="text-2xl font-semibold text-white mb-2">No content yet</h3>
//                   <p className="text-gray-400">Start by adding some content to see it here</p>
//                 </div>
//               ) : (
//                 paginatedMainItems.map((item, idx) => (
//                   <div
//                     key={item.id || idx}
//                     className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02]"
//                   >
//                     <div className="flex items-start space-x-4">
//                       <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
//                         <span className="text-white font-bold text-lg">{(mainPage * PAGE_SIZE) + idx + 1}</span>
//                       </div>
//                       <div className="flex-1">
//                         <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
//                           {item.title || `Item ${(mainPage * PAGE_SIZE) + idx + 1}`}
//                         </h3>
//                         <p className="text-gray-300 leading-relaxed">
//                           {item.description || "Description for this item"}
//                         </p>
//                         <div className="mt-4 flex items-center space-x-4 text-sm text-gray-400">
//                           <span className="flex items-center space-x-1">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                             <span>2 min read</span>
//                           </span>
//                           <span className="flex items-center space-x-1">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                             </svg>
//                             <span>24 likes</span>
//                           </span>
//                         </div>
//                       </div>
//                       <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                         <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             {/* Enhanced Pagination */}
//             {totalMainPages > 1 && (
//               <div className="flex items-center justify-center gap-4 mt-12">
//                 <button
//                   onClick={() => setMainPage(p => Math.max(0, p - 1))}
//                   disabled={mainPage === 0}
//                   className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                   </svg>
//                   <span>Previous</span>
//                 </button>
                
//                 <div className="flex items-center space-x-2">
//                   {Array.from({ length: totalMainPages }, (_, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setMainPage(i)}
//                       className={`w-10 h-10 rounded-full transition-all duration-300 ${
//                         i === mainPage
//                           ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
//                           : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
//                       }`}
//                     >
//                       {i + 1}
//                     </button>
//                   ))}
//                 </div>

//                 <button
//                   onClick={() => setMainPage(p => Math.min(totalMainPages - 1, p + 1))}
//                   disabled={mainPage >= totalMainPages - 1}
//                   className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95"
//                 >
//                   <span>Next</span>
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Enhanced Sidebar */}
//           <div className="w-full lg:w-80">
//             <div className="sticky top-32">
//               <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
//                 <Sidebar />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HomePage;