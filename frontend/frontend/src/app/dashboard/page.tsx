'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PurchaseForm from './Form/page'
import { useAuth } from '../AuthContext'

const API_URL = 'https://backend-4-x6ud.onrender.com/instruments/categories'

interface Category {
  id: number
  name: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error('Failed to load categories')
        const data = await res.json()
        setCategories(data)
      } catch (err) {
        setError('Could not fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Instrument Categories</h1>

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
