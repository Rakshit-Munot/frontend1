'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = 'https://backend-4-x6ud.onrender.com/instruments'

interface SubCategory {
  name: string
}

interface Item {
  id: string
  name: string
  serial_number: string
  cost: string
  quantity: string
  gst_number: string
  buyer_name: string
  buyer_email: string
  purchase_date: string
  bill_number: string
  remarks: string
  category: { id: number; name: string }
  sub_category: { id: number; name: string }
}

type UserRole = 'admin' | 'faculty' | 'staff' | 'student' | null

export default function CategoryPage() {
  const { category: rawCategory } = useParams()
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [role, setRole] = useState<UserRole>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  // Popup state for issuing
  const [showIssuePopup, setShowIssuePopup] = useState(false)
  const [issueItem, setIssueItem] = useState<Item | null>(null)
  const [issueQuantity, setIssueQuantity] = useState('')
  const [issueError, setIssueError] = useState('')
  const [isIssuing, setIsIssuing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Popup state for view, modify, delete
  const [showViewPopup, setShowViewPopup] = useState(false)
  const [showModifyPopup, setShowModifyPopup] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [modifyData, setModifyData] = useState<Partial<Item>>({})

  useEffect(() => {
  if (successMessage) {
    const timer = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timer);
  }
  }, [successMessage]);
  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("https://backend-4-x6ud.onrender.com/api/auth/check", { 
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        })
        if (res.ok) {
          const data = await res.json()
          setRole(data?.user?.role || null)
        } else {
          setRole(null)
        }
      } catch (error) {
        console.error('Error fetching role:', error)
        setRole(null)
      }
    }
    
    fetchRole()
  }, [])

  useEffect(() => {
    if (!categoryId) return

    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_URL}/items?category=${categoryId}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching items:', err)
        setError('Could not load items. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [categoryId])

  useEffect(() => {
    if (!category) return

    const fetchCategoryId = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        const categories = Array.isArray(data) ? data : []
        const matched = categories.find((cat: any) => 
          cat?.name?.toLowerCase() === category.toLowerCase()
        )
        if (!matched) {
          throw new Error('Category not found')
        }
        setCategoryId(matched.id)
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Could not load category. Please check if the category exists.')
        setLoading(false)
      }
    }

    fetchCategoryId()
  }, [category])

  // Check if item is available
  const isItemAvailable = (item: Item) => {
    const quantity = parseInt(item.quantity) || 0
    return quantity > 0
  }

  // Get availability status
  const getAvailabilityStatus = (item: Item) => {
    const quantity = parseInt(item.quantity) || 0
    if (quantity === 0) {
      return { status: 'Not Available', color: 'text-red-400', bgColor: 'bg-red-400', dotColor: 'bg-red-400' }
    } else if (quantity <= 5) {
      return { status: 'Low Stock', color: 'text-yellow-400', bgColor: 'bg-yellow-400', dotColor: 'bg-yellow-400' }
    } else {
      return { status: 'Available', color: 'text-green-400', bgColor: 'bg-green-400', dotColor: 'bg-green-400' }
    }
  }

  // Filter based on search
  const filteredItems = items.filter((item) => {
    if (!item) return false
    const query = searchTerm.toLowerCase()
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.serial_number || '').toLowerCase().includes(query) ||
      (item.bill_number || '').toLowerCase().includes(query)
    )
  })

  // Group by subcategory
  const groupedItems = filteredItems.reduce((acc: Record<string, Item[]>, item) => {
    if (!item) return acc
    const key = item.sub_category?.name || 'Uncategorized'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  // Handler for view
  const handleView = (item: Item) => {
    setSelectedItem(item)
    setShowViewPopup(true)
  }

  // Handler for modify
  const handleModify = (itemId: string) => {
    const item = items.find(it => it.id === itemId)
    if (item) {
      setSelectedItem(item)
      setModifyData({...item})
      setShowModifyPopup(true)
    }
  }

  // Handler for delete
  const handleDelete = (itemId: string) => {
    const item = items.find(it => it.id === itemId)
    if (item) {
      setSelectedItem(item)
      setShowDeletePopup(true)
    }
  }

  // Submit modify
  const handleModifySubmit = async () => {
  if (!selectedItem) return;

  try {
    setIsIssuing(true);
    setIssueError('');
    // Name
    const name = modifyData.name ?? selectedItem.name;
    if (!name || name.trim() === '') {
      setIssueError('Name is required.');
      setIsIssuing(false);
      return;
    }

    // Serial Number
    const serialNumber = modifyData.serial_number ?? selectedItem.serial_number;
    if (!serialNumber || serialNumber.trim() === '') {
      setIssueError('Serial Number is required.');
      setIsIssuing(false);
      return;
    }

    // Cost
    const costValue = Number(modifyData.cost ?? selectedItem.cost);
    if (isNaN(costValue) || costValue <= 0) {
      setIssueError('Cost must be a number greater than 0.');
      setIsIssuing(false);
      return;
    }

    // Quantity
    const quantityValue = Number(modifyData.quantity ?? selectedItem.quantity);
    if (isNaN(quantityValue) || quantityValue < 0) {
      setIssueError('Quantity must be a number greater than or equal to 0.');
      setIsIssuing(false);
      return;
    }

    // GST Number
    const gstNumber = modifyData.gst_number ?? selectedItem.gst_number;
    if (!gstNumber || gstNumber.trim() === '') {
      setIssueError('GST Number is required.');
      setIsIssuing(false);
      return;
    }

    // Buyer Name
    const buyerName = modifyData.buyer_name ?? selectedItem.buyer_name;
    if (!buyerName || buyerName.trim() === '') {
      setIssueError('Buyer Name is required.');
      setIsIssuing(false);
      return;
    }

    // Buyer Email
    const buyerEmail = modifyData.buyer_email ?? selectedItem.buyer_email;
    if (!buyerEmail || buyerEmail.trim() === '') {
      setIssueError('Buyer Email is required.');
      setIsIssuing(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setIssueError('Enter a valid email address (must contain "@" and a domain).');
      setIsIssuing(false);
      return;
    }

    // Bill Number (optional in model, but you require it in UI)
    const billNumber = modifyData.bill_number ?? selectedItem.bill_number;
    if (!billNumber || billNumber.trim() === '') {
      setIssueError('Bill Number is required.');
      setIsIssuing(false);
      return;
    }
    if (billNumber.length > 50) {
      setIssueError('Bill number must be at most 50 characters.');
      setIsIssuing(false);
      return;
    }

    // Now build requestBody as before, using these variables
    const requestBody = {
      category_id: modifyData.category?.id ?? selectedItem.category.id,
      sub_category_id: modifyData.sub_category?.id ?? selectedItem.sub_category.id,
      name,
      serial_number: serialNumber,
      cost: costValue,
      quantity: quantityValue,
      gst_number: gstNumber,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      purchase_date: modifyData.purchase_date ?? selectedItem.purchase_date,
      bill_number: billNumber,
      remarks: modifyData.remarks ?? selectedItem.remarks,
    };

    const response = await fetch(`${API_URL}/items/${selectedItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),  // ✅ This is now clean
    });

        if (!response.ok) {
          const errorData = await response.json();

          if (Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map((err: any) => {
              const path = err.loc?.join('.') || 'field';
              return `${path}: ${err.msg}`;
            });
            const combinedMessage = messages.join(', ');
            setIssueError(combinedMessage || 'Failed to update item.');
            throw new Error(combinedMessage);
          } else if (typeof errorData.detail === 'string') {
            setIssueError(errorData.detail);
            throw new Error(errorData.detail);
          } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            const messages = Object.entries(errorData.detail).map(
              ([key, value]) => `${key}: ${value}`
            );
            const combinedMessage = messages.join(', ');
            setIssueError(combinedMessage);
            throw new Error(combinedMessage);
          } else {
            const fallbackMessage = `Update failed with status ${response.status}`;
            setIssueError(fallbackMessage);
            throw new Error(fallbackMessage);
          }
        }

    const updatedItem = await response.json();
    setItems(items => items.map(it => it.id === updatedItem.id ? updatedItem : it));
    setShowModifyPopup(false);
    setSuccessMessage(`Successfully updated ${updatedItem.name}`);
  } catch (error) {
    //console.error('Error updating item:', error);
    setIssueError(error instanceof Error ? error.message : 'Failed to update item.');
  } finally {
    setIsIssuing(false);
  }
};



  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedItem) return
    
    try {
      setIsIssuing(true)
      const response = await fetch(`${API_URL}/items/${selectedItem.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setItems(items => items.filter(it => it.id !== selectedItem.id))
      setShowDeletePopup(false)
      setSelectedItem(null)
      
      // Show success message
      setSuccessMessage(`Successfully deleted ${selectedItem.name}`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Error deleting item:', error)
      setIssueError('Failed to delete item. Please try again.')
    } finally {
      setIsIssuing(false)
    }
  }

  // Open popup for issue
  const handleIssue = (item: Item) => {
    setIssueItem(item)
    setIssueQuantity('')
    setIssueError('')
    setShowIssuePopup(true)
  }

  // Handle popup submit
  const handleIssueSubmit = async () => {
    if (!issueItem || isIssuing) return
    
    const available = parseInt(issueItem.quantity) || 0
    const requested = parseInt(issueQuantity)
    
    if (isNaN(requested) || requested <= 0) {
      setIssueError('Please enter a valid quantity.')
      return
    }
    if (requested > available) {
      setIssueError("You can't issue more than available quantity.")
      return
    }
    
    setIsIssuing(true)
    setIssueError('')
    
    try {
      // Make API call to issue the item
      const response = await fetch(`${API_URL}/items/${issueItem.id}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: requested,
          user_role: role,
          issue_date: new Date().toISOString(),
          remarks: `Issued ${requested} units to ${role}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const updatedItem = await response.json()
      
      // Update the local state with the response from backend
      setItems(items =>
        items.map(it =>
          it.id === issueItem.id
            ? { ...it, quantity: updatedItem.quantity || (available - requested).toString() }
            : it
        )
      )
      
      setShowIssuePopup(false)
      setIssueItem(null)
      setIssueQuantity('')
      setIssueError('')
      
      // Show success message
      setSuccessMessage(`Successfully issued ${requested} units of ${issueItem.name}`)
      setTimeout(() => setSuccessMessage(''), 5000) // Clear message after 5 seconds
      
    } catch (error) {
  console.error('Error issuing item:', error)
  if (error instanceof Error) {
    setIssueError(error.message)
  } else if (typeof error === 'string') {
    setIssueError(error)
  } else {
    setIssueError('Failed to issue item. Please try again.')
  }
} finally {
      setIsIssuing(false)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'from-red-500 to-pink-500'
      case 'faculty': return 'from-blue-500 to-cyan-500'
      case 'staff': return 'from-green-500 to-emerald-500'
      case 'student': return 'from-purple-500 to-indigo-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const getActionButton = (item: Item) => {
    const available = isItemAvailable(item)
    
    if (role === 'student') {
      return (
        <button
          onClick={() => available && handleIssue(item)}
          disabled={!available}
          className={`group relative px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${
            available 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer' 
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          <span className="relative z-10">
            {available ? 'Issue Request' : 'Unavailable'}
          </span>
          {available && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
        </button>
      )
    }

    if (role === 'faculty' || role === 'staff') {
      return (
        <button
          onClick={() => handleView(item)}
          className="group relative px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <span className="relative z-10">View Details</span>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      )
    }

    if (role === 'admin') {
      return (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleView(item)}
            className="group relative px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
          >
            View
          </button>
          <button
            onClick={() => handleModify(item.id)}
            className="group relative px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
          >
            Modify
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="group relative px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
          >
            Delete
          </button>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
          <div className="mt-4 text-white text-center font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }}></div>
      </div>

      {/* Issue Popup */}
      {showIssuePopup && issueItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative transform transition-all duration-300 scale-100">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setShowIssuePopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-indigo-700">Issue Request</h3>
            <div className="mb-3 text-gray-700">
              <span className="font-semibold">Item:</span> {issueItem.name}
            </div>
            <div className="mb-4 text-gray-700">
              <span className="font-semibold">Available:</span> {issueItem.quantity}
            </div>
            <input
              type="number"
              min="1"
              max={issueItem.quantity}
              value={issueQuantity}
              onChange={e => {
                setIssueQuantity(e.target.value)
                setIssueError('')
              }}
              placeholder="Enter quantity to issue"
              className="w-full p-3 border border-indigo-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {issueError && (
              <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 border border-red-200 rounded">{issueError}</div>
            )}
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                onClick={() => setShowIssuePopup(false)}
                disabled={isIssuing}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleIssueSubmit}
                disabled={isIssuing}
              >
                {isIssuing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Issuing...
                  </>
                ) : (
                  'Issue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Popup */}
      {showViewPopup && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setShowViewPopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-indigo-700">Item Details</h3>
            <div className="space-y-3 text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div><b>Name:</b> {selectedItem.name}</div>
                <div><b>Quantity:</b> {selectedItem.quantity}</div>
                <div><b>Serial Number:</b> {selectedItem.serial_number}</div>
                <div><b>Bill Number:</b> {selectedItem.bill_number}</div>
                <div><b>Cost:</b> {selectedItem.cost}</div>
                <div><b>GST Number:</b> {selectedItem.gst_number}</div>
                <div><b>Buyer Name:</b> {selectedItem.buyer_name}</div>
                <div><b>Buyer Email:</b> {selectedItem.buyer_email}</div>
                <div><b>Purchase Date:</b> {selectedItem.purchase_date}</div>
              </div>
              <div className="pt-2">
                <b>Remarks:</b> 
                <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                  {selectedItem.remarks || 'No remarks'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Popup */}
      {showModifyPopup && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative max-h-[90vh] flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setShowModifyPopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-yellow-600">Modify Item</h3>
            {/* Scrollable form area */}
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={modifyData.name || ''}
                  onChange={e => setModifyData({ ...modifyData, name: e.target.value })}
                  placeholder="Item Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.quantity || ''}
                    onChange={e => setModifyData({ ...modifyData, quantity: e.target.value })}
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.serial_number || ''}
                    onChange={e => setModifyData({ ...modifyData, serial_number: e.target.value })}
                    placeholder="Serial Number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.bill_number || ''}
                    onChange={e => setModifyData({ ...modifyData, bill_number: e.target.value })}
                    placeholder="Bill Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.cost || ''}
                    onChange={e => setModifyData({ ...modifyData, cost: e.target.value })}
                    placeholder="Cost"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.gst_number || ''}
                    onChange={e => setModifyData({ ...modifyData, gst_number: e.target.value })}
                    placeholder="GST Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.buyer_name || ''}
                    onChange={e => setModifyData({ ...modifyData, buyer_name: e.target.value })}
                    placeholder="Buyer Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={modifyData.buyer_email || ''}
                    onChange={e => setModifyData({ ...modifyData, buyer_email: e.target.value })}
                    placeholder="Buyer Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={
                      modifyData.purchase_date
                        ? modifyData.purchase_date.slice(0, 10)
                        : selectedItem.purchase_date
                        ? selectedItem.purchase_date.slice(0, 10)
                        : ''
                    }
                    onChange={e => setModifyData({ ...modifyData, purchase_date: e.target.value })}
                    placeholder="Purchase Date"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={modifyData.remarks || ''}
                  onChange={e => setModifyData({ ...modifyData, remarks: e.target.value })}
                  placeholder="Remarks"
                  rows={3}
                />
              </div>
            </div>
            {issueError && (
              <div className="text-red-500 text-sm mt-3 p-2 bg-red-50 border border-red-200 rounded">{issueError}</div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                onClick={() => setShowModifyPopup(false)}
                disabled={isIssuing}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleModifySubmit}
                disabled={isIssuing}
              >
                {isIssuing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {showDeletePopup && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setShowDeletePopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h3>
            <div className="mb-6 text-gray-700">
              <p>Are you sure you want to delete the following item?</p>
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="font-semibold">{selectedItem.name}</p>
                <p className="text-sm">Serial: {selectedItem.serial_number}</p>
                <p className="text-sm">Quantity: {selectedItem.quantity}</p>
              </div>
              <p className="mt-3 text-red-600 font-medium">This action cannot be undone.</p>
            </div>
            
            {issueError && (
              <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 border border-red-200 rounded">{issueError}</div>
            )}
            
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                onClick={() => setShowDeletePopup(false)}
                disabled={isIssuing}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleDeleteSubmit}
                disabled={isIssuing}
              >
                {isIssuing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')}
            className="ml-2 text-green-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent capitalize mb-2">
                {category || 'Category'}
              </h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleColor(role)} text-white shadow-lg`}>
                {role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Access` : 'Guest Access'}
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-lg' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-lg' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, serial number, or bill number..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-lg p-6 text-center">
            <div className="text-red-400 text-lg font-medium">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
            <div className="text-gray-400 text-lg">
              {searchTerm ? 'No matching items found.' : 'No items found in this category.'}
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedItems).map(([subCategory, subItems]) => (
            <div key={subCategory} className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 capitalize flex items-center flex-wrap gap-2">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {subCategory}
                </span>
                <div className="px-2 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300">
                  {subItems.length}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-400">
                    {subItems.filter(item => isItemAvailable(item)).length} Available
                  </span>
                  <span className="text-red-400">
                    {subItems.filter(item => !isItemAvailable(item)).length} Out of Stock
                  </span>
                </div>
              </h2>

              {viewMode === 'cards' ? (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subItems.map((item, index) => {
                    const availability = getAvailabilityStatus(item)
                    const available = isItemAvailable(item)
                    
                    return (
                      <div
                        key={item.id}
                        className={`group relative backdrop-blur-md border rounded-xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                          available 
                            ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:shadow-purple-500/10' 
                            : 'bg-red-900/10 border-red-500/20 hover:bg-red-900/15 opacity-75'
                        }`}
                      >
                        {/* Card gradient overlay */}
                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                          available 
                            ? 'bg-gradient-to-br from-purple-500/5 to-blue-500/5' 
                            : 'bg-gradient-to-br from-red-500/5 to-gray-500/5'
                        }`}></div>
                        
                        {/* Out of stock overlay */}
                        {!available && (
                          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-gray-900/20 rounded-xl"></div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              available 
                                ? 'text-white group-hover:text-purple-300' 
                                : 'text-gray-300 group-hover:text-red-300'
                            }`}>
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${availability.dotColor} ${
                                availability.status === 'Available' ? 'animate-pulse' : ''
                              }`}></div>
                              <span className={`text-xs font-medium ${availability.color}`}>
                                {availability.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Quantity:</span>
                              <span className={`font-medium ${
                                available ? 'text-white' : 'text-red-400'
                              }`}>
                                {item.quantity}
                                {!available && ' (Out of Stock)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Serial:</span>
                              <span className="text-white font-mono text-sm">{item.serial_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bill:</span>
                              <span className="text-white font-mono text-sm">{item.bill_number}</span>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            {getActionButton(item)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="text-left p-4 text-gray-300 font-semibold">Name</th>
                          <th className="text-left p-4 text-gray-300 font-semibold">Quantity</th>
                          <th className="text-left p-4 text-gray-300 font-semibold">Serial Number</th>
                          <th className="text-left p-4 text-gray-300 font-semibold">Bill Number</th>
                          <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                          <th className="text-left p-4 text-gray-300 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subItems.map((item, index) => {
                          const availability = getAvailabilityStatus(item)
                          const available = isItemAvailable(item)
                          
                          return (
                            <tr 
                              key={item.id} 
                              className={`border-b border-white/5 transition-all duration-300 group ${
                                available 
                                  ? 'hover:bg-white/5' 
                                  : 'hover:bg-red-900/5 opacity-75'
                              }`}
                            >
                              <td className={`p-4 transition-colors duration-300 ${
                                available 
                                  ? 'text-white group-hover:text-purple-300' 
                                  : 'text-gray-300 group-hover:text-red-300'
                              }`}>
                                {item.name}
                              </td>
                              <td className={`p-4 ${available ? 'text-gray-300' : 'text-red-400 font-medium'}`}>
                                {item.quantity}
                                {!available && ' (Out of Stock)'}
                              </td>
                              <td className="p-4 text-gray-300 font-mono text-sm">{item.serial_number}</td>
                              <td className="p-4 text-gray-300 font-mono text-sm">{item.bill_number}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${availability.dotColor} ${
                                    availability.status === 'Available' ? 'animate-pulse' : ''
                                  }`}></div>
                                  <span className={`text-sm font-medium ${availability.color}`}>
                                    {availability.status}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                {getActionButton(item)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}