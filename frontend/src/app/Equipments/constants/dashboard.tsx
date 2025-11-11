import { Package, Clock, Layers } from "lucide-react"
import type { UserRole } from "../types/dashboard"

export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/instruments`

export const PAGE_SIZE = 10

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "from-red-500 to-pink-500",
  faculty: "from-blue-500 to-cyan-500",
  staff: "from-green-500 to-emerald-500",
  student: "from-purple-500 to-indigo-500",
  guest: "from-gray-500 to-slate-500",
}

export const STATS_CONFIG = [
  { label: "Total Categories", icon: Package, color: "text-primary" },
  { label: "Total Subcategories", icon: Layers, color: "text-blue-600" },
  { label: "Pending Requests", icon: Clock, color: "text-amber-600" },
]