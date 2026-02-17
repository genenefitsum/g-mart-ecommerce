import fs from 'fs'
import path from 'path'

export function getUploadsRoot() {
  const configured = String(process.env.UPLOADS_DIR ?? '').trim()
  const uploadsRoot = configured
    ? path.resolve(configured)
    : path.resolve(process.cwd(), 'uploads')

  fs.mkdirSync(uploadsRoot, { recursive: true })
  return uploadsRoot
}
