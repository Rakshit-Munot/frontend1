import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  // You can customize folder; keep predictable location
  const paramsToSign = `folder=bills&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: 'bills',
  })
}
