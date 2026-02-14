import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'

export const ordersRouter = Router()

function mongoGuard(_req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Orders require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

const uploadsRoot = path.resolve(process.cwd(), 'uploads')
const paymentProofDir = path.join(uploadsRoot, 'order-payments')
fs.mkdirSync(paymentProofDir, { recursive: true })

const storage = multer.diskStorage({
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
})

function normalizeQuantity(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.floor(n)
  if (rounded < 1) return null
  return rounded
}

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
      .select('_id name price imageUrl sellerPayment')
      .lean()

    const byId = new Map(products.map((p) => [String(p._id), p]))

    const missing = parsed.find((it) => !byId.has(String(it.productId)))
    if (missing) {
      return res.status(404).json({ ok: false, error: 'One or more products not found' })
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

    const recipientBase = {
      telebirrPhone: String(products?.[0]?.sellerPayment?.telebirrPhone ?? '').trim(),
      bankName: String(products?.[0]?.sellerPayment?.bankName ?? '').trim(),
      bankAccountNumber: String(products?.[0]?.sellerPayment?.bankAccountNumber ?? '').trim(),
      bankAccountName: String(products?.[0]?.sellerPayment?.bankAccountName ?? '').trim(),
    }

    const recipientKey = JSON.stringify(recipientBase)
    const mixedRecipient = products.some((p) => {
      const sp = p?.sellerPayment ?? {}
      const key = JSON.stringify({
        telebirrPhone: String(sp?.telebirrPhone ?? '').trim(),
        bankName: String(sp?.bankName ?? '').trim(),
        bankAccountNumber: String(sp?.bankAccountNumber ?? '').trim(),
        bankAccountName: String(sp?.bankAccountName ?? '').trim(),
      })
      return key !== recipientKey
    })

    if (mixedRecipient) {
      return res.status(400).json({
        ok: false,
        error: 'Multiple sellers in one order is not supported yet. Checkout separately.',
      })
    }

    const hasTelebirr = Boolean(recipientBase.telebirrPhone)
    const hasBank = Boolean(recipientBase.bankAccountNumber)
    if (!hasTelebirr && !hasBank) {
      return res.status(400).json({ ok: false, error: 'Seller payment info is missing' })
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
      recipient: recipientBase,
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

      const proofPath = `/uploads/order-payments/${req.file.filename}`
      const proofUrl = `${req.protocol}://${req.get('host')}${proofPath}`

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
