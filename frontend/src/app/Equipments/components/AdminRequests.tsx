import React, { useState } from "react"
import { Clock, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import type { IssueRequest } from "../types/dashboard"
import { formatUserDisplayName, getItemName } from "../utils/dashboardUtils"
import { API_URL } from "../constants/dashboard"

interface AdminRequestsProps {
  requests: IssueRequest[]
  filteredRequests: IssueRequest[]
  paginatedRequests: IssueRequest[]
  requestsLoading: boolean
  search: string
  page: number
  totalPages: number
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onRemoveRequest: (requestId: number) => void
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({
  requests,
  filteredRequests,
  paginatedRequests,
  requestsLoading,
  search,
  page,
  totalPages,
  onSearchChange,
  onPageChange,
  onRemoveRequest,
}) => {
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleApprove = async (requestId: number) => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`${API_URL}/issue-requests/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        onRemoveRequest(requestId)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.detail || "Approval failed.")
      }
    } catch (error) {
      alert("Failed to approve request.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    setProcessingId(requestId)
    try {
      await fetch(`${API_URL}/issue-requests/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      })
      onRemoveRequest(requestId)
    } catch (error) {
      alert("Failed to reject request.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Requests
          </h2>
          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-medium">
            {requests.length}
          </span>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPageChange(1)
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-white placeholder-gray-400"
            />
          </div>
        </div>

        {requestsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending requests</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {paginatedRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-gradient-to-br from-slate-800/50 to-indigo-900/30 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                      <div>
                        <h3 className="font-semibold text-white text-lg leading-tight">
                          {getItemName(req.item)}
                        </h3>
                        <p className="text-gray-400 text-sm">Pending Request</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                      Pending
                    </span>
                  </div>

                  {/* Card content */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Requested By:</span>
                      <span className="text-gray-300 text-sm">
                        {formatUserDisplayName(req.user, req.user_id)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Quantity:</span>
                      <span className="font-semibold text-white bg-slate-700/50 px-2 py-1 rounded">
                        {req.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-4 border-t border-indigo-500/20">
                    <button
                      className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={processingId === req.id}
                      onClick={() => handleApprove(req.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={processingId === req.id}
                      onClick={() => handleReject(req.id)}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <span className="text-sm text-gray-400">
                  {page} of {totalPages}
                </span>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}