'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface SubCategory {
  id: string
  name: string
}

interface ValidationError {
  loc?: string[]
  msg: string
}

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

  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])

  const [addingCategory, setAddingCategory] = useState(false)
  const [addingSubCategory, setAddingSubCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')

  const [errors, setErrors] = useState<string[]>([])
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
        .then((res) => res.json())
        .then((data: SubCategory[]) => setSubCategories(data))
    }
  }, [formData.category_id])

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/categories`)
    const data: Category[] = await res.json()
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
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
        if (Array.isArray(data.detail)) {
          const formatted = (data.detail as ValidationError[]).map((err) => {
            const rawField = err.loc?.slice(2).join('.') || 'field'
            const prettyField = rawField
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())
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
    const data: Category = await res.json()
    if (res.ok) {
      const updated = [...categories, data]
      setCategories(updated)
      setFormData((prev) => ({ ...prev, category_id: data.id }))
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
      body: JSON.stringify({
        name: newSubCategory,
        category_id: formData.category_id,
      }),
    })
    const data: SubCategory = await res.json()
    if (res.ok) {
      const updated = [...subCategories, data]
      setSubCategories(updated)
      setFormData((prev) => ({ ...prev, sub_category_id: data.id }))
      setNewSubCategory('')
      setAddingSubCategory(false)
      showAlertCategory()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <Image
        src="/street.jpg"
        alt="Anime background"
        fill
        className="object-cover z-0"
        draggable={false}
      />
      <div className="w-full max-w-lg relative z-10">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl" />
        <div className="relative p-8 z-10">
          <h2 className="text-2xl font-bold text-center mb-6">Add Item</h2>
          {showSuccessAlert && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 transition-all duration-500 ease-in-out ${
                hideAlert ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              ✅ Item Added Successfully!
            </div>
          )}
          {showSuccessAlertC && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 transition-all duration-500 ease-in-out ${
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="text-sm text-blue-400 mt-1"
              >
                + Add new category
              </button>
              {addingCategory && (
                <div className="flex mt-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 p-1 text-black"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="ml-2 bg-green-600 px-2 rounded cursor-pointer"
                  >
                    Add
                  </button>
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
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingSubCategory(true)}
                className="text-sm text-blue-400 mt-1"
              >
                + Add new subcategory
              </button>
              {addingSubCategory && (
                <div className="flex mt-2">
                  <input
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    className="flex-1 p-1 text-black"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubCategory}
                    className="ml-2 bg-green-600 px-2 rounded"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {(
              [
                'name',
                'serial_number',
                'cost',
                'quantity',
                'gst_number',
                'buyer_name',
                'buyer_email',
                'purchase_date',
                'bill_number',
                'remarks',
              ] as (keyof typeof formData)[]
            ).map((field) => (
              <input
                key={field}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                type={field === 'purchase_date' ? 'date' : 'text'}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg placeholder-gray-300"
                required={field !== 'remarks'}
              />
            ))}

            {errors.map((error, i) => (
              <div key={i} className="bg-red-500 p-2 rounded">
                {error}
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded mt-2"
            >
              Add Item
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PurchaseForm
