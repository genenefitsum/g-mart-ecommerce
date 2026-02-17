import { v2 as cloudinary } from 'cloudinary'

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME ?? '').trim()
const apiKey = String(process.env.CLOUDINARY_API_KEY ?? '').trim()
const apiSecret = String(process.env.CLOUDINARY_API_SECRET ?? '').trim()

export const isCloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret)

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export async function uploadImageBufferToCloudinary({ buffer, filename }) {
  if (!isCloudinaryEnabled) {
    throw new Error('Cloudinary not configured')
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'gmart/products',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename,
      },
      (err, result) => {
        if (err) return reject(err)
        if (!result?.secure_url) {
          return reject(new Error('Cloudinary upload failed'))
        }
        resolve(result.secure_url)
      },
    )

    stream.end(buffer)
  })
}

function extractPublicIdFromCloudinaryUrl(url) {
  const value = String(url ?? '').trim()
  if (!value) return ''

  const marker = '/upload/'
  const markerIndex = value.indexOf(marker)
  if (markerIndex < 0) return ''

  const afterUpload = value.slice(markerIndex + marker.length)
  const noVersion = afterUpload.replace(/^v\d+\//, '')
  const withoutQuery = noVersion.split('?')[0]
  const lastDot = withoutQuery.lastIndexOf('.')
  if (lastDot < 0) return withoutQuery
  return withoutQuery.slice(0, lastDot)
}

export async function deleteCloudinaryImageByUrl(url) {
  if (!isCloudinaryEnabled) return

  const publicId = extractPublicIdFromCloudinaryUrl(url)
  if (!publicId) return

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {})
}
