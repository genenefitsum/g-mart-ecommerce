import { Router } from 'express'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'
import ProductInterest from '../models/ProductInterest.js'
import ProductRating from '../models/ProductRating.js'
import SellerRating from '../models/SellerRating.js'
import User from '../models/User.js'
import { writeLimiter } from '../lib/rateLimiters.js'

export const ratingsRouter = Router()

function mongoGuard(req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Ratings require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value ?? '').trim())
}

function toRoundedRating(value) {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num) || num <= 0) return 0
  return Number(num.toFixed(1))
}

async function recomputeProductRatingSummary(productId) {
  const rows = await ProductRating.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        average: { $avg: '$stars' },
        count: { $sum: 1 },
      },
    },
  ])

  const row = rows[0] ?? null
  const ratingAverage = toRoundedRating(row?.average)
  const ratingCount = Number(row?.count ?? 0)

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        ratingAverage,
        ratingCount,
      },
    },
  )

  return { ratingAverage, ratingCount }
}

async function canBuyerRateProduct({ productId, buyerUserId }) {
  const link = await ProductInterest.findOne({ productId, buyerUserId })
    .select('_id')
    .lean()

  return Boolean(link?._id)
}

async function recomputeSellerRatingSummary(sellerUserId) {
  const rows = await SellerRating.aggregate([
    { $match: { sellerUserId: new mongoose.Types.ObjectId(sellerUserId) } },
    {
      $group: {
        _id: '$sellerUserId',
        average: { $avg: '$stars' },
        count: { $sum: 1 },
      },
    },
  ])

  const row = rows[0] ?? null
  const sellerRatingAverage = toRoundedRating(row?.average)
  const sellerRatingCount = Number(row?.count ?? 0)

  await User.updateOne(
    { _id: sellerUserId },
    {
      $set: {
        sellerRatingAverage,
        sellerRatingCount,
      },
    },
  )

  return { sellerRatingAverage, sellerRatingCount }
}

async function canBuyerRateSeller({ sellerUserId, buyerUserId }) {
  const link = await ProductInterest.findOne({ sellerUserId, buyerUserId })
    .select('_id')
    .lean()

  return Boolean(link?._id)
}

// GET /api/v1/ratings/products/:productId/summary
ratingsRouter.get('/products/:productId/summary', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const product = await Product.findById(productId)
      .select('_id ratingAverage ratingCount')
      .lean()

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }

    return res.json({
      ok: true,
      productId,
      rating: toRoundedRating(product.ratingAverage),
      reviewCount: Number(product.ratingCount ?? 0),
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/ratings/products/:productId/me
ratingsRouter.get('/products/:productId/me', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const buyerUserId = String(req.auth?.userId ?? '').trim()
    if (!buyerUserId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const product = await Product.findById(productId)
      .select('_id sellerUserId')
      .lean()

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }

    const rating = await ProductRating.findOne({ productId, buyerUserId })
      .select('_id stars updatedAt')
      .lean()

    return res.json({
      ok: true,
      productId,
      stars: Number(rating?.stars ?? 0),
      hasRating: Boolean(rating?._id),
      updatedAt: rating?.updatedAt ?? null,
    })
  } catch (err) {
    return next(err)
  }
})

