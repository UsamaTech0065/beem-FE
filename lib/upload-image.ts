/**
 * Browser-side image upload. A phone photo is 3 to 12 MB; it is redrawn to a
 * sensible size first, which keeps uploads quick and under the server's limit.
 */

const JPEG_QUALITY = 0.86

export class UploadError extends Error {}

/** Redraws the image no larger than `maxEdge` on its long side. GIFs pass through so they keep moving. */
export async function downsizeImage(file: File, maxEdge: number): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new UploadError('Choose a photo (JPEG, PNG, WebP or GIF).')
  if (file.type === 'image/gif') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new UploadError('That file could not be read as an image.')
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext('2d')
  if (!context) throw new UploadError('This browser cannot prepare images for upload.')
  // JPEG has no transparency; without this a cut-out PNG turns black.
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new UploadError('This browser cannot prepare images for upload.')
  return blob
}

/** Uploads a photo and answers its /media/<id> address. */
export async function uploadImage(file: File, maxEdge: number): Promise<string> {
  const blob = await downsizeImage(file, maxEdge)

  const form = new FormData()
  form.set('file', blob, 'upload')
  const response = await fetch('/api/media', { method: 'POST', body: form }).catch(() => null)

  const payload = (await response?.json().catch(() => null)) as { url?: string; message?: string } | null
  if (!response?.ok || !payload?.url) throw new UploadError(payload?.message ?? 'Upload failed. Try again.')
  return payload.url
}
