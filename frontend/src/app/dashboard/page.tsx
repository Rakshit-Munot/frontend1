'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PurchaseForm from './Form/page'
import { useAuth } from '../AuthContext'

const API_URL = 'http://localhost:8000/instruments/categories'

interface Category {
  id: number
  name: string
}
interface IssueRequest {
  id: number
  item: { id: number; name: string } | number
  user?: { id: number; name?: string; email?: string }
  user_id: number
  quantity: number
  status: string
  created_at: string
  remarks?: string
}

const PAGE_SIZE = 10

export default function DashboardPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Issue requests state
  const [requests, setRequests] = useState<IssueRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<number | null>(null) // Prevent double approval/reject

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error('Failed to load categories')
        const data = await res.json()
        setCategories(data)
      } catch {
        setError('Could not fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch pending issue requests if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      setRequestsLoading(true)
      fetch('http://localhost:8000/instruments/issue-requests/?status=pending', { credentials: 'include' })
        .then(res => res.json())
        .then(setRequests)
        .catch(() => setRequests([]))
        .finally(() => setRequestsLoading(false))
    }
  }, [user])

  // Filtered and paginated requests
  const filteredRequests = requests.filter(req => {
    const itemName = typeof req.item === 'object' && req.item?.name ? req.item.name : ''
    const userName = req.user && req.user.name ? req.user.name : ''
    return (
      itemName.toLowerCase().includes(search.toLowerCase()) ||
      userName.toLowerCase().includes(search.toLowerCase())
    )
  })
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE)
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Instrument Categories</h1>

      {/* Pending Issue Requests Table for Admin */}
      {user?.role === 'admin' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Pending Issue Requests</h2>
          <div className="mb-2 flex flex-col md:flex-row md:items-center gap-2">
            <input
              type="text"
              placeholder="Search by item or user name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="border px-2 py-1 rounded"
            />
            <div className="flex-1" />
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {requestsLoading ? (
            <p>Loading requests...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead>
                  <tr>
                    <th className="px-3 py-2 border">Item</th>
                    <th className="px-3 py-2 border">User</th>
                    <th className="px-3 py-2 border">Quantity</th>
                    <th className="px-3 py-2 border">Requested At</th>
                    <th className="px-3 py-2 border">Remarks</th>
                    <th className="px-3 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map(req => (
                    <tr key={req.id}>
                      <td className="px-3 py-2 border">
                        {req.item && typeof req.item === 'object' && 'name' in req.item
                          ? req.item.name
                          : String(req.item)}
                      </td>
                      <td className="px-3 py-2 border">
                        {req.user && req.user.name
                          ? req.user.name
                          : req.user && req.user.email
                          ? req.user.email
                          : req.user_id}
                      </td>
                      <td className="px-3 py-2 border">{req.quantity}</td>
                      <td className="px-3 py-2 border">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 border">{req.remarks}</td>
                      <td className="px-3 py-2 border">
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded mr-2 cursor-pointer"
                          disabled={processingId === req.id}
                          onClick={async () => {
                            setProcessingId(req.id)
                            const res = await fetch(`http://localhost:8000/instruments/issue-requests/${req.id}/approve`, {
                              method: 'POST',
                              credentials: 'include',
                            });
                            setProcessingId(null)
                            if (res.ok) {
                              setRequests(requests => requests.filter(r => r.id !== req.id));
                            } else {
                              const data = await res.json().catch(() => ({}));
                              alert(data.detail || 'Approval failed. Not enough stock or another error.');
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                          disabled={processingId === req.id}
                          onClick={async () => {
                            setProcessingId(req.id)
                            await fetch(`http://localhost:8000/instruments/issue-requests/${req.id}/reject`, {
                              method: 'POST',
                              credentials: 'include',
                            });
                            setProcessingId(null)
                            setRequests(requests => requests.filter(r => r.id !== req.id));
                          }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-2 mb-6">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/dashboard/${category.name.toLowerCase()}`}
              className="text-blue-500 underline capitalize"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>

      {(user?.role === 'admin' || user?.role === 'staff') && (
        <>
          <h2 className="text-xl font-semibold mb-2">Add New Item</h2>
          <PurchaseForm />
        </>
      )}
    </div>
  )
}