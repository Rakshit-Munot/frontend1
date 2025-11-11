import React from "react"
import { Eye } from "lucide-react"
import type { Instrument } from "../../types/dashboard"

interface ViewInstrumentModalProps {
  instrument: Instrument | null
  isOpen: boolean
  onClose: () => void
}

export const ViewInstrumentModal: React.FC<ViewInstrumentModalProps> = ({
  instrument,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !instrument) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-500/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Instrument Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-300">Name</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Serial Number</label>
              <p className="text-white bg-slate-700/50 p-2 rounded font-mono">{instrument.serial_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Category</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.category.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Subcategory</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.sub_category.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Quantity</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.quantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Cost</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">₹{instrument.cost}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">GST Number</label>
              <p className="text-white bg-slate-700/50 p-2 rounded font-mono">{instrument.gst_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Bill Number</label>
              <p className="text-white bg-slate-700/50 p-2 rounded font-mono">{instrument.bill_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Buyer Name</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.buyer_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Buyer Email</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.buyer_email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-300">Purchase Date</label>
              <p className="text-white bg-slate-700/50 p-2 rounded">{instrument.purchase_date}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-purple-300">Remarks</label>
            <p className="text-white bg-slate-700/50 p-2 rounded min-h-[60px]">
              {instrument.remarks || "No remarks"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}