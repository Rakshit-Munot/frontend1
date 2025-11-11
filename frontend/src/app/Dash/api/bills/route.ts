import { NextRequest, NextResponse } from 'next/server'
import { addBill, getAllBills } from '../../server/billsRepo'
import type { BillRecord } from '../../types'

// Simple admin gate using Auth cookie presence would need integration.
// For now, accept all POSTs; the UI already restricts to admin. You can harden this later.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const fy = url.searchParams.get('fy')
  const all = await getAllBills()
  if (!fy) return NextResponse.json(all)
  // Filter by FY on server if provided
  const filtered = all.filter((b) => {
    const d = new Date(b.uploadedAt)
    const year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1
    const fyStr = `${year}-${year + 1}`
    return fyStr === fy
  })
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BillRecord>
    // Basic validation
    if (!body.billNo || typeof body.billNo !== 'string') {
      return NextResponse.json({ error: 'billNo required' }, { status: 400 })
    }
    if (typeof body.billAmount !== 'number' || isNaN(body.billAmount)) {
      return NextResponse.json({ error: 'billAmount must be number' }, { status: 400 })
    }
    if (!body.fileUrl || typeof body.fileUrl !== 'string') {
      return NextResponse.json({ error: 'fileUrl required' }, { status: 400 })
    }

    const now = new Date()
    const rec: BillRecord = {
      id: body.id || `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      billNo: body.billNo,
      billAmount: body.billAmount,
      fileUrl: body.fileUrl,
      fileName: body.fileName || 'file',
      fileType: body.fileType || 'file',
      cloudinaryPublicId: body.cloudinaryPublicId,
      resourceType: body.resourceType,
      uploadedAt: body.uploadedAt || now.toISOString(),
    }

    await addBill(rec)
    return NextResponse.json({ ok: true, record: rec })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 })
  }
}
