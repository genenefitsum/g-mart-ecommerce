import { Router } from 'express'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'
import Wishlist from '../models/Wishlist.js'
import { writeLimiter } from '../lib/rateLimiters.js'

export const wishlistRouter = Router()

function isAdminProductRecord(product) {
  if (typeof product?.isAdminProduct === 'boolean') return product.isAdminProduct

  const ownerId = String(product?.sellerUserId ?? '').trim()
  return !ownerId
}

function mongoGuard(req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Wishlist requires MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

async function loadWishlistProducts(userId) {
  const wishlist = await Wishlist.findOne({ userId }).lean()
  const productIds = Array.isArray(wishlist?.productIds) ? wishlist.productIds : []
  if (!productIds.length) return []

  const products = await Product.find({ _id: { $in: productIds } })
    .select('_id name category price imageUrl isAdminProduct sellerUserId')
    .lean()

  const byId = new Map(products.map((p) => [String(p._id), p]))
  return productIds
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .map((p) => ({
      id: String(p._id),
      name: p.name ?? '',
      category: p.category ?? '',
      price: Number(p.price ?? 0),
      image: p.imageUrl ?? '',
      canAddToCart: isAdminProductRecord(p),
    }))
}

// GET /api/v1/wishlist
wishlistRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return
    const userId = req.auth?.userId
    const items = await loadWishlistProducts(userId)
    return res.json({ ok: true, items })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/wishlist/:productId
wishlistRouter.post('/:productId', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth?.userId
    const productId = String(req.params?.productId ?? '').trim()
    if (!productId) return res.status(400).json({ ok: false, error: 'Missing productId' })

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const product = await Product.findById(productId).select('_id').lean()
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found' })

    await Wishlist.updateOne(
      { userId },
      { $setOnInsert: { userId }, $addToSet: { productIds: product._id } },
      { upsert: true },
    )

    const items = await loadWishlistProducts(userId)
    return res.status(201).json({ ok: true, items })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/v1/wishlist/:productId
wishlistRouter.delete('/:productId', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth?.userId
    const productId = String(req.params?.productId ?? '').trim()
    if (!productId) return res.status(400).json({ ok: false, error: 'Missing productId' })

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const productObjectId = new mongoose.Types.ObjectId(productId)

    await Wishlist.updateOne(
      { userId },
      { $setOnInsert: { userId }, $pull: { productIds: productObjectId } },
      { upsert: true },
    )

    const items = await loadWishlistProducts(userId)
    return res.json({ ok: true, items })
  } catch (err) {
    return next(err)
  }
})
