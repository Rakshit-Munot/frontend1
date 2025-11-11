import { useEffect, useCallback } from "react"
import type { Instrument, IssueRequest } from "../types/dashboard"

interface UseRealtimeUpdatesProps {
  updateInstrument: (instrument: Instrument) => void
  removeInstrument: (id: string, subcategoryId: number) => void
  removeRequest: (requestId: number) => void
  addRequest: (request: IssueRequest) => void
}

export const useRealtimeUpdates = ({
  updateInstrument,
  removeInstrument,
  removeRequest,
  addRequest
}: UseRealtimeUpdatesProps) => {
  
  // Optimistic update for instrument modifications
  const optimisticUpdateInstrument = useCallback((instrument: Instrument, updates: Partial<Instrument>) => {
    const optimisticInstrument = { ...instrument, ...updates }
    updateInstrument(optimisticInstrument)
    return optimisticInstrument
  }, [updateInstrument])

  // Optimistic update for quantity changes after issue requests
  const optimisticUpdateQuantity = useCallback((instrument: Instrument, requestedQuantity: number) => {
    const currentQuantity = parseInt(instrument.quantity) || 0
    const newQuantity = Math.max(0, currentQuantity - requestedQuantity)
    const updatedInstrument = { ...instrument, quantity: String(newQuantity) }
    updateInstrument(updatedInstrument)
    return updatedInstrument
  }, [updateInstrument])

  // WebSocket connection for real-time updates (optional)
  useEffect(() => {
    // Implement WebSocket connection if your backend supports it
    // const ws = new WebSocket('ws://localhost:8000/ws/dashboard')
    // 
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data)
    //   switch (data.type) {
    //     case 'instrument_updated':
    //       updateInstrument(data.instrument)
    //       break
    //     case 'instrument_deleted':
    //       removeInstrument(data.instrumentId, data.subcategoryId)
    //       break
    //     case 'request_created':
    //       addRequest(data.request)
    //       break
    //   }
    // }
    // 
    // return () => ws.close()
  }, [updateInstrument, removeInstrument, removeRequest, addRequest])

  return {
    optimisticUpdateInstrument,
    optimisticUpdateQuantity
  }
}