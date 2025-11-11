import React from "react"
import type { Instrument } from "../../types/dashboard"

interface DeleteInstrumentModalProps {
  instrument: Instrument | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<boolean>
  isDeleting: boolean
  error: string
}

export const DeleteInstrumentModal: React.FC<DeleteInstrumentModalProps> = ({
  instrument,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  error,
}) => {
  if (!isOpen || !instrument) return null

  const handleConfirm = async () => {
    const success = await onConfirm()
    if (success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-red-900 border border-red-500/20 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-red-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Instrument
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold mb-2">Are you sure?</p>
            <p className="text-gray-400 text-sm">
              This will permanently delete{" "}
              <span className="font-semibold text-white">"{instrument.name}"</span>. This action cannot be
              undone.
            </p>
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
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}