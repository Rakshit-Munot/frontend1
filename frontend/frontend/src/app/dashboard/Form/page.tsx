// 'use client'

// import { useState } from 'react'

// const API_URL = 'http://localhost:8000/instruments'

// const PurchaseForm = () => {
//   const [formData, setFormData] = useState({
//     category: '',
//     name: '',
//     serial_number: '',
//     cost: '',
//     quantity: '',
//     gst_number: '',
//     buyer_name: '',
//     buyer_email: '',
//     purchase_date: '',
//     bill_number: '',
//     remarks: '',
//   })

//   const [errors, setErrors] = useState<string[]>([])
//   const [success, setSuccess] = useState(false)
//   const [showSuccessAlert, setShowSuccessAlert] = useState(false)
//   const [hideAlert, setHideAlert] = useState(false)

//   const showAlert = () => {
//     setShowSuccessAlert(true)
//     setHideAlert(false)

//     setTimeout(() => setHideAlert(true), 2500)
//     setTimeout(() => setShowSuccessAlert(false), 3000)
//   }

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setErrors([])
//     setSuccess(false)

//     try {
//       const response = await fetch(`${API_URL}/items`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       })

//       const data = await response.json()
//       console.log('Server response:', data)

//       if (response.ok) {
//         setSuccess(true)
//         showAlert()
//         setFormData({
//           category: '',
//           name: '',
//           serial_number: '',
//           cost: '',
//           quantity: '',
//           gst_number: '',
//           buyer_name: '',
//           buyer_email: '',
//           purchase_date: '',
//           bill_number: '',
//           remarks: '',
//         })
//       } else {
//         const tmpErrors: string[] = []

//         if (data.detail) {
//           if (Array.isArray(data.detail)) {
//             data.detail.forEach((err: any) => {
//               if (err?.msg && err?.loc) {
//                 // Grab the last part of the loc path (e.g. "gst_number")
//                 const field = err.loc[err.loc.length - 1]
//                 tmpErrors.push(`${field}: ${err.msg}`)
//               } else {
//                 tmpErrors.push(JSON.stringify(err))
//               }
//             })
//           } else if (typeof data.detail === 'string') {
//             tmpErrors.push(data.detail)
//           }
//         }
//          else {
//           for (const [key, value] of Object.entries(data)) {
//             if (Array.isArray(value)) {
//               value.forEach((val) => {
//                 if (typeof val === 'object' && val !== null && 'msg' in val) {
//                   tmpErrors.push(`${key}: ${(val as any).msg}`)
//                 } else {
//                   tmpErrors.push(`${key}: ${val}`)
//                 }
//               })
//             } else if (typeof value === 'object' && value !== null && 'msg' in value) {
//               tmpErrors.push(`${key}: ${(value as any).msg}`)
//             } else {
//               tmpErrors.push(`${key}: ${value}`)
//             }
//           }
//         }

//         setErrors(tmpErrors)
//       }
//     } catch {
//       setErrors(['Could not connect to server.'])
//     }
//   }

//   return (
//     <>
//       {showSuccessAlert && (
//         <div
//           className={`fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transition-all duration-500 ${
//             hideAlert ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'
//           }`}
//         >
//           Item added successfully!
//         </div>
//       )}
//       <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
//         <img
//           src="/street.jpg"
//           alt="Anime background"
//           className="absolute inset-0 w-full h-full object-cover z-0"
//           draggable={false}
//         />
//         <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
//           <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden"></div>
//           <div className="relative p-8 z-10 w-full">
//             <div className="text-center mb-8">
//               <h2 className="text-3xl font-bold text-gray-900 drop-shadow">Add Item</h2>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {Object.entries(formData).map(([field, value]) => {
//                 if (field === 'category') {
//                   return (
//                     <select
//                       key={field}
//                       name={field}
//                       value={value}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-4 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
//                     >
//                       <option value="" disabled>
//                         Select Category
//                       </option>
//                       <option value="resistors">Resistors</option>
//                       <option value="ics">ICs</option>
//                       <option value="capacitors">Capacitors</option>
//                       {/* Add more categories if needed */}
//                     </select>
//                   )
//                 }

//                 return (
//                   <input
//                     key={field}
//                     name={field}
//                     value={value}
//                     onChange={handleChange}
//                     placeholder={`Enter ${field.replace(/_/g, ' ')}`}
//                     type={field === 'purchase_date' ? 'date' : 'text'}
//                     className="w-full pl-4 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
//                     required={field !== 'remarks'}
//                   />
//                 )
//               })}

//               {errors.map((error, index) => (
//                 <div
//                   key={`error_${index}`}
//                   className="p-3 bg-red-500/50 text-red-300 border border-red-900 rounded-lg text-sm"
//                 >
//                   {error}
//                 </div>
//               ))}

//               <button
//                 type="submit"
//                 className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-colors"
//               >
//                 Add Item
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

// export default PurchaseForm
'use client'

import { useEffect, useState } from 'react'

const API_URL = 'https://backend-4-x6ud.onrender.com/instruments'

