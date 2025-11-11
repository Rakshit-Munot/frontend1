import { useState, useMemo } from "react"
import type { Category, Subcategory, IssueRequest } from "../types/dashboard"
import { PAGE_SIZE } from "../constants/dashboard"
import { getItemName, formatUserDisplayName } from "../utils/dashboardUtils"

export const useSearch = (
  categories: Category[],
  subcategories: Subcategory[],
  requests: IssueRequest[]
) => {
  const [categorySearch, setCategorySearch] = useState("")
  const [subcategorySearches, setSubcategorySearches] = useState<Record<number, string>>({})
  const [requestSearch, setRequestSearch] = useState("")
  const [page, setPage] = useState(1)

  // Filter categories by search
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(categorySearch.toLowerCase())),
    [categories, categorySearch]
  )

  // Group subcategories by category
  const categoriesWithSubcategories = useMemo(() => {
    return filteredCategories.map((category) => ({
      ...category,
      subcategories: subcategories.filter((sub) => sub.category_id === category.id),
    }))
  }, [filteredCategories, subcategories])

  // Subcategory search
  const getFilteredSubcategories = (categoryId: number, subcategoriesList: Subcategory[]) => {
    const searchTerm = subcategorySearches[categoryId] || ""
    return subcategoriesList.filter((sub) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Requests filtering and pagination
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const itemName = getItemName(req.item)
      const userName = formatUserDisplayName(req.user, req.user_id)
      return (
        itemName.toLowerCase().includes(requestSearch.toLowerCase()) ||
        userName.toLowerCase().includes(requestSearch.toLowerCase())
      )
    })
  }, [requests, requestSearch])

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE)
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearCategorySearch = () => setCategorySearch("")
  
const clearSubcategorySearch = (categoryId: number) => {
  setSubcategorySearches((prev: Record<number, string>) => ({
    ...prev,
    [categoryId]: "",
  }))
}

const updateSubcategorySearch = (categoryId: number, value: string) => {
  setSubcategorySearches((prev: Record<number, string>) => ({
    ...prev,
    [categoryId]: value,
  }))
}

  return {
    categorySearch,
    setCategorySearch,
    subcategorySearches,
    requestSearch,
    setRequestSearch,
    page,
    setPage,
    filteredCategories,
    categoriesWithSubcategories,
    getFilteredSubcategories,
    filteredRequests,
    paginatedRequests,
    totalPages,
    clearCategorySearch,
    clearSubcategorySearch,
    updateSubcategorySearch,   // ✅ return this as its own thing
  }
}