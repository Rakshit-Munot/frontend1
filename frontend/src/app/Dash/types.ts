export type FinancialYear = `${number}-${number}`

export interface BillRecord {
  id: string
  billNo: string
  billAmount: number
  fileUrl: string
  fileName: string
  fileType: string
  originalFilename?: string
  cloudinaryPublicId?: string
  resourceType?: 'image' | 'video' | 'raw' | string
  uploadedAt: string // ISO date
  comment?: string
}