const PurchaseForm = () => {
  const [formData, setFormData] = useState({
    category_id: '',
    sub_category_id: '',
    name: '',
    serial_number: '',
    cost: '',
    quantity: '',
    gst_number: '',
    buyer_name: '',
    buyer_email: '',
    purchase_date: '',
    bill_number: '',
    remarks: '',
  })

  const [categories, setCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])

  const [addingCategory, setAddingCategory] = useState(false)
  const [addingSubCategory, setAddingSubCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')

  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showSuccessAlertC, setShowSuccessAlertC] = useState(false)
  const [hideAlert, setHideAlert] = useState(false)
  const [hideAlertC, setHideAlertC] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.category_id) {
      fetch(`${API_URL}/subcategories?category_id=${formData.category_id}`)
        .then(res => res.json())
        .then(data => setSubCategories(data))
    }
  }, [formData.category_id])

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/categories`)
    const data = await res.json()
    setCategories(data)
  }

  const showAlert = () => {
    setShowSuccessAlert(true)
    setHideAlert(false)
    setTimeout(() => setHideAlert(true), 2500)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  const showAlertCategory = () => {
    setShowSuccessAlertC(true)
    setHideAlertC(false)
    setTimeout(() => setHideAlertC(true), 2500)
    setTimeout(() => setShowSuccessAlertC(false), 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tmpErrors: string[] = []
    if (!formData.category_id) tmpErrors.push('Please select a category.')
    if (!formData.sub_category_id) tmpErrors.push('Please select a subcategory.')

    if (tmpErrors.length > 0) {
      setErrors(tmpErrors)
    return
    }
    setErrors([])
    setSuccess(false)

    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        showAlert()
        setFormData({
          category_id: '',
          sub_category_id: '',
          name: '',
          serial_number: '',
          cost: '',
          quantity: '',
          gst_number: '',
          buyer_name: '',
          buyer_email: '',
          purchase_date: '',
          bill_number: '',
          remarks: '',
        })
      } else {
        let formatted: string[] = []
        if (Array.isArray(data.detail)) {
          formatted = data.detail.map((err: any) => {
            const rawField = err.loc?.slice(2).join('.') || 'field'
            const prettyField = rawField.replace(/_/g, ' ').replace(/\b\w/g,(l:string) => l.toUpperCase())
            return `${prettyField}: ${err.msg}`
          })
        setErrors(formatted)
      } else if (typeof data.detail === 'string') {
        setErrors([data.detail])
      } else {
        setErrors(['An unknown error occurred.'])
      }

      }
    } catch {
      setErrors(['Could not connect to server.'])
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    })
    const data = await res.json()
    if (res.ok) {
      const updated = [...categories, data]
      setCategories(updated)
      setFormData(prev => ({ ...prev, category_id: data.id }))
      setNewCategory('')
      setAddingCategory(false)
      showAlertCategory()
    }
  }

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !formData.category_id) return
    const res = await fetch(`${API_URL}/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubCategory, category_id: formData.category_id }),
    })
    const data = await res.json()
    if (res.ok) {
      const updated = [...subCategories, data]
      setSubCategories(updated)
      setFormData(prev => ({ ...prev, sub_category_id: data.id }))
      setNewSubCategory('')
      setAddingSubCategory(false)
      showAlertCategory()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <img
        src="/street.jpg"
        alt="Anime background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        draggable={false}
      />
      <div className="w-full max-w-lg relative z-10">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl" />
        <div className="relative p-8 z-10">
          <h2 className="text-2xl font-bold text-center mb-6">Add Item</h2>
          {showSuccessAlert && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50
                transition-all duration-500 ease-in-out ${
                  hideAlert ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`}
            >
              ✅ Item Added Successfully!
            </div>
          )}
          {showSuccessAlertC && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50
                transition-all duration-500 ease-in-out ${
                  hideAlertC ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`}
            >
              ✅ Category Added Successfully!
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full p-2 rounded text-black"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setAddingCategory(true)} className="text-sm text-blue-400 mt-1">+ Add new category</button>
              {addingCategory && (
                <div className="flex mt-2">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 p-1 text-black" />
                  <button type="button" onClick={handleAddCategory} className="ml-2 bg-green-600 px-2 rounded cursor-pointer">Add</button>
                </div>
              )}
            </div>

            <div>
              <label>Subcategory</label>
              <select
                name="sub_category_id"
                value={formData.sub_category_id}
                onChange={handleChange}
                className="w-full p-2 rounded text-black"
              >
                <option value="">Select subcategory</option>
                {subCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setAddingSubCategory(true)} className="text-sm text-blue-400 mt-1">+ Add new subcategory</button>
              {addingSubCategory && (
                <div className="flex mt-2">
                  <input value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} className="flex-1 p-1 text-black" />
                  <button type="button" onClick={handleAddSubCategory} className="ml-2 bg-green-600 px-2 rounded">Add</button>
                </div>
              )}
            </div>

            {['name', 'serial_number', 'cost', 'quantity', 'gst_number', 'buyer_name', 'buyer_email', 'purchase_date', 'bill_number', 'remarks'].map(field => (
              <input
                key={field}
                name={field}
                value={(formData as any)[field]}
                onChange={handleChange}
                placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                type={field === 'purchase_date' ? 'date' : 'text'}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg placeholder-gray-300"
                required={field !== 'remarks'}
              />
            ))}

            {errors.map((error, i) => (
              <div key={i} className="bg-red-500 p-2 rounded">{error}</div>
            ))}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded mt-2"
            >Add Item</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PurchaseForm