// PUT /api/v1/ratings/products/:productId
// body: { stars: 1..5 }
ratingsRouter.put('/products/:productId', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const productId = String(req.params?.productId ?? '').trim()
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const buyerUserId = String(req.auth?.userId ?? '').trim()
    if (!buyerUserId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const stars = Number(req.body?.stars)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ ok: false, error: 'stars must be an integer between 1 and 5' })
    }

    const product = await Product.findById(productId)
      .select('_id sellerUserId isAdminProduct')
      .lean()

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }

    const sellerUserId = String(product?.sellerUserId ?? '').trim()
    if (!sellerUserId || product?.isAdminProduct) {
      return res.status(400).json({ ok: false, error: 'This product is not eligible for buyer ratings yet' })
    }

    if (buyerUserId === sellerUserId) {
      return res.status(403).json({ ok: false, error: 'You cannot rate your own product' })
    }

    const eligible = await canBuyerRateProduct({ productId, buyerUserId })
    if (!eligible) {
      return res.status(403).json({ ok: false, error: 'You can rate this product after expressing interest' })
    }

    const existing = await ProductRating.findOne({ productId, buyerUserId })
      .select('_id')
      .lean()

    let ratingDoc
    let created = false

    if (existing?._id) {
      ratingDoc = await ProductRating.findOneAndUpdate(
        { _id: existing._id },
        { $set: { stars } },
        { returnDocument: 'after' },
      )
    } else {
      ratingDoc = await ProductRating.create({
        productId,
        buyerUserId,
        stars,
      })
      created = true
    }

    const summary = await recomputeProductRatingSummary(productId)

    return res.status(created ? 201 : 200).json({
      ok: true,
      productId,
      stars: Number(ratingDoc?.stars ?? stars),
      rating: summary.ratingAverage,
      reviewCount: summary.ratingCount,
      created,
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/ratings/sellers/:sellerUserId/summary
ratingsRouter.get('/sellers/:sellerUserId/summary', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const sellerUserId = String(req.params?.sellerUserId ?? '').trim()
    if (!isValidObjectId(sellerUserId)) {
      return res.status(400).json({ ok: false, error: 'Invalid sellerUserId' })
    }

    const seller = await User.findById(sellerUserId)
      .select('_id sellerRatingAverage sellerRatingCount')
      .lean()

    if (!seller) {
      return res.status(404).json({ ok: false, error: 'Seller not found' })
    }

    return res.json({
      ok: true,
      sellerUserId,
      rating: toRoundedRating(seller.sellerRatingAverage),
      reviewCount: Number(seller.sellerRatingCount ?? 0),
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/ratings/sellers/:sellerUserId/me
ratingsRouter.get('/sellers/:sellerUserId/me', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const sellerUserId = String(req.params?.sellerUserId ?? '').trim()
    if (!isValidObjectId(sellerUserId)) {
      return res.status(400).json({ ok: false, error: 'Invalid sellerUserId' })
    }

    const buyerUserId = String(req.auth?.userId ?? '').trim()
    if (!buyerUserId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const seller = await User.findById(sellerUserId)
      .select('_id')
      .lean()
    if (!seller) {
      return res.status(404).json({ ok: false, error: 'Seller not found' })
    }

    const rating = await SellerRating.findOne({ sellerUserId, buyerUserId })
      .select('_id stars updatedAt')
      .lean()

    return res.json({
      ok: true,
      sellerUserId,
      stars: Number(rating?.stars ?? 0),
      hasRating: Boolean(rating?._id),
      updatedAt: rating?.updatedAt ?? null,
    })
  } catch (err) {
    return next(err)
  }
})

// PUT /api/v1/ratings/sellers/:sellerUserId
// body: { stars: 1..5 }
ratingsRouter.put('/sellers/:sellerUserId', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const sellerUserId = String(req.params?.sellerUserId ?? '').trim()
    if (!isValidObjectId(sellerUserId)) {
      return res.status(400).json({ ok: false, error: 'Invalid sellerUserId' })
    }

    const buyerUserId = String(req.auth?.userId ?? '').trim()
    if (!buyerUserId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    if (buyerUserId === sellerUserId) {
      return res.status(403).json({ ok: false, error: 'You cannot rate yourself' })
    }

    const stars = Number(req.body?.stars)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ ok: false, error: 'stars must be an integer between 1 and 5' })
    }

    const seller = await User.findById(sellerUserId)
      .select('_id')
      .lean()

    if (!seller) {
      return res.status(404).json({ ok: false, error: 'Seller not found' })
    }

    const hasListing = await Product.exists({ sellerUserId, isAdminProduct: false })
    if (!hasListing) {
      return res.status(400).json({ ok: false, error: 'This user is not eligible for seller ratings' })
    }

    const eligible = await canBuyerRateSeller({ sellerUserId, buyerUserId })
    if (!eligible) {
      return res.status(403).json({ ok: false, error: 'You can rate this seller after expressing interest' })
    }

    const existing = await SellerRating.findOne({ sellerUserId, buyerUserId })
      .select('_id')
      .lean()

    let ratingDoc
    let created = false

    if (existing?._id) {
      ratingDoc = await SellerRating.findOneAndUpdate(
        { _id: existing._id },
        { $set: { stars } },
        { returnDocument: 'after' },
      )
    } else {
      ratingDoc = await SellerRating.create({
        sellerUserId,
        buyerUserId,
        stars,
      })
      created = true
    }

    const summary = await recomputeSellerRatingSummary(sellerUserId)

    return res.status(created ? 201 : 200).json({
      ok: true,
      sellerUserId,
      stars: Number(ratingDoc?.stars ?? stars),
      rating: summary.sellerRatingAverage,
      reviewCount: summary.sellerRatingCount,
      created,
    })
  } catch (err) {
    return next(err)
  }
})
