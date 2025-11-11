import { useState, useEffect } from "react"
import type { Category, Subcategory, IssueRequest, Instrument } from "../types/dashboard"
import { API_URL } from "../constants/dashboard"
import {
  listCategories,
  listSubcategories,
  listInstrumentsBySubcategory,
  prefetchInstruments,
  prefetchCategories,
  prefetchSubcategories,
  prefetchAdjacentSubcategory,
  readCachedCategoriesSync,
  readCachedSubcategoriesSync,
  readCachedInstrumentsSync,
} from "../services/instrumentsApi"

export const useDashboardData = (userRole?: string) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requests, setRequests] = useState<IssueRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [subcategoryInstruments, setSubcategoryInstruments] = useState<Record<number, Instrument[]>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Hydrate immediately from persistent caches (no flicker)
        const catsCached = readCachedCategoriesSync()
        if (catsCached && catsCached.length) setCategories(catsCached)
        const subsHydrated: Subcategory[] = []
        for (const c of catsCached || []) {
          const sc = readCachedSubcategoriesSync(c.id)
          if (sc && sc.length) subsHydrated.push(...sc)
        }
        if (subsHydrated.length) setSubcategories(subsHydrated)

        // 2) Warm categories cache and fetch fresh
        await prefetchCategories()
        const categoriesData = await listCategories()
        setCategories(categoriesData)

        // 3) Load subcategories fresh in parallel
        const subsArrays = await Promise.all(
          categoriesData.map((cat: Category) => listSubcategories(cat.id).catch(() => [] as Subcategory[]))
        )
        const allSubcategories: Subcategory[] = ([] as Subcategory[]).concat(...subsArrays)
        setSubcategories(allSubcategories)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not fetch data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (userRole === "admin") {
      setRequestsLoading(true)
      fetch(`${API_URL}/issue-requests/?status=pending`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setRequests)
        .catch(() => setRequests([]))
        .finally(() => setRequestsLoading(false))
    }
  }, [userRole])

  const fetchInstruments = async (subcategoryId: number) => {
    if (subcategoryInstruments[subcategoryId]) return

    try {
      // Hydrate from persistent immediately if present
      const cached = readCachedInstrumentsSync(subcategoryId)
      if (cached && cached.length) {
        setSubcategoryInstruments((prev) => ({ ...prev, [subcategoryId]: cached }))
      }
      const data = await listInstrumentsBySubcategory(subcategoryId)
      setSubcategoryInstruments((prev) => ({
        ...prev,
        [subcategoryId]: data,
      }))
      // Prefetch the next subcategory within the same category for instant navigation
      try {
        const subcat = subcategories.find((s) => s.id === subcategoryId)
        if (subcat) await prefetchAdjacentSubcategory(subcategories.filter(s => s.category_id === subcat.category_id), subcategoryId)
      } catch {}
    } catch (error) {
      setSubcategoryInstruments((prev) => ({
        ...prev,
        [subcategoryId]: [],
      }))
    }
  }

  const updateInstrument = (updatedInstrument: Instrument) => {
    setSubcategoryInstruments((prev) => {
      const subId = updatedInstrument.sub_category.id
      return {
        ...prev,
        [subId]: prev[subId]?.map((it) => (it.id === updatedInstrument.id ? updatedInstrument : it)) || [],
      }
    })
  }

  const removeInstrument = (instrumentId: string, subcategoryId: number) => {
    setSubcategoryInstruments((prev) => ({
      ...prev,
      [subcategoryId]: prev[subcategoryId]?.filter((it) => it.id !== instrumentId) || [],
    }))
  }

  const removeRequest = (requestId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  return {
    categories,
    subcategories,
    loading,
    error,
    requests,
    requestsLoading,
    subcategoryInstruments,
    fetchInstruments,
    updateInstrument,
    removeInstrument,
    removeRequest,
  }
}