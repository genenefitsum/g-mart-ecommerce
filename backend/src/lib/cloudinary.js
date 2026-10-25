import { v2 as cloudinary } from 'cloudinary'

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME ?? '').trim()
const apiKey = String(process.env.CLOUDINARY_API_KEY ?? '').trim()
const apiSecret = String(process.env.CLOUDINARY_API_SECRET ?? '').trim()

function sanitizeSegment(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')

  return normalized || fallback
}

const cloudinaryBaseFolder = sanitizeSegment(
  process.env.CLOUDINARY_FOLDER,
  'gmart',
)

const cloudinaryProductsFolder = `${cloudinaryBaseFolder}/products`
const cloudinaryOrderPaymentsFolder = `${cloudinaryBaseFolder}/order-payments`
const cloudinaryTag = sanitizeSegment(process.env.CLOUDINARY_TAG, 'gmart')

export const cloudinaryFolders = {
  products: cloudinaryProductsFolder,
  orderPayments: cloudinaryOrderPaymentsFolder,
}
const cloudinaryEnvironmentTag = sanitizeSegment(
  process.env.NODE_ENV,
  'development',
)

export const isCloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret)

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export async function uploadImageBufferToCloudinary({
  buffer,
  filename,
  folder = cloudinaryProductsFolder,
  tagSuffix = 'products',
}) {
  if (!isCloudinaryEnabled) {
    throw new Error('Cloudinary not configured')
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename,
        tags: [cloudinaryTag, `${cloudinaryTag}:${tagSuffix}`, `env:${cloudinaryEnvironmentTag}`],
      },
      (err, result) => {
        if (err) return reject(err)
        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error('Cloudinary upload failed'))
        }

        const optimizedUrl = cloudinary.url(result.public_id, {
          secure: true,
          resource_type: 'image',
          type: 'upload',
          fetch_format: 'auto',
          quality: 'auto',
        })

        resolve(optimizedUrl || result.secure_url)
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

function isFromCurrentCloud(url) {
  const value = String(url ?? '').trim()
  if (!value) return false

  try {
    const parsed = new URL(value)
    return parsed.hostname === 'res.cloudinary.com' && parsed.pathname.startsWith(`/${cloudName}/`)
  } catch {
    return false
  }
}

export async function deleteCloudinaryImageByUrl(url) {
  if (!isCloudinaryEnabled) return
  if (!isFromCurrentCloud(url)) return

  const publicId = extractPublicIdFromCloudinaryUrl(url)
  if (!publicId) return
  if (!publicId.startsWith(`${cloudinaryBaseFolder}/`)) return

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {})
}
