import React, { useState } from "react"
import type { Instrument } from "../../types/dashboard"

interface ModifyInstrumentModalProps {
  instrument: Instrument | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (modifyData: Partial<Instrument>) => Promise<boolean>
  isSubmitting: boolean
  error: string
}

export const ModifyInstrumentModal: React.FC<ModifyInstrumentModalProps> = ({
  instrument,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [modifyData, setModifyData] = useState<Partial<Instrument>>({})

  React.useEffect(() => {
    if (instrument && isOpen) {
      setModifyData({})
    }
  }, [instrument, isOpen])

  if (!isOpen || !instrument) return null

  const handleSubmit = async () => {
    const success = await onSubmit(modifyData)
    if (success) {
      onClose()
      setModifyData({})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-500/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-purple-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modify Instrument
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-300">Name</label>
              <input
                type="text"
                value={modifyData.name || instrument.name}
                onChange={(e) => setModifyData({ ...modifyData, name: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Serial Number</label>
              <input
                type="text"
                value={modifyData.serial_number || instrument.serial_number}
                onChange={(e) => setModifyData({ ...modifyData, serial_number: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Quantity</label>
              <input
                type="number"
                min="0"
                value={modifyData.quantity || instrument.quantity}
                onChange={(e) => setModifyData({ ...modifyData, quantity: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Cost</label>
              <input
                type="text"
                value={modifyData.cost || instrument.cost}
                onChange={(e) => setModifyData({ ...modifyData, cost: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">GST Number</label>
              <input
                type="text"
                value={modifyData.gst_number || instrument.gst_number}
                onChange={(e) => setModifyData({ ...modifyData, gst_number: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Bill Number</label>
              <input
                type="text"
                value={modifyData.bill_number || instrument.bill_number}
                onChange={(e) => setModifyData({ ...modifyData, bill_number: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Buyer Name</label>
              <input
                type="text"
                value={modifyData.buyer_name || instrument.buyer_name}
                onChange={(e) => setModifyData({ ...modifyData, buyer_name: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Buyer Email</label>
              <input
                type="email"
                value={modifyData.buyer_email || instrument.buyer_email}
                onChange={(e) => setModifyData({ ...modifyData, buyer_email: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Purchase Date</label>
              <input
                type="date"
                value={modifyData.purchase_date || instrument.purchase_date}
                onChange={(e) => setModifyData({ ...modifyData, purchase_date: e.target.value })}
                className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-purple-300">Remarks</label>
            <textarea
              value={modifyData.remarks || instrument.remarks}
              onChange={(e) => setModifyData({ ...modifyData, remarks: e.target.value })}
              className="w-full p-2 bg-slate-700/50 border border-purple-500/20 rounded text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent min-h-[80px]"
              placeholder="Enter remarks"
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Instrument"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}