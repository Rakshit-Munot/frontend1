import React, { useEffect, useMemo, useState } from "react"
import { Clock, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, MessageSquare, Calendar, ChevronDown } from "lucide-react"
import type { IssueRequest } from "../types/dashboard"
import { formatUserDisplayName, getItemName } from "../utils/dashboardUtils"
import { API_URL } from "../constants/dashboard"
import { getItem, postIssueMessage, submitReturn, type ItemDetailSnapshot, type IssueMessage } from "../services/instrumentsApi"

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
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [activeReq, setActiveReq] = useState<IssueRequest | null>(null)
  const [activeItem, setActiveItem] = useState<ItemDetailSnapshot | null>(null)
  const [approveForm, setApproveForm] = useState({
    returnDays: 7 as number,
    returnBy: "" as string,
    remarks: "" as string,
    markSubmitted: false as boolean,
  })
  const [messageForm, setMessageForm] = useState({ text: "", notify: true })

  const openApprove = async (req: IssueRequest) => {
    setActiveReq(req)
    setShowApproveModal(true)
    try {
      const item = await getItem(typeof req.item === "number" ? req.item : req.item.id)
      setActiveItem(item)
      // Default: for non-consumables, do not mark submitted immediately
      setApproveForm((f) => ({ ...f, markSubmitted: false }))
    } catch {
      setActiveItem(null)
    }
  }

  const confirmApprove = async () => {
    if (!activeReq) return
    const requestId = activeReq.id
    setProcessingId(requestId)
    try {
      const body: any = {}
      if (approveForm.remarks) body.remarks = approveForm.remarks
      if (approveForm.returnBy) body.return_by = new Date(approveForm.returnBy).toISOString()
      else if (approveForm.returnDays) body.return_days = approveForm.returnDays
      const res = await fetch(`${API_URL}/issue-requests/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || "Approval failed.")
      }
      // Optionally mark submitted (only relevant for non-consumables)
      if (approveForm.markSubmitted) {
        try {
          await submitReturn(requestId, { message: "Submitted at approval", notify_email: true })
        } catch {}
      }
      onRemoveRequest(requestId)
      setShowApproveModal(false)
      setActiveReq(null)
    } catch (e: any) {
      alert(e?.message || "Failed to approve request.")
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

  const openMessage = (req: IssueRequest) => {
    setActiveReq(req)
    setMessageForm({ text: "", notify: true })
    setShowMessageModal(true)
  }

  const sendMessage = async () => {
    if (!activeReq) return
    setProcessingId(activeReq.id)
    try {
      await postIssueMessage(activeReq.id, { text: messageForm.text, notify_email: messageForm.notify })
      setShowMessageModal(false)
      setActiveReq(null)
    } catch {
      alert("Failed to send message")
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

                    {activeItem && activeReq?.id === req.id ? (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Type:</span>
                        <span className="text-gray-300 text-sm">{activeItem.is_consumable ? "Consumed" : "Not Consumed"}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-4 border-t border-indigo-500/20">
                    <button
                      className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={processingId === req.id}
                      onClick={() => openApprove(req)}
                      title="Approve and set return window; choose submission"
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
                    <button
                      className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={processingId === req.id}
                      onClick={() => openMessage(req)}
                      title="Send message (optional email)"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
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

      {/* Approve Modal */}
      {showApproveModal && activeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Approve Request
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Item</span>
                <span className="text-gray-200">{getItemName(activeReq.item)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type</span>
                <span className="text-gray-200">{activeItem?.is_consumable ? "Consumed" : "Not Consumed"}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Return in (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={approveForm.returnDays}
                    onChange={(e) => setApproveForm((f) => ({ ...f, returnDays: Math.max(1, Number(e.target.value) || 1), returnBy: "" }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Or return by (date)</label>
                  <input
                    type="datetime-local"
                    value={approveForm.returnBy}
                    onChange={(e) => setApproveForm((f) => ({ ...f, returnBy: e.target.value, returnDays: f.returnDays }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Remarks (optional)</label>
                <textarea
                  value={approveForm.remarks}
                  onChange={(e) => setApproveForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white min-h-[80px]"
                />
              </div>

              {!activeItem?.is_consumable && (
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={approveForm.markSubmitted}
                    onChange={(e) => setApproveForm((f) => ({ ...f, markSubmitted: e.target.checked }))}
                  />
                  Mark as submitted immediately
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowApproveModal(false); setActiveReq(null); }}
                  className="px-3 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={processingId === activeReq.id}
                  className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && activeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Send Message
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-300">To: {formatUserDisplayName(activeReq.user, activeReq.user_id)}</div>
              <textarea
                value={messageForm.text}
                onChange={(e) => setMessageForm((f) => ({ ...f, text: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white min-h-[120px]"
                placeholder="Write a message for the student..."
              />
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={messageForm.notify}
                  onChange={(e) => setMessageForm((f) => ({ ...f, notify: e.target.checked }))}
                />
                Notify via email
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowMessageModal(false); setActiveReq(null); }}
                  className="px-3 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={processingId === activeReq.id}
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}