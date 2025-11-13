"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import About from "./about";
import HandoutManager from "./HandoutManager";
import { prefetchHandouts, listHandoutYears } from "../Handouts/services/handoutsApi";
import { prefetchBills, prefetchBillYears } from "../Dash/services/billsApi";
import { listLabsCached } from "../Handouts/services/labsCache";
import { prefetchCategories, prefetchAllInstruments } from "../Equipments/services/instrumentsApi";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout, loader } = useAuth() as any;
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hide header on auth routes AND whenever user isn't authenticated (ProtectedRoute shows LoginForm inline)
  const hideHeader = pathname?.startsWith("/auth") || !isAuthenticated;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
        // Reset any transient logout spinner if dropdown is closed
        setIsLoggingOut(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure logout spinner never persists after auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoggingOut(false);
    }
  }, [isAuthenticated]);

  // One-time warm-start prefetch to make key pages feel instant
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__APP_WARMED) return;
    (window as any).__APP_WARMED = true;

    const run = async () => {
      try {
        const conn: any = (navigator as any).connection || {};
        const slow = !!conn.saveData || ["slow-2g", "2g"].includes(conn.effectiveType);
        const tasks = [
          prefetchHandouts({ page: 1, limit: 10 }).catch(() => {}),
          listHandoutYears().catch(() => {}),
          listLabsCached().catch(() => {}),
          prefetchBills({ page: 1, limit: 10 }).catch(() => {}),
          prefetchBillYears().catch(() => {}),
          prefetchCategories().catch(() => {}),
        ];
        // Deep prefetch of entire instruments catalog on normal connections
        if (!slow) {
          tasks.push(prefetchAllInstruments(5).catch(() => {}));
        }
        // On slow networks, still run but do not block; allSettled avoids throwing
        await Promise.allSettled(tasks);
      } catch {
        // ignore
      }
    };
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 0);
    }
  }, []);

  // Register service worker (production only) for static/API caching
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== 'production') return;
    if (!("serviceWorker" in navigator)) return;
    (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (!existing) {
          await navigator.serviceWorker.register('/sw.js');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Dev-only: ensure no stale SW/caches interfere with new UI during development
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV === 'production') return;
    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            try { await reg.unregister(); } catch {}
          }
        }
        if ((window as any).caches && typeof caches.keys === 'function') {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const onLogout = async () => {
    if (isLoggingOut) return; // prevent double click
    setIsLoggingOut(true);
    setFadeOut(true); // trigger fade animation

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-4-x6ud.onrender.com";
      await fetch(`${apiUrl}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    setTimeout(() => {
      logout(); // clear auth context
      setShowUserDropdown(false);
      setIsLoggingOut(false);
      router.push("/"); // redirect to main page
    }, 500);
  };

  // Also avoid flicker while auth state is loading
  if (loader || hideHeader) return null;

  return (
    <>
    <header className="w-full bg-white border-b-7 border-[#A31F34] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* LNMIIT Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center">
              <Image
                src="/LNMIIT-logo.jpg"
                alt="LNMIIT Logo"
                width={140}
                height={60}
                className="h-10 w-auto"
                priority
              />
            </div>
          </Link>

          {/* Primary Nav with click-to-toggle dropdowns (persistent until outside click) */}
          <nav className="hidden md:flex items-center gap-6">
            <PersistentDropdown label="Home" href="/" />
            <PersistentDropdown label="Equipments" href="/Component" />
            {/* Handouts dropdown */}
             <PersistentDropdown label="Handouts" href="/Handouts" />
            {/* Bills link visible only to admin */}
            {user?.role === 'admin' && <PersistentDropdown label="Bills" href="/Dash" />}
          </nav>

          {/* Auth/Profile */}
          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Profile Button */}
                <button
                  aria-label="User Profile"
                  aria-expanded={showUserDropdown}
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:bg-black/90 hover:scale-105 active:scale-95"
                >
                  <span className="hidden sm:block font-brittany text-2xl md:text-3xl">Profile</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showUserDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 user-dropdown dialog-surface-login overflow-hidden">
                    <div className="p-4 bg-white border-b dialog-divider-login">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                          {(user?.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="rounded-md border dialog-divider-login px-3 py-2">
                          <h3 className="text-lg font-semibold text-black leading-snug">{user?.username || "User Name"}</h3>
                          {user?.email ? (
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(user.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-black/70 hover:text-black underline-offset-2 hover:underline"
                              title={`Compose mail to ${user.email}`}
                            >
                              {user.email}
                            </a>
                          ) : (
                            <p className="text-sm text-black/60">user@example.com</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <button
                        onClick={() => {
                          setShowUserDetails(true);
                          setShowUserDropdown(false);
                        }}
                        className="group w-full flex items-center gap-2 text-left px-4 py-2 text-[0.95rem] text-black hover:bg-black/5 rounded-lg transition-colors font-medium"
                      >
                        {/* Eye icon images: closed by default, opens on hover */}
                        <span className="relative inline-flex items-center justify-center w-5 h-5">
                          <Image
                            src="/eye-close.svg"
                            alt="View"
                            width={20}
                            height={20}
                            className="absolute w-5 h-5 group-hover:opacity-0 transition-opacity"
                            priority={false}
                          />
                          <Image
                            src="/eye-open.svg"
                            alt="View"
                            width={20}
                            height={20}
                            className="absolute w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            priority={false}
                          />
                        </span>
                        <span>View Full Profile</span>
                      </button>
                      <AnimatePresence mode="wait">
                        {!isLoggingOut ? (
                          <motion.button
                            key="logout-btn"
                            aria-label="Logout"
                            onClick={onLogout}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="group w-full flex items-center gap-2 text-left px-4 py-2 text-[0.95rem] text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
                          >
                            {/* Door icon images: open by default, closes on hover */}
                            <span className="relative inline-flex items-center justify-center w-5 h-5">
                              <Image
                                src="/door-open.svg"
                                alt="Logout"
                                width={20}
                                height={20}
                                className="absolute w-5 h-5 transition-opacity group-hover:opacity-0"
                                priority={false}
                              />
                              <Image
                                src="/door-close.svg"
                                alt="Logout"
                                width={20}
                                height={20}
                                className="absolute w-5 h-5 opacity-0 transition-opacity group-hover:opacity-100"
                                priority={false}
                              />
                            </span>
                            <span>Logout</span>
                          </motion.button>
                        ) : (
                          <motion.div
                            key="logout-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                          >
                            <button className="btn loading w-full py-2 rounded-lg text-white font-semibold">
                              Logging Out
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="px-6 py-2.5 bg-card/60 hover:bg-card/80 backdrop-blur-sm text-foreground rounded-xl font-medium transition-all duration-300 border border-border hover:border-primary/50 hover:scale-105 active:scale-95">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* User Details Modal (replicated from HomePage) */}
    <AnimatePresence>
      {showUserDetails && (
        <motion.div
          key="user-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="user-modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
            className="dialog-surface-login max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b dialog-divider-login bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">User Profile</h2>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <About />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

// Reusable dropdown component: click toggles, persists until outside click
function PersistentDropdown({ label, href, panel }: { label: string; href?: string; panel?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  // small prefetch mapping to warm caches on hover for instant feel
  const prefetchMap: Record<string, () => void> = {
    "/Handouts": () => { prefetchHandouts({ page: 1, limit: 10 }).catch(() => {}); listHandoutYears().catch(() => {}); },
    "/Dash": () => { prefetchBills({ page: 1, limit: 10 }).catch(() => {}); prefetchBillYears().catch(() => {}); },
    "/Component": () => { prefetchCategories().catch(() => {}); },
    "/Equipments": () => { prefetchCategories().catch(() => {}); },
    // add other mappings as needed
  };

  const handlePrefetch = () => {
    if (href && prefetchMap[href]) {
      try { prefetchMap[href](); } catch {}
    }
  };

  const base = (
    <button
      onClick={() => setOpen((o) => !o)}
      onMouseEnter={handlePrefetch}
      className="px-3 py-1.5 rounded-md text-black text-base md:text-lg font-medium transition-colors duration-150 hover:text-white hover:bg-[#A31F34]"
      type="button"
    >
      {label}
    </button>
  );
  return (
    <div className="relative" ref={ref}>
      {href && !panel ? <Link href={href}>{base}</Link> : base}
      {panel && open && (
        <div className="absolute left-0 top-full mt-2 rounded-xl border dialog-divider-login bg-white shadow-xl z-50" onClick={(e)=>e.stopPropagation()}>
          {panel}
        </div>
      )}
    </div>
  );
}
