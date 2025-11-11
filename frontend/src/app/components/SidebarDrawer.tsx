"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "./navLinks";
import { useAuth } from "../AuthContext";

export default function SidebarDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, loader } = useAuth();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Hide sidebar when not logged in or on auth pages
  if (loader) return null;
  if (!isAuthenticated || pathname.startsWith("/auth")) return null;

  return (
    <>
      {/* Kebab-style three-vertical-bars trigger */}
      <button
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-[60] rounded-lg border border-black/40 bg-black/70 text-white p-2 hover:bg-white/80 hover:text-slate-900 hover:border-white/40 transition"
      >
        {/* Three vertical bars icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="4" y="3" width="2" height="18" rx="1" />
          <rect x="11" y="3" width="2" height="18" rx="1" />
          <rect x="18" y="3" width="2" height="18" rx="1" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-[60] w-72 max-w-[85vw] bg-black/85 text-white border-r border-black/60 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Navigation</span>
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="p-2 rounded-md hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-56px)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block w-full text-left px-3 py-2 rounded-lg border transition-all duration-200 ${
                pathname === link.href
                  ? "bg-white/20 border-white/20"
                  : "bg-black/40 border-black/40 hover:bg-white/80 hover:text-slate-900 hover:border-white/30"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
