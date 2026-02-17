import { Router } from 'express'
import mongoose from 'mongoose'

import { getMongoStatus } from '../db/mongo.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireRole.js'
import User from '../models/User.js'
import Order from '../models/Order.js'
import SiteSettings from '../models/SiteSettings.js'

export const adminRouter = Router()

function mongoGuard(_req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Admin routes require MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

adminRouter.use(requireAuth, requireAdmin)

function normalizeLimit(value, fallback = 200, max = 500) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(1, Math.min(max, Math.floor(num)))
}

function normalizeOrderStatus(value) {
  const status = String(value ?? '').trim().toLowerCase()
  const allowed = new Set(['pending_payment', 'payment_submitted', 'processing', 'completed', 'cancelled'])
  if (!allowed.has(status)) return ''
  return status
}

function normalizeRole(value) {
  const role = String(value ?? '').trim().toLowerCase()
  const allowed = new Set(['buyer', 'seller', 'admin'])
  if (!allowed.has(role)) return ''
  return role
}

function toRecipientShape(value) {
  const recipient = value && typeof value === 'object' ? value : {}
  const normalized = {
    telebirrPhone: String(recipient.telebirrPhone ?? '').trim(),
    bankName: String(recipient.bankName ?? '').trim(),
    bankAccountNumber: String(recipient.bankAccountNumber ?? '').trim(),
    bankAccountName: String(recipient.bankAccountName ?? '').trim(),
  }

  return {
    ...normalized,
    hasTelebirr: Boolean(normalized.telebirrPhone),
    hasBank: Boolean(normalized.bankAccountNumber),
  }
}

function toContentShape(value) {
  const content = value && typeof value === 'object' ? value : {}
  return {
    storeName: String(content.storeName ?? 'G-mart').trim() || 'G-mart',
    supportEmail: String(content.supportEmail ?? '').trim(),
    supportPhone: String(content.supportPhone ?? '').trim(),
    bannerMessage: String(content.bannerMessage ?? '').trim(),
  }
}

async function getOrCreateMainSettings() {
  let settings = await SiteSettings.findOne({ key: 'main' })
  if (settings) return settings

  settings = await SiteSettings.create({ key: 'main' })
  return settings
}

// GET /api/v1/admin/users
adminRouter.get('/users', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const q = String(req.query?.q ?? '').trim()
    const role = normalizeRole(req.query?.role)
    const limit = normalizeLimit(req.query?.limit)

    const filter = {}
    if (role) filter.role = role
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    const users = await User.find(filter)
      .select('_id name email role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return res.json({
      ok: true,
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/v1/admin/users/:userId/role
// body: { role }
adminRouter.patch('/users/:userId/role', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = String(req.params?.userId ?? '').trim()
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, error: 'Invalid userId' })
    }

    const role = normalizeRole(req.body?.role)
    if (!role) {
      return res.status(400).json({ ok: false, error: 'Invalid role' })
    }

    const authUserId = String(req.auth?.userId ?? '')
    if (String(userId) === authUserId && role !== 'admin') {
      return res.status(400).json({ ok: false, error: 'You cannot remove your own admin role' })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { returnDocument: 'after' },
    )

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }

    return res.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/admin/orders
adminRouter.get('/orders', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const status = normalizeOrderStatus(req.query?.status)
    const limit = normalizeLimit(req.query?.limit)

    const filter = {}
    if (status) filter.status = status

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return res.json({ ok: true, orders })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/v1/admin/orders/:orderId/status
// body: { status }
adminRouter.patch('/orders/:orderId/status', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const orderId = String(req.params?.orderId ?? '').trim()
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ ok: false, error: 'Invalid orderId' })
    }

    const status = normalizeOrderStatus(req.body?.status)
    if (!status) {
      return res.status(400).json({ ok: false, error: 'Invalid status' })
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { returnDocument: 'after' },
    )
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found' })
    }

    return res.json({ ok: true, order })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/admin/settings
adminRouter.get('/settings', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const settings = await getOrCreateMainSettings()
    return res.json({
      ok: true,
      settings: {
        paymentRecipient: toRecipientShape(settings.paymentRecipient),
        content: toContentShape(settings.content),
      },
    })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/v1/admin/settings
// body: { paymentRecipient?: {...}, content?: {...} }
adminRouter.patch('/settings', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const settings = await getOrCreateMainSettings()

    if (req.body?.paymentRecipient && typeof req.body.paymentRecipient === 'object') {
      settings.paymentRecipient = {
        ...(settings.paymentRecipient?.toObject?.() ?? settings.paymentRecipient ?? {}),
        telebirrPhone: String(req.body.paymentRecipient.telebirrPhone ?? settings.paymentRecipient?.telebirrPhone ?? '').trim(),
        bankName: String(req.body.paymentRecipient.bankName ?? settings.paymentRecipient?.bankName ?? '').trim(),
        bankAccountNumber: String(req.body.paymentRecipient.bankAccountNumber ?? settings.paymentRecipient?.bankAccountNumber ?? '').trim(),
        bankAccountName: String(req.body.paymentRecipient.bankAccountName ?? settings.paymentRecipient?.bankAccountName ?? '').trim(),
      }
    }

    if (req.body?.content && typeof req.body.content === 'object') {
      settings.content = {
        ...(settings.content?.toObject?.() ?? settings.content ?? {}),
        storeName: String(req.body.content.storeName ?? settings.content?.storeName ?? 'G-mart').trim() || 'G-mart',
        supportEmail: String(req.body.content.supportEmail ?? settings.content?.supportEmail ?? '').trim(),
        supportPhone: String(req.body.content.supportPhone ?? settings.content?.supportPhone ?? '').trim(),
        bannerMessage: String(req.body.content.bannerMessage ?? settings.content?.bannerMessage ?? '').trim(),
      }
    }

    await settings.save()

    return res.json({
      ok: true,
      settings: {
        paymentRecipient: toRecipientShape(settings.paymentRecipient),
        content: toContentShape(settings.content),
      },
    })
  } catch (err) {
    return next(err)
  }
})
