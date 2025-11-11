import { useState } from "react"
import type { Instrument, UserRole } from "../types/dashboard"
import { API_URL } from "../constants/dashboard"

export const useInstrumentActions = (
  updateInstrument: (instrument: Instrument) => void,
  removeInstrument: (id: string, subcategoryId: number) => void,
  addRequest?: (request: any) => void
) => {
  const [isIssuing, setIsIssuing] = useState(false)
  const [issueError, setIssueError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleModifySubmit = async (selectedInstrument: Instrument, modifyData: Partial<Instrument>) => {
    if (!selectedInstrument) return false

    try {
      setIsIssuing(true)
      setIssueError("")

      // Validate required fields
      const name = modifyData.name ?? selectedInstrument.name
      if (!name || name.trim() === "") {
        setIssueError("Name is required.")
        return false
      }

      // Optimistic update - update UI immediately
      const optimisticInstrument = { ...selectedInstrument, ...modifyData }
      updateInstrument(optimisticInstrument)

      const requestBody = {
        category_id: modifyData.category?.id ?? selectedInstrument.category.id,
        sub_category_id: modifyData.sub_category?.id ?? selectedInstrument.sub_category.id,
        name,
        serial_number: modifyData.serial_number ?? selectedInstrument.serial_number,
        cost: modifyData.cost ?? selectedInstrument.cost,
        quantity: modifyData.quantity ?? selectedInstrument.quantity,
        gst_number: modifyData.gst_number ?? selectedInstrument.gst_number,
        buyer_name: modifyData.buyer_name ?? selectedInstrument.buyer_name,
        buyer_email: modifyData.buyer_email ?? selectedInstrument.buyer_email,
        purchase_date: modifyData.purchase_date ?? selectedInstrument.purchase_date,
        bill_number: modifyData.bill_number ?? selectedInstrument.bill_number,
        remarks: modifyData.remarks ?? selectedInstrument.remarks,
      }

      const response = await fetch(`${API_URL}/items/${selectedInstrument.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        updateInstrument(selectedInstrument)
        const errorData = await response.json()
        setIssueError(errorData.detail || "Failed to update item.")
        return false
      }

      const updatedItem = await response.json()
      // Update with actual server response
      updateInstrument(updatedItem)
      setSuccessMessage(`Successfully updated ${updatedItem.name}`)
      return true
    } catch (error) {
      // Revert optimistic update on error
      updateInstrument(selectedInstrument)
      setIssueError(error instanceof Error ? error.message : "Failed to update item.")
      return false
    } finally {
      setIsIssuing(false)
    }
  }

  const handleDeleteSubmit = async (selectedInstrument: Instrument) => {
    if (!selectedInstrument) return false

    try {
      setIsIssuing(true)
      
      // Optimistic update - remove from UI immediately
      removeInstrument(selectedInstrument.id, selectedInstrument.sub_category.id)

      const response = await fetch(`${API_URL}/items/${selectedInstrument.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        // Revert optimistic update on error - add item back
        updateInstrument(selectedInstrument)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSuccessMessage(`Successfully deleted ${selectedInstrument.name}`)
      return true
    } catch (error) {
      // Item already removed optimistically, add it back on error
      updateInstrument(selectedInstrument)
      setIssueError("Failed to delete item. Please try again.")
      return false
    } finally {
      setIsIssuing(false)
    }
  }

  const handleIssueSubmit = async (issueInstrument: Instrument, quantity: string, role: UserRole) => {
    if (!issueInstrument) return false

    const available = Number.parseInt(issueInstrument.quantity) || 0
    const requested = Number.parseInt(quantity)

    if (isNaN(requested) || requested <= 0) {
      setIssueError("Please enter a valid quantity.")
      return false
    }

    if (requested > available) {
      setIssueError("You can't request more than available quantity.")
      return false
    }

    setIsIssuing(true)
    setIssueError("")

    try {
      // Optimistic update - reduce quantity immediately
      const newQuantity = Math.max(0, available - requested)
      const optimisticInstrument = { ...issueInstrument, quantity: String(newQuantity) }
      updateInstrument(optimisticInstrument)

      const response = await fetch(`${API_URL}/issue-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          item_id: issueInstrument.id,
          quantity: requested,
          user_role: role,
          remarks: `Requested ${requested} units`,
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        updateInstrument(issueInstrument)
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const newRequest = await response.json()
      // Add to requests list if callback provided
      if (addRequest) {
        addRequest(newRequest)
      }

      setSuccessMessage(`Request sent for admin approval`)
      return true
    } catch (error) {
      // Revert optimistic update on error
      updateInstrument(issueInstrument)
      setIssueError(error instanceof Error ? error.message : "Failed to send request.")
      return false
    } finally {
      setIsIssuing(false)
    }
  }

  const clearMessages = () => {
    setIssueError("")
    setSuccessMessage("")
  }

  return {
    isIssuing,
    issueError,
    successMessage,
    handleModifySubmit,
    handleDeleteSubmit,
    handleIssueSubmit,
    clearMessages,
    setSuccessMessage,
  }
}