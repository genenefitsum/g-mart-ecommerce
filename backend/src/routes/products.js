import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'

export const productsRouter = Router()

function mongoGuard(req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Products require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

const uploadsRoot = path.resolve(process.cwd(), 'uploads')
const productsUploadDir = path.join(uploadsRoot, 'products')
fs.mkdirSync(productsUploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsUploadDir),
  filename: (_req, file, cb) => {
    const safeBase = String(file.originalname || 'image')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 80)

    const ext = path.extname(safeBase) || ''
    const base = path.basename(safeBase, ext) || 'image'
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`

    cb(null, `${base}-${stamp}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// GET /api/v1/products?category=...&q=...
productsRouter.get('/', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const category = String(req.query?.category ?? '').trim()
    const q = String(req.query?.q ?? '').trim()

    const filter = {}
    if (category) filter.category = category

    if (q) {
      // Prefer text search when possible; fallback to regex.
      // If MongoDB text index isn't present (e.g. autoIndex disabled in prod), regex still works.
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()

    return res.json({ ok: true, products })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/products (multipart/form-data)
// fields: name, price, category, description, contactPhone, image(file)
productsRouter.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const name = String(req.body?.name ?? '').trim()
    const category = String(req.body?.category ?? '').trim()
    const description = String(req.body?.description ?? '').trim()
    const contactPhone = String(req.body?.contactPhone ?? '').trim()

    const rawPrice = req.body?.price
    const price = Number(rawPrice)

    if (!name || !category || !description || !contactPhone) {
      return res.status(400).json({ ok: false, error: 'Missing fields' })
    }

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ ok: false, error: 'Invalid price' })
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Image is required' })
    }

    const imagePath = `/uploads/products/${req.file.filename}`
    const imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`

    const product = await Product.create({
      name,
      price,
      category,
      description,
      contactPhone,
      imageUrl,
      sellerUserId: req.auth?.userId ?? null,
    })

    return res.status(201).json({ ok: true, product })
  } catch (err) {
    return next(err)
  }
})
