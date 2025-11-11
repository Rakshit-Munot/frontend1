import React from "react"
import type { User, UserRole } from "../types/dashboard"
import { getRoleColor } from "../utils/dashboardUtils"
import { ShoppingCart } from "lucide-react"

interface DashboardHeaderProps {
  user: User | null
  role: UserRole
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, role }) => {
  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between w-full">

          {/* Left Section — Welcome + Role */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <div>
              <p className="text-gray-400 text-sm whitespace-nowrap">
                Welcome,{" "}
                <span
                  className={`font-semibold bg-gradient-to-r ${getRoleColor(role)} bg-clip-text text-transparent`}
                >
                  {user?.username || (role === "guest" ? "Guest User" : "User")}
                </span>
              </p>
              <div
                className={`mt-1 inline-block px-3 py-1 bg-gradient-to-r ${getRoleColor(
                  role
                )} rounded-full shadow-md`}
              >
                <span className="text-white text-xs uppercase font-semibold tracking-wide">{role}</span>
              </div>
            </div>
          </div>

          {/* Center Section — Perfectly Centered Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-center whitespace-nowrap">
              Instruments
            </h1>
          </div>

          {/* Right Section — Shopping Cart Icon */}
          <div className="flex items-center justify-end min-w-[180px]">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
