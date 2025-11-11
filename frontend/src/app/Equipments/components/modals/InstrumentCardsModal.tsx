import React, { useEffect, useMemo, useState } from "react";
import { Package, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import type { Instrument, UserRole } from "../../types/dashboard";
import {
  getAvailabilityStatus,
  isItemAvailable,
} from "../../utils/dashboardUtils";
import { PAGE_SIZE } from "../../constants/dashboard";

interface InstrumentCardsModalProps {
  subcategoryName: string;
  instruments: Instrument[];
  isLoading: boolean;
  isVisible: boolean;
  role: UserRole;
  onView: (instrument: Instrument) => void;
  onModify: (instrument: Instrument) => void;
  onDelete: (instrument: Instrument) => void;
  onIssue: (instrument: Instrument) => void;
  onHide: () => void;
}
const MaskedButton = ({ onClick, containerClassName, children }: { onClick: () => void; containerClassName: string; children: React.ReactNode }) => (
  <div className={containerClassName}>
    <span className="mas">{children}</span>
    <button type="button" name="Hover" onClick={onClick}>
      {children}
    </button>
  </div>
);


export const InstrumentCardsModal: React.FC<InstrumentCardsModalProps> = ({
  subcategoryName,
  instruments,
  isLoading,
  isVisible,
  role,
  onView,
  onModify,
  onDelete,
  onIssue,
  onHide,
}) => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [subcategoryName, isVisible, instruments?.length]);

  const totalPages = useMemo(
    () => Math.ceil((instruments?.length || 0) / PAGE_SIZE),
    [instruments]
  );
  const paginatedInstruments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return instruments?.slice(start, start + PAGE_SIZE) || [];
  }, [instruments, page]);

  const getActionButton = (item: Instrument) => {
    const available = isItemAvailable(item);

    if (role === "guest") {
      return (
        <button
          disabled
          className="group relative px-4 py-2 text-gray-400 bg-gray-600/50 rounded-lg font-medium cursor-not-allowed opacity-50"
        >
          <span className="relative z-10">Login Required</span>
        </button>
      );
    }

    if (role === "student") {
      return (
        <button
          onClick={() => available && onIssue(item)}
          disabled={!available}
          className={`group relative px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${
            available
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
              : "bg-gray-600 cursor-not-allowed opacity-50"
          }`}
        >
          <span className="relative z-10">
            {available ? "Issue Request" : "Unavailable"}
          </span>
        </button>
      );
    }
    if (role === "faculty" || role === "staff") {
      return (
        <button
          onClick={() => onView(item)}
          className="group relative px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <span className="relative z-10">View Details</span>
        </button>
      );
    }
    if (role === "admin") {
      return (
        <div className="flex flex-row gap-2 justify-center">
           <MaskedButton onClick={() => onView(item)} containerClassName="button-container-1">
            View
          </MaskedButton>
          <MaskedButton onClick={() => onModify(item)} containerClassName="button-container-2">
            Modify
          </MaskedButton>
          <MaskedButton onClick={() => onDelete(item)} containerClassName="button-container-3">
            Delete
          </MaskedButton>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 border border-purple-500/20 rounded-xl mt-3 overflow-hidden backdrop-blur-sm">
      {isVisible && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-500/20 border-b-indigo-500 rounded-full animate-spin animate-reverse"></div>
              </div>
            </div>
          ) : instruments && instruments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {paginatedInstruments.map((item, itemIndex) => {
                const availability = getAvailabilityStatus(item);
                return (
                  <div
                    key={item.id}
                    className={`${!isItemAvailable(item) ? "opacity-60" : ""}`}
                    style={{
                      animationDelay: `${itemIndex * 0.1}s`,
                      animation: "fadeInUp 0.5s ease-out forwards",
                    }}
                  >
                    {/* Header with status indicator */}
                    <div className="flex items-start justify-between mb-4 w-full px-7">
                      <span
                        className={`inline-flex justify-between items-center gap-1 px-17 py-1 rounded-full text-xs font-medium animate-pulse ${
                          availability.status === "Available"
                            ? "bg-green-500/20 text-green-400"
                            : availability.status === "Low Stock"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${availability.dotColor}`}
                        ></div>
                        {availability.status}
                      </span>
                    </div>

                    {/* Card content */}
                    <div className="space-y-3 mb-4 px-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm px-4">
                          Serial Number:
                        </span>
                        <span className="font-mono text-sm text-gray-300 bg-slate-700/50 px-4 py-1 rounded">
                          {item.serial_number}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm px-4">
                          Quantity:
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isItemAvailable(item)
                                ? "text-white"
                                : "text-red-400"
                            }`}
                          >
                            {item.quantity}
                          </span>
                          {!isItemAvailable(item) && (
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm px-4">
                          Bill Number:
                        </span>
                        <span className="font-mono text-sm text-gray-300 bg-slate-700/50 px-4 py-1 rounded">
                          {item.bill_number}
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-between border-t border-purple-500/20">
                      {getActionButton(item)}
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div className="col-span-full flex items-center justify-between pt-2 mt-2">
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-sm text-gray-300">
                    {page} of {totalPages}
                  </span>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
              <p className="text-gray-400 text-lg">
                No instruments found in this subcategory
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Try selecting a different subcategory
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
