import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { getUploadsRoot } from '../lib/uploads.js'
import {
  deleteCloudinaryImageByUrl,
  isCloudinaryEnabled,
  uploadImageBufferToCloudinary,
} from '../lib/cloudinary.js'

export const productsRouter = Router()

function mongoGuard(req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Products require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

const uploadsRoot = getUploadsRoot()
const productsUploadDir = path.join(uploadsRoot, 'products')
fs.mkdirSync(productsUploadDir, { recursive: true })

const storage = isCloudinaryEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
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

const uploadProductImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 8 },
])

function canManageProduct(product, auth) {
  const role = String(auth?.role ?? '').toLowerCase()
  if (role === 'admin') return true

  const ownerId = String(product?.sellerUserId ?? '').trim()
  const userId = String(auth?.userId ?? '').trim()
  return Boolean(ownerId && userId && ownerId === userId)
}

function toImagePath(file) {
  if (isCloudinaryEnabled) {
    return ''
  }
  return `/uploads/products/${file.filename}`
}

function collectUploadedImagePaths(req) {
  const filesByField = req?.files && typeof req.files === 'object' ? req.files : {}
  const many = Array.isArray(filesByField.images) ? filesByField.images : []
  const single = Array.isArray(filesByField.image) ? filesByField.image : []

  const chosen = many.length ? many : single
  return chosen.map(toImagePath)
}

async function uploadProductImageUrls(req) {
  const filesByField = req?.files && typeof req.files === 'object' ? req.files : {}
  const many = Array.isArray(filesByField.images) ? filesByField.images : []
  const single = Array.isArray(filesByField.image) ? filesByField.image : []

  const chosen = many.length ? many : single
  if (!chosen.length) return []

  if (!isCloudinaryEnabled) {
    return chosen.map(toImagePath)
  }

  const uploads = chosen.map((file) =>
    uploadImageBufferToCloudinary({
      buffer: file.buffer,
      filename: file.originalname,
    }),
  )

  return Promise.all(uploads)
}

function deleteLocalProductImages(imagePaths) {
  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths]
  const filenames = Array.from(
    new Set(
      paths
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.startsWith('/uploads/products/'))
        .map((value) => path.basename(value)),
    ),
  )

  for (const filename of filenames) {
    const filePath = path.join(productsUploadDir, filename)
    fs.promises.unlink(filePath).catch(() => {})
  }
}

async function deleteProductImages(imagePaths) {
  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths]

  if (isCloudinaryEnabled) {
    await Promise.all(paths.map((value) => deleteCloudinaryImageByUrl(value)))
    return
  }

  deleteLocalProductImages(paths)
}

function hasCartPaymentInfo(product) {
  if (typeof product?.isAdminProduct === 'boolean') {
    return product.isAdminProduct
  }

  const ownerId = String(product?.sellerUserId ?? '').trim()
  return !ownerId
}

function serializeProduct(product) {
  const plain = product && typeof product === 'object' ? product : {}
  return {
    ...plain,
    canAddToCart: hasCartPaymentInfo(plain),
  }
}

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

    return res.json({ ok: true, products: products.map(serializeProduct) })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/products/mine
productsRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = String(req.auth?.userId ?? '').trim()
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const products = await Product.find({ sellerUserId: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()

    return res.json({ ok: true, products: products.map(serializeProduct) })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/products/:productId
productsRouter.get('/:productId([0-9a-fA-F]{24})', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!productId) return res.status(400).json({ ok: false, error: 'Missing productId' })

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const product = await Product.findById(productId).lean()
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found' })

    return res.json({ ok: true, product: serializeProduct(product) })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/products (multipart/form-data)
// fields: name, price, category, description, contactPhone,
// image(file) or images(files[])
productsRouter.post('/', requireAuth, uploadProductImages, async (req, res, next) => {
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

    const imagePaths = await uploadProductImageUrls(req)
    if (!imagePaths.length) {
      return res.status(400).json({ ok: false, error: 'At least one image is required' })
    }

    const isAdmin = String(req.auth?.role ?? '').toLowerCase() === 'admin'

    const coverImagePath = imagePaths[0]

    const product = await Product.create({
      name,
      price,
      category,
      description,
      contactPhone,
      imageUrl: coverImagePath,
      images: imagePaths,
      sellerUserId: req.auth?.userId ?? null,
      isAdminProduct: isAdmin,
    })

    const authUserId = String(req.auth?.userId ?? '').trim()
    if (authUserId) {
      await User.updateOne(
        { _id: authUserId, role: 'buyer' },
        { $set: { role: 'seller' } },
      )
    }

    return res.status(201).json({ ok: true, product: serializeProduct(product.toObject()) })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/v1/products/:productId (multipart/form-data)
// editable fields: name, price, category, description, contactPhone, image(s)
productsRouter.patch('/:productId', requireAuth, uploadProductImages, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found' })

    if (!canManageProduct(product, req.auth)) {
      return res.status(403).json({ ok: false, error: 'You can only edit your own product' })
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name ?? '').trim()
      if (!name) return res.status(400).json({ ok: false, error: 'Invalid name' })
      product.name = name
    }

    if (req.body?.category !== undefined) {
      const category = String(req.body.category ?? '').trim()
      if (!category) return res.status(400).json({ ok: false, error: 'Invalid category' })
      product.category = category
    }

    if (req.body?.description !== undefined) {
      const description = String(req.body.description ?? '').trim()
      if (!description) return res.status(400).json({ ok: false, error: 'Invalid description' })
      product.description = description
    }

    if (req.body?.contactPhone !== undefined) {
      const contactPhone = String(req.body.contactPhone ?? '').trim()
      if (!contactPhone) return res.status(400).json({ ok: false, error: 'Invalid contactPhone' })
      product.contactPhone = contactPhone
    }

    if (req.body?.price !== undefined) {
      const price = Number(req.body.price)
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ ok: false, error: 'Invalid price' })
      }
      product.price = price
    }

    const newImagePaths = await uploadProductImageUrls(req)
    if (newImagePaths.length) {
      const previous = Array.isArray(product.images) && product.images.length
        ? product.images
        : [product.imageUrl]

      product.images = newImagePaths
      product.imageUrl = newImagePaths[0]

      await deleteProductImages(previous)
    }

    await product.save()
    return res.json({ ok: true, product: serializeProduct(product.toObject()) })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/v1/products/:productId
async function handleDeleteProduct(req, res, next) {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found' })

    if (!canManageProduct(product, req.auth)) {
      return res.status(403).json({ ok: false, error: 'You can only delete your own product' })
    }

    const toDelete = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.imageUrl]

    await product.deleteOne()
    await deleteProductImages(toDelete)

    return res.json({ ok: true, deletedId: String(product._id) })
  } catch (err) {
    return next(err)
  }
}

productsRouter.delete('/:productId', requireAuth, handleDeleteProduct)

// Compatibility alias for environments that may not pass DELETE correctly.
productsRouter.post('/:productId/delete', requireAuth, handleDeleteProduct)
