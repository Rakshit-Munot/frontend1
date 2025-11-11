import type { FinancialYear } from './types'

export function getFinancialYear(date: Date): FinancialYear {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  // Financial year April (4) to March (3)
  if (month >= 4) {
    return `${year}-${year + 1}` as const
  }
  return `${year - 1}-${year}` as const
}

export function listFinancialYears(fromYear: number, toYear?: number): FinancialYear[] {
  const end = toYear ?? new Date().getFullYear() + 1 // include current fy end
  const fYears: FinancialYear[] = []
  for (let y = fromYear; y < end; y++) {
    fYears.push(`${y}-${y + 1}` as const)
  }
  return fYears.reverse()
}

export function sanitizeAmount(input: string): number | null {
  const norm = input.replace(/[^0-9.]/g, '')
  if (!norm) return null
  const num = Number(norm)
  if (!isFinite(num)) return null
  return Math.round(num * 100) / 100
}

export function inferFileType(name: string): string {
  const lower = name.toLowerCase()
  if (/(png|jpg|jpeg|webp|gif)$/.test(lower)) return 'image'
  if (/(pdf)$/.test(lower)) return 'pdf'
  if (/(doc|docx)$/.test(lower)) return 'document'
  if (/(xls|xlsx)$/.test(lower)) return 'spreadsheet'
  return 'file'
}
