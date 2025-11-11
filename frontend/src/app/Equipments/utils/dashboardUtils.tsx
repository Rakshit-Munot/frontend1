import type { Instrument, UserRole, AvailabilityStatus } from "../types/dashboard"
import { ROLE_COLORS } from "../constants/dashboard"

export const isItemAvailable = (item: Instrument): boolean => {
  const quantity = Number.parseInt(item.quantity) || 0
  return quantity > 0
}

export const getAvailabilityStatus = (item: Instrument): AvailabilityStatus => {
  const quantity = Number.parseInt(item.quantity) || 0
  if (quantity === 0) {
    return { status: "Not Available", color: "text-red-400", dotColor: "bg-red-400" }
  } else if (quantity <= 5) {
    return { status: "Low Stock", color: "text-yellow-400", dotColor: "bg-yellow-400" }
  } else {
    return { status: "Available", color: "text-green-400", dotColor: "bg-green-400" }
  }
}

export const getRoleColor = (role: UserRole): string => {
  return ROLE_COLORS[role] || "from-gray-500 to-slate-500"
}

export const formatUserDisplayName = (user: any, userId: number): string => {
  if (user && user.name) return user.name
  if (user && user.email) return user.email
  return `User ${userId}`
}

export const getItemName = (item: any): string => {
  if (typeof item === "object" && item?.name) return item.name
  return String(item)
}