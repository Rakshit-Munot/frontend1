'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from 'next/link';
import { useAuth } from "./AuthContext";

const Navbar = () => {
  const pathname = usePathname();
  const [isClick, setIsClick] = useState(false);
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return null; 
  }

  const toggleNavbar = () => setIsClick(!isClick);


  const navLinks = [
    { href: "/", label: "Home" },
    // { href: "/about", label: "About" },
    // { href: "/services", label: "Services" },
    { href: "/dashboard", label: "DashBoard" },
    { href: "/Equipments", label: "Equipments" },
    { href: "/research", label: "Research Papers" },
    { href: "/timetable", label: "Timetable" },
    { href: "/Handouts", label: "Handouts" },
    { href: "/flowchart", label: "FlowChart" },
  ];

  // if(isAuthenticated) {
  //   navLinks.push({ href: "/dashboard", label: "Dashboard" });
  // }

  return (
    <nav className="rounded-b-xl relative backdrop-blur-xl bg-black/80 border-b border-black shadow-lg text-white overflow-hidden">
      {/* Animated dark gradient background with more dark colors, including dark green and yellow */}
      <div className="absolute inset-0 animated-navbar-bg blur-xl opacity-60 z-0" />
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-black backdrop-blur-md bg-black/60 hover:bg-white/80 hover:text-slate-900 hover:border-white/30 shadow group ${
                    pathname === link.href
                      ? 'bg-white/20 text-white border-white/20'
                      : 'text-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="md:hidden flex items-center">
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-white/80 border border-black bg-black/60 backdrop-blur-md hover:bg-white/80 hover:text-slate-900 hover:border-white/30 transition-all duration-200"
                onClick={toggleNavbar}
              >
                {isClick ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isClick && (
        <div className="md:hidden relative z-10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/60 backdrop-blur-xl border-t border-black shadow-lg rounded-b-xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsClick(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium border border-black bg-black/60 backdrop-blur-md shadow transition-all duration-200 hover:bg-white/80 hover:text-slate-900 hover:border-white/30 ${
                  pathname === link.href
                    ? 'bg-white/30 text-white border-white/20'
                    : 'text-white/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
