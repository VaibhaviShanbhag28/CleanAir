// frontend/src/lib/storage.ts
// Cloudinary upload — completely free, no credit card

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cleanair_uploads'

export type UploadResult = {
  url: string
  publicId: string
  resourceType: 'image' | 'video' | 'raw'
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'cleanair')

  const resourceType = file.type.startsWith('video')
    ? 'video'
    : file.type.startsWith('audio')
    ? 'video'   // Cloudinary handles audio under "video"
    : 'image'

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          resourceType,
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload network error'))

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`
    )
    xhr.send(formData)
  })
}

export function getOptimizedUrl(
  url: string,
  opts: { width?: number; quality?: number; format?: string } = {}
): string {
  if (!url.includes('cloudinary.com')) return url
  const { width = 800, quality = 80, format = 'webp' } = opts
  // Insert Cloudinary transformation parameters
  return url.replace('/upload/', `/upload/w_${width},q_${quality},f_${format}/`)
}