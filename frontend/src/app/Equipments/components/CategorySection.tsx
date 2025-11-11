"use client";

import type React from "react";
import { useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Package,
  ChevronDown,
  Folder,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  Category,
  Subcategory,
  Instrument,
  UserRole,
} from "../types/dashboard";
import { InstrumentCardsModal } from "./modals/InstrumentCardsModal";
import { cn } from "@/lib/utils";
import { PAGE_SIZE } from "../constants/dashboard";

interface CategorySectionProps {
  category: Category & { subcategories: Subcategory[] };
  expandedCategories:Record<number, boolean>;
  subcategorySearches: Record<number, string>;
  selectedSubcategory: number | null;
  subcategoryInstruments: Record<number, Instrument[]>;
  instrumentsLoading: boolean;
  hideInstruments: Record<number, boolean>;
  role: UserRole;
  onToggleCategory: (categoryId: number) => void;
  onUpdateSubcategorySearch: (categoryId: number, value: string) => void;
  onClearSubcategorySearch: (categoryId: number) => void;
  onSelectSubcategory: (subcategoryId: number) => void;
  onToggleHideInstruments: (subcategoryId: number) => void;
  onViewInstrument: (instrument: Instrument) => void;
  onModifyInstrument: (instrument: Instrument) => void;
  onDeleteInstrument: (instrument: Instrument) => void;
  onIssueInstrument: (instrument: Instrument) => void;
  // Prefetch instruments for a subcategory to speed up navigation
  onPrefetchSubcategory?: (subcategoryId: number) => void;
  // Pagination for subcategories (per-category)
  subcategoryPage: number;
  onSubcategoryPageChange: (newPage: number) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  expandedCategories,
  subcategorySearches,
  selectedSubcategory,
  subcategoryInstruments,
  instrumentsLoading,
  hideInstruments,
  role,
  onToggleCategory,
  onUpdateSubcategorySearch,
  onClearSubcategorySearch,
  onSelectSubcategory,
  onToggleHideInstruments,
  onViewInstrument,
  onModifyInstrument,
  onDeleteInstrument,
  onIssueInstrument,
  onPrefetchSubcategory,
  subcategoryPage,
  onSubcategoryPageChange,
}) => {
  const getFilteredSubcategories = (
    categoryId: number,
    subcategoriesList: Subcategory[]
  ) => {
    const searchTerm = subcategorySearches[categoryId] || "";
    return subcategoriesList.filter((sub) =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const isExpanded = expandedCategories[category.id] || false;
  const filteredSubs = getFilteredSubcategories(
    category.id,
    category.subcategories
  );
  const totalSubPages = Math.ceil(filteredSubs.length / PAGE_SIZE);
  const currentSubPage = Math.min(
    Math.max(1, subcategoryPage || 1),
    Math.max(1, totalSubPages || 1)
  );
  const paginatedSubs = filteredSubs.slice(
    (currentSubPage - 1) * PAGE_SIZE,
    currentSubPage * PAGE_SIZE
  );

  // Prefetch instruments for currently visible subcategories (top few) when expanded
  useEffect(() => {
    if (!isExpanded || !onPrefetchSubcategory) return;
    const toWarm = paginatedSubs.slice(0, Math.min(3, paginatedSubs.length));
    toWarm.forEach((s) => onPrefetchSubcategory(s.id));
  }, [isExpanded, paginatedSubs, onPrefetchSubcategory]);

  // Compute next page subcategories for hover prefetch
  const nextPageSubs = useMemo(() => {
    if (currentSubPage >= totalSubPages) return [] as typeof paginatedSubs;
    const start = currentSubPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredSubs.slice(start, end);
  }, [currentSubPage, totalSubPages, filteredSubs]);

  return (
    <div className="bg-blue-600 border animated-card-bg border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Category Header */}
      <div
        className="p-6 cursor-pointer transition-all duration-200 border-b border-gray-100"
        onClick={() => onToggleCategory(category.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-lg shadow-sm">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {category.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {category.subcategories.length} subcategories available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              {category.subcategories.length}
            </span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-gray-400 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </div>

      {/* Subcategories Dropdown */}
      {isExpanded &&
        category.subcategories &&
        category.subcategories.length > 0 && (
          <div className="bg-gray-50/50">
            {/* Subcategory Search */}
            <div className="p-4 border-b border-yellow-200 bg-black">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search in ${category.name}...`}
                  value={subcategorySearches[category.id] || ""}
                  onChange={(e) => {
                    onUpdateSubcategorySearch(category.id, e.target.value);
                    onSubcategoryPageChange(1);
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                />
                {subcategorySearches[category.id] && (
                  <button
                    onClick={() => onClearSubcategorySearch(category.id)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              {subcategorySearches[category.id] && (
                <p className="text-xs text-gray-500 mt-2">
                  {filteredSubs.length}{" "}
                  results found
                </p>
              )}
            </div>

            {/* Subcategories List */}
            <div className="max-h-64 overflow-y-auto">
              {paginatedSubs.map((subcategory, subIndex) => {
                const isInstrumentsVisible =
                  selectedSubcategory === subcategory.id &&
                  !hideInstruments[subcategory.id];

                return (
                  <div key={subcategory.id}>
                    <button
                      className="flex items-center justify-between w-full p-4 my-1 rounded-lg hover:bg-yellow-150 hover:shadow-sm transition-all duration-200 group border-l-1 border-transparent hover:border-yellow-500 focus:outline-cyan-950 focus:ring-2 focus:ring-black"
                      style={{
                        animationDelay: `${subIndex * 0.02}s`,
                        animation: "fadeIn 0.3s ease-in-out forwards",
                      }}
                      onMouseEnter={() => onPrefetchSubcategory?.(subcategory.id)}
                      onClick={() => {
                        if (selectedSubcategory === subcategory.id) {
                          // toggle hide for this subcategory only
                          onToggleHideInstruments(subcategory.id);
                        } else {
                          // select this subcategory for this category
                          onSelectSubcategory(subcategory.id);
                          // ensure it's visible
                          if (hideInstruments[subcategory.id])
                            onToggleHideInstruments(subcategory.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-950 group-hover:bg-green-600 transition-colors"></div>
                        <span className="text-sm font-medium text-yellow-950 group-hover:text-green-700 transition-colors capitalize">
                          {subcategory.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-black group-hover:text-green-600 transition-colors">
                        <span className="text-xs">
                          {isInstrumentsVisible
                            ? "Hide instruments"
                            : "View instruments"}
                        </span>
                        {isInstrumentsVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Instruments List for selected subcategory */}
                    {selectedSubcategory === subcategory.id && (
                      <InstrumentCardsModal
                        subcategoryName={subcategory.name}
                        instruments={
                          subcategoryInstruments[subcategory.id] || []
                        }
                        isLoading={instrumentsLoading}
                        isVisible={!hideInstruments[subcategory.id]}
                        role={role}
                        onView={onViewInstrument}
                        onModify={onModifyInstrument}
                        onDelete={onDeleteInstrument}
                        onIssue={onIssueInstrument}
                        onHide={() => onToggleHideInstruments(subcategory.id)}
                      />
                    )}
                  </div>
                );
              })}

              {filteredSubs.length === 0 && (
                <div className="p-6 text-center">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <div className="text-gray-500 text-sm mb-2">
                    {subcategorySearches[category.id]
                      ? `No subcategories match "${
                          subcategorySearches[category.id]
                        }"`
                      : "No subcategories found"}
                  </div>
                  {subcategorySearches[category.id] && (
                    <button
                      onClick={() => {
                        onClearSubcategorySearch(category.id);
                        onSubcategoryPageChange(1);
                      }}
                      className="text-sm text-green-600 hover:text-green-700 transition-colors underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Subcategories pagination controls */}
            {totalSubPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                  onClick={() => onSubcategoryPageChange(currentSubPage - 1)}
                  onMouseEnter={() => {
                    // Prefetch a few from the previous page as well
                    if (!onPrefetchSubcategory || currentSubPage <= 1) return;
                    const start = (currentSubPage - 2) * PAGE_SIZE;
                    const end = start + PAGE_SIZE;
                    filteredSubs.slice(Math.max(0, start), Math.max(0, end)).slice(0, 3).forEach((s) => onPrefetchSubcategory(s.id));
                  }}
                  disabled={currentSubPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  {currentSubPage} of {totalSubPages}
                </span>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                  onMouseEnter={() => {
                    // Prefetch first few subcategories of next page for instant feel
                    if (!onPrefetchSubcategory || nextPageSubs.length === 0) return;
                    nextPageSubs.slice(0, Math.min(3, nextPageSubs.length)).forEach((s) => onPrefetchSubcategory(s.id));
                  }}
                  onClick={() => onSubcategoryPageChange(currentSubPage + 1)}
                  disabled={currentSubPage === totalSubPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
