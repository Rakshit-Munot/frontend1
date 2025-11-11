import { promises as fs } from 'fs'
import path from 'path'
import type { BillRecord } from '../types'

const dataDir = path.join(process.cwd(), 'src', 'app', 'Dash', 'data')
const dataFile = path.join(dataDir, 'bills.json')

async function ensureFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.access(dataFile)
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf-8')
  }
}

export async function getAllBills(): Promise<BillRecord[]> {
  await ensureFile()
  const raw = await fs.readFile(dataFile, 'utf-8')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BillRecord[]) : []
  } catch {
    return []
  }
}

export async function addBill(bill: BillRecord): Promise<void> {
  const all = await getAllBills()
  all.unshift(bill)
  await fs.writeFile(dataFile, JSON.stringify(all, null, 2), 'utf-8')
}
