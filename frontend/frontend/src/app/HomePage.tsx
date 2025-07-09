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

  // Example main content pagination state (replace with your actual data/fetch logic)
  const [mainItems, setMainItems] = useState<any[]>([]); // Replace any[] with your item type
  const [mainPage, setMainPage] = useState(0);

  const totalMainPages = Math.ceil(mainItems.length / PAGE_SIZE);
  const paginatedMainItems = mainItems.slice(mainPage * PAGE_SIZE, (mainPage + 1) * PAGE_SIZE);

  if (isAuthenticated === null) return null;

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout', {
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