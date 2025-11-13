"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import { useAuth } from "./AuthContext";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import About from "./components/about"; // <-- Import About
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 10;

const HomePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [showUserDetails, setShowUserDetails] = useState(false);

  interface Item {
    id: number;
    title: string;
    description: string;
  }

  const [mainItems] = useState<Item[]>([
    {
      id: 1,
      title: "Welcome to Our Platform",
      description:
        "Discover amazing features and connect with your community in ways you never imagined.",
    },
    {
      id: 2,
      title: "Latest Updates & Features",
      description:
        "Check out what's new in our latest release with cutting-edge functionality.",
    },
    {
      id: 3,
      title: "Community Highlights",
      description:
        "See what our amazing community is up to and get inspired by their creativity.",
    },
    {
      id: 4,
      title: "Featured Content",
      description:
        "Don't miss these trending items that are making waves in our platform.",
    },
    {
      id: 5,
      title: "Getting Started Guide",
      description:
        "Learn how to make the most of our platform with our comprehensive guide.",
    },
  ]);
  const [mainPage, setMainPage] = useState(0);

  const totalMainPages = Math.ceil(mainItems.length / PAGE_SIZE);
  const paginatedMainItems = mainItems.slice(
    mainPage * PAGE_SIZE,
    (mainPage + 1) * PAGE_SIZE
  );

  // Open the full profile modal when coming from header (e.g., /?profile=1)
  useEffect(() => {
    const show = searchParams?.get("profile");
    if (show && !showUserDetails) {
      setShowUserDetails(true);
      // Clean the query without scrolling
      router.replace("/", { scroll: false });
    }
  }, [searchParams, showUserDetails, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Brand - Welcome to the Future</title>
        <meta
          name="description"
          content="Experience the next generation of digital innovation with Brand. Discover amazing features, community highlights, and stay updated with the latest content."
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">

        {/* TopHeader is rendered globally in layout.tsx; removing legacy Navbar */}

        <div className="hero-section relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="hero-float">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-6 text-balance">
                Welcome to the Future
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 text-pretty">
                Experience the next generation of digital innovation with our
                cutting-edge platform designed for modern creators and innovators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
                <Link
                  href="/about"
                  className="px-8 py-4 bg-transparent hover:bg-white/10 text-white rounded-xl font-semibold transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-105 active:scale-95"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                  Discover Amazing Content
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
                  Explore our curated collection of features, updates, and
                  community highlights designed to inspire and inform.
                </p>
              </div>

              {/* Enhanced Content Grid */}
              <div className="space-y-6">
                {mainItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      No content yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start by adding some content to see it here
                    </p>
                  </div>
                ) : (
                  paginatedMainItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="feature-card group bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-primary/50 shadow-lg"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {mainPage * PAGE_SIZE + idx + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed text-pretty">
                            {item.description}
                          </p>
                          <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>2 min read</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              <span>24 likes</span>
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg
                            className="w-6 h-6 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Enhanced Pagination */}
              {totalMainPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setMainPage((p) => Math.max(0, p - 1))}
                    disabled={mainPage === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-card/60 hover:bg-card/80 backdrop-blur-sm rounded-xl text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 border border-border"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalMainPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setMainPage(i)}
                        className={`w-10 h-10 rounded-full transition-all duration-300 ${
                          i === mainPage
                            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                            : "bg-card/60 hover:bg-card/80 text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setMainPage((p) => Math.min(totalMainPages - 1, p + 1))
                    }
                    disabled={mainPage >= totalMainPages - 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-card/60 hover:bg-card/80 backdrop-blur-sm rounded-xl text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 border border-border"
                  >
                    <span>Next</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="w-full lg:w-80">
              <div className="sticky top-32">
                <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border overflow-hidden shadow-lg">
                  <Sidebar />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3,
                }}
                className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                      User Profile
                    </h2>
                    <button
                      onClick={() => setShowUserDetails(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Use About component instead of inline details */}
                  <About />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default HomePage;