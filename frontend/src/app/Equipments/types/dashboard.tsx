export interface Category {
  id: number
  name: string
}

export interface Subcategory {
  id: number
  name: string
  category_id: number
}

export interface Instrument {
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

export interface IssueRequest {
  id: number
  item: { id: number; name: string } | number
  user?: { id: number; name?: string; email?: string }
  user_id: number
  quantity: number
  status: string
  created_at: string
  approved_at?: string
  return_by?: string
  remarks?: string
  submission_status?: "not_required" | "pending" | "submitted"
  submitted_at?: string
}

export type UserRole = "admin" | "faculty" | "staff" | "student" | "guest"

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
}

export interface AuthContextType {
  user: User | null
}

export interface AvailabilityStatus {
  status: string
  color: string
  dotColor: string
}