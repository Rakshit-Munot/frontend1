// Client-side unsigned Cloudinary upload helper
// Requires env vars:
// - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
// - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (unsigned preset)

export interface CloudinaryUploadResult {
  asset_id?: string
  public_id?: string
  url?: string
  secure_url?: string
  resource_type?: string
  original_filename?: string
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const signRes = await fetch('/Dash/api/cloudinary/sign', { method: 'POST' })
  if (!signRes.ok) {
    throw new Error('Cloudinary sign failed')
  }
  const { cloudName, apiKey, signature, timestamp, folder } = await signRes.json()
  if (!cloudName || !apiKey || !signature || !timestamp) {
    throw new Error('Invalid Cloudinary signature response')
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  if (folder) formData.append('folder', folder)

  const res = await fetch(url, { method: 'POST', body: formData })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Cloudinary upload failed')
  }
  return (await res.json()) as CloudinaryUploadResult
}
