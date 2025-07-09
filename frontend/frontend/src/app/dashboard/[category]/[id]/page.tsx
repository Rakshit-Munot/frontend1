// 'use client'

// import { useParams, useRouter } from 'next/navigation'
// import { useEffect, useState } from 'react'

// type Item = {
//   id: string
//   name: string
//   serial_number: string
//   cost: string
//   quantity: string
//   gst_number: string
//   buyer_name: string
//   buyer_email: string
//   purchase_date: string
//   bill_number: string
//   remarks: string
//   category: { id: number; name: string }
//   sub_category: { id: number; name: string }
// }

// const API_URL = 'http://localhost:8000/instruments/items'

// export default function ItemDetailPage() {
//   const { id } = useParams()
//   const router = useRouter()
//   const [item, setItem] = useState<Item | null>(null)
//   const [editing, setEditing] = useState(false)
//   const [formData, setFormData] = useState<Partial<Item>>({})
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [validationErrors, setValidationErrors] = useState<string[]>([])
//   const [saving, setSaving] = useState(false)
//   const [deleting, setDeleting] = useState(false)
//   const [showErrorBox, setShowErrorBox] = useState(false)
//   const [successMessage, setSuccessMessage] = useState('')
//   const [showSuccessBox, setShowSuccessBox] = useState(false)


//   useEffect(() => {
//     if (error || validationErrors.length > 0) {
//       setShowErrorBox(true)
//     }
//   }, [error, validationErrors])

//   useEffect(() => {
//     if (successMessage) {
//       setShowSuccessBox(true)
//       const timer = setTimeout(() => {
//         setShowSuccessBox(false)
//         setSuccessMessage('')
//       }, 3000)
//       return () => clearTimeout(timer)
//     }
//   }, [successMessage])


//   useEffect(() => {
//     if (!id) return

//     const fetchItem = async () => {
//       try {
//         const res = await fetch(`${API_URL}/${id}`)
//         if (!res.ok) throw new Error('Item not found')
//         const data = await res.json()
//         setItem(data)
//         setFormData(data)
//       } catch (err) {
//         console.error('Fetch error:', err)
//         setError('Could not load item details')
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchItem()
//   }, [id])

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({ ...prev, [name]: value }))
//   }

//   const handleSave = async () => {
//     if (!id) return
//     setSaving(true)
//     setValidationErrors([])

//     try {
//       const res = await fetch(`${API_URL}/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       })

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null)

//         let errors: string[] = []

//         if (Array.isArray(errorData?.detail)) {
//           errors = errorData.detail.map(
//             (e: any) => `${e.loc?.join('.') || 'field'} - ${e.msg}`
//           )
//         } else if (typeof errorData?.detail === 'string') {
//           errors = [errorData.detail]
//         } else {
//           errors = ['An unknown error occurred.']
//         }

//         setValidationErrors(errors)
//         return
//       }

//       const updated = await res.json()
//       setItem(updated)
//       setEditing(false)
//       setSuccessMessage('Saved successfully!')
//     } catch (err) {
//       console.error('Save error:', err)
//       setValidationErrors(['An unexpected error occurred.'])
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleDelete = async () => {
//     const confirmed = window.confirm('Are you sure you want to delete this item?')
//     if (!confirmed || !id) return

//     setDeleting(true)
//     try {
//       const res = await fetch(`${API_URL}/${id}`, {
//         method: 'DELETE',
//       })
//       if (!res.ok) throw new Error('Failed to delete')
//       setSuccessMessage('Deleted successfully!')
//       router.replace(`/dashboard/${item?.category}`)
//     } catch (err) {
//       console.error('Delete error:', err)
//       alert('Error deleting item')
//     } finally {
//       setDeleting(false)
//     }
//   }

//   if (loading) return <div className="p-6">Loading...</div>
//   if (!item) return null

//   return (
//     <>
//       {(error || validationErrors.length > 0) && (
//         <div
//           className={`
//             fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
//             bg-red-100 border border-red-400 text-red-700 p-6 rounded shadow-lg z-50 max-w-md w-full
//             transition-opacity duration-500 ${showErrorBox ? 'opacity-100' : 'opacity-0'}
//           `}
//         >
//           <div className="flex justify-between items-start mb-2">
//             <div className="font-semibold text-lg">Error</div>
//             <button
//               className="text-red-600 hover:text-red-800 text-xl leading-none"
//               onClick={() => {
//                 setError('')
//                 setValidationErrors([])
//                 setShowErrorBox(false)
//               }}
//             >
//               &times;
//             </button>
//           </div>

//           {error && <p className="mb-2">{error}</p>}

//           {validationErrors.length > 0 && (
//             <ul className="list-disc list-inside text-sm space-y-1">
//               {validationErrors.map((msg, idx) => (
//                 <li key={idx}>{msg}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//       {successMessage && (
//       <div
//         className={`
//           fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
//           bg-green-100 border border-green-400 text-green-700 p-6 rounded shadow-lg z-50 max-w-md w-full
//           transition-opacity duration-500 ${showSuccessBox ? 'opacity-100' : 'opacity-0'}
//         `}
//       >
//         <div className="flex justify-between items-start mb-2">
//           <div className="font-semibold text-lg">Success</div>
//           <button
//             className="text-green-600 hover:text-green-800 text-xl leading-none"
//             onClick={() => {
//               setShowSuccessBox(false)
//               setSuccessMessage('')
//             }}
//           >
//             &times;
//           </button>
//         </div>
//         <p>{successMessage}</p>
//       </div>
//     )}
//       <div className="p-6 space-y-4">
//         <h1 className="text-2xl font-bold mb-4">
//           {editing ? (
//             <input
//               name="name"
//               value={formData.name || ''}
//               onChange={handleChange}
//               className="border p-1 rounded w-full"
//             />
//           ) : (
//             item.name
//           )}
//         </h1>

//         {[
//           'serial_number',
//           'cost',
//           'quantity',
//           'gst_number',
//           'buyer_name',
//           'buyer_email',
//           'purchase_date',
//           'bill_number',
//         ].map(field => (
//           <p key={field}>
//             <strong>{field.replace(/_/g, ' ')}:</strong>{' '}
//             {editing ? (
//               <input
//                 name={field}
//                 value={(formData as any)[field] || ''}
//                 onChange={handleChange}
//                 className="border p-1 rounded"
//               />
//             ) : (
//               (item as any)[field]
//             )}
//           </p>
//         ))}

//         <p>
//           <strong>Remarks:</strong>{' '}
//           {editing ? (
//             <textarea
//               name="remarks"
//               value={formData.remarks || ''}
//               onChange={handleChange}
//               className="border p-1 rounded w-full"
//             />
//           ) : (
//             item.remarks || 'N/A'
//           )}
//         </p>

//         <div className="mt-4 flex flex-wrap gap-4">
//           {editing ? (
//             <>
//               <button
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//               >
//                 {saving ? 'Saving...' : 'Save'}
//               </button>
//               <button
//                 onClick={() => setEditing(false)}
//                 className="px-4 py-2 bg-gray-400 text-white rounded"
//               >
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={() => setEditing(true)}
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               Edit
//             </button>
//           )}

//           <button
//             onClick={handleDelete}
//             disabled={deleting}
//             className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//           >
//             {deleting ? 'Deleting...' : 'Delete'}
//           </button>
//         </div>
//       </div>
//     </>
//   )
// }
