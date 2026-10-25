import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import SiteSettings from '../models/SiteSettings.js'
import { getUploadsRoot } from '../lib/uploads.js'
import { writeLimiter, uploadLimiter } from '../lib/rateLimiters.js'
import {
  cloudinaryFolders,
  isCloudinaryEnabled,
  uploadImageBufferToCloudinary,
} from '../lib/cloudinary.js'

export const ordersRouter = Router()

function mongoGuard(_req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Orders require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

const uploadsRoot = getUploadsRoot()
const paymentProofDir = path.join(uploadsRoot, 'order-payments')
fs.mkdirSync(paymentProofDir, { recursive: true })

const allowedProofMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const allowedProofExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const storage = isCloudinaryEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, paymentProofDir),
      filename: (_req, file, cb) => {
        const safeBase = String(file.originalname || 'proof')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9._-]/g, '')
          .slice(0, 80)

        const ext = path.extname(safeBase) || ''
        const base = path.basename(safeBase, ext) || 'proof'
        const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`

        cb(null, `${base}-${stamp}${ext}`)
      },
    })

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file?.originalname ?? '').toLowerCase())
    const mime = String(file?.mimetype ?? '').toLowerCase()

    if (!allowedProofExtensions.has(ext) || !allowedProofMimeTypes.has(mime)) {
      return cb(new Error('Invalid proof file type. Only JPG, PNG, and WEBP are allowed.'))
    }

    return cb(null, true)
  },
})

function isAdminProductRecord(product) {
  if (typeof product?.isAdminProduct === 'boolean') return product.isAdminProduct

  const ownerId = String(product?.sellerUserId ?? '').trim()
  return !ownerId
}

function recipientShape(recipient) {
  return {
    telebirrPhone: String(recipient?.telebirrPhone ?? '').trim(),
    bankName: String(recipient?.bankName ?? '').trim(),
    bankAccountNumber: String(recipient?.bankAccountNumber ?? '').trim(),
    bankAccountName: String(recipient?.bankAccountName ?? '').trim(),
  }
}

function withRecipientFlags(recipient) {
  const normalized = recipientShape(recipient)
  return {
    ...normalized,
    hasTelebirr: Boolean(normalized.telebirrPhone),
    hasBank: Boolean(normalized.bankAccountNumber),
  }
}

function getAdminPaymentRecipientFromEnv() {
  return withRecipientFlags({
    telebirrPhone: String(process.env.ADMIN_PAYMENT_TELEBIRR_PHONE ?? '').trim(),
    bankName: String(process.env.ADMIN_PAYMENT_BANK_NAME ?? '').trim(),
    bankAccountNumber: String(process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NUMBER ?? '').trim(),
    bankAccountName: String(process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NAME ?? '').trim(),
  })
}

async function getAdminPaymentRecipient() {
  const settings = await SiteSettings.findOne({ key: 'main' }).select('paymentRecipient').lean()
  const fromSettings = withRecipientFlags(settings?.paymentRecipient)

  if (fromSettings.hasTelebirr || fromSettings.hasBank) {
    return fromSettings
  }

  return getAdminPaymentRecipientFromEnv()
}

function normalizeQuantity(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.floor(n)
  if (rounded < 1) return null
  return rounded
}

// GET /api/v1/orders/payment-recipient
ordersRouter.get('/payment-recipient', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const recipient = await getAdminPaymentRecipient()
    return res.json({ ok: true, recipient })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/orders
// body: { items: [{ productId, quantity }], shipping?: {...}, payment: { method, transactionRef? } }
ordersRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth?.userId
    const itemsInput = Array.isArray(req.body?.items) ? req.body.items : []

    if (!itemsInput.length) {
      return res.status(400).json({ ok: false, error: 'Cart is empty' })
    }

    const parsed = itemsInput
      .map((it) => ({
        productId: String(it?.productId ?? '').trim(),
        quantity: normalizeQuantity(it?.quantity),
      }))
      .filter((it) => it.productId && it.quantity)

    if (!parsed.length) {
      return res.status(400).json({ ok: false, error: 'Invalid items' })
    }

    const invalidId = parsed.find((it) => !mongoose.Types.ObjectId.isValid(it.productId))
    if (invalidId) {
      return res.status(400).json({ ok: false, error: 'Invalid productId' })
    }

    const productObjectIds = parsed.map((it) => new mongoose.Types.ObjectId(it.productId))
    const products = await Product.find({ _id: { $in: productObjectIds } })
      .select('_id name price imageUrl isAdminProduct sellerUserId')
      .lean()

    const byId = new Map(products.map((p) => [String(p._id), p]))

    const missing = parsed.find((it) => !byId.has(String(it.productId)))
    if (missing) {
      return res.status(404).json({ ok: false, error: 'One or more products not found' })
    }

    const hasNonCartable = products.some((p) => !isAdminProductRecord(p))

    if (hasNonCartable) {
      return res.status(400).json({
        ok: false,
        error: 'Only admin products can be checked out. Seller products are marketplace-only.',
      })
    }

    const orderItems = parsed.map((it) => {
      const p = byId.get(String(it.productId))
      return {
        productId: p._id,
        name: p.name ?? '',
        unitPrice: Number(p.price ?? 0),
        quantity: it.quantity,
        imageUrl: p.imageUrl ?? '',
      }
    })

    const recipient = await getAdminPaymentRecipient()
    const hasTelebirr = recipient.hasTelebirr
    const hasBank = recipient.hasBank
    if (!hasTelebirr && !hasBank) {
      return res.status(400).json({ ok: false, error: 'Admin payment info is missing' })
    }

    const subtotal = orderItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

    const shippingIn = req.body?.shipping ?? {}
    const shipping = {
      name: String(shippingIn?.name ?? '').trim(),
      phone: String(shippingIn?.phone ?? '').trim(),
      addressLine1: String(shippingIn?.addressLine1 ?? '').trim(),
      city: String(shippingIn?.city ?? '').trim(),
      notes: String(shippingIn?.notes ?? '').trim(),
    }

    const paymentIn = req.body?.payment ?? {}
    const method = String(paymentIn?.method ?? '').trim().toLowerCase()
    if (!['telebirr', 'bank'].includes(method)) {
      return res.status(400).json({ ok: false, error: 'Invalid payment method' })
    }

    const transactionRef = String(paymentIn?.transactionRef ?? '').trim()

    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      currency: 'ETB',
      shipping,
      payment: {
        method,
        transactionRef,
      },
      recipient: {
        telebirrPhone: recipient.telebirrPhone,
        bankName: recipient.bankName,
        bankAccountNumber: recipient.bankAccountNumber,
        bankAccountName: recipient.bankAccountName,
      },
      legalConsent: {
        termsAccepted: req.body?.termsAccepted !== undefined ? Boolean(req.body.termsAccepted) : true,
        acceptedAt: new Date(),
        termsVersion: String(req.body?.termsVersion ?? '1.0').trim() || '1.0',
      },
      status: 'pending_payment',
    })

    return res.status(201).json({ ok: true, order })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/orders
ordersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth?.userId
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(200).lean()
    return res.json({ ok: true, orders })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/orders/:orderId
ordersRouter.get('/:orderId', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth?.userId
    const orderId = String(req.params?.orderId ?? '').trim()

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ ok: false, error: 'Invalid orderId' })
    }

    const order = await Order.findOne({ _id: orderId, userId }).lean()
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' })

    return res.json({ ok: true, order })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/orders/:orderId/payment-proof (multipart/form-data)
// file field: proof
ordersRouter.post(
  '/:orderId/payment-proof',
  requireAuth,
  upload.single('proof'),
  async (req, res, next) => {
    try {
      if (!mongoGuard(req, res)) return

      const userId = req.auth?.userId
      const orderId = String(req.params?.orderId ?? '').trim()

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ ok: false, error: 'Invalid orderId' })
      }

      const order = await Order.findOne({ _id: orderId, userId })
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found' })

      if (!req.file) {
        return res.status(400).json({ ok: false, error: 'Proof image is required' })
      }

      const proofUrl = isCloudinaryEnabled
        ? await uploadImageBufferToCloudinary({
            buffer: req.file.buffer,
            filename: req.file.originalname,
            folder: cloudinaryFolders.orderPayments,
            tagSuffix: 'order-payments',
          })
        : `/uploads/order-payments/${req.file.filename}`

      order.payment = {
        ...(order.payment?.toObject?.() ?? order.payment ?? {}),
        proofImageUrl: proofUrl,
        submittedAt: new Date(),
      }
      order.status = 'payment_submitted'

      await order.save()

      return res.status(201).json({ ok: true, order })
    } catch (err) {
      return next(err)
    }
  },
)
