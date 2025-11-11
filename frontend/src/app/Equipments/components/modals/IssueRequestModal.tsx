import React, { useState } from "react"
import { Package } from "lucide-react"
import type { Instrument, UserRole } from "../../types/dashboard"

interface IssueRequestModalProps {
  instrument: Instrument | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (quantity: string) => Promise<boolean>
  isSubmitting: boolean
  error: string
}

export const IssueRequestModal: React.FC<IssueRequestModalProps> = ({
  instrument,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [quantity, setQuantity] = useState("")

  React.useEffect(() => {
    if (isOpen) {
      setQuantity("")
    }
  }, [isOpen])

  if (!isOpen || !instrument) return null

  const handleSubmit = async () => {
    const success = await onSubmit(quantity)
    if (success) {
      onClose()
      setQuantity("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-500/20 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-purple-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Issue Request
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-purple-300">Instrument</label>
            <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-purple-300">Available Quantity</label>
            <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.quantity}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-purple-300">Request Quantity</label>
            <input
              type="number"
              min="1"
              max={instrument.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="Enter quantity"
            />
          </div>
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{error}</div>}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}