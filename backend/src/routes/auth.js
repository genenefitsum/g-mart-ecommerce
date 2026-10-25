import { Router } from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import rateLimit from 'express-rate-limit'

import { getMongoStatus } from '../db/mongo.js'
import User from '../models/User.js'
import AuthIdentity from '../models/AuthIdentity.js'
import RefreshToken from '../models/RefreshToken.js'
import {
  generateJti,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/jwt.js'
import { requireAuth } from '../middleware/requireAuth.js'
import Wishlist from '../models/Wishlist.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

export const authRouter = Router()

const googleClient = new OAuth2Client()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts. Please try again later.' },
})

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many refresh attempts. Please try again later.' },
})

function formatUserResponse(user, authMethods = []) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isPermanentAdmin: Boolean(user.isPermanentAdmin),
    termsAndPrivacyAccepted: Boolean(user.termsAndPrivacyAccepted),
    authMethods: Array.from(new Set(authMethods.map((method) => String(method ?? '').trim()).filter(Boolean))),
  }
}

async function getAuthMethodsForUser(userId) {
  const identities = await AuthIdentity.find({ userId }).select('provider').lean()
  return identities.map((identity) => String(identity?.provider ?? '').trim()).filter(Boolean)
}

async function buildUserResponse(user) {
  return formatUserResponse(user, await getAuthMethodsForUser(user._id))
}

async function createOrUpdateLocalIdentity({ user, emailLower }) {
  await AuthIdentity.updateOne(
    { provider: 'local', emailLower },
    {
      $set: {
        userId: user._id,
        emailVerified: true,
        profile: {
          displayName: user.name,
          avatarUrl: '',
        },
        lastLoginAt: new Date(),
      },
      $setOnInsert: {
        provider: 'local',
        emailLower,
        passwordHash: null,
      },
    },
    { upsert: true },
  )
}

// Delete a user and all of their related data. Runs inside a transaction when
// the MongoDB deployment supports it (replica set / Atlas) so a partial failure
// cannot orphan data. Standalone MongoDB (local dev, tests) does not support
// multi-document transactions, so we fall back to sequential deletes there.
async function deleteAllUserData(userId) {
  const run = async (session) => {
    const opts = session ? { session } : undefined
    await RefreshToken.deleteMany({ userId }, opts)
    await AuthIdentity.deleteMany({ userId }, opts)
    await Wishlist.deleteOne({ userId }, opts)
    await Order.deleteMany({ userId }, opts)
    await Product.deleteMany({ sellerUserId: userId }, opts)
    await User.deleteOne({ _id: userId }, opts)
  }

  let session
  try {
    session = await mongoose.startSession()
    await session.withTransaction(() => run(session))
  } catch (err) {
    const message = String(err?.message ?? '')
    const transactionsUnsupported =
      /Transaction numbers are only allowed|replica set|Transactions are not supported|does not support sessions/i.test(
        message,
      )
    if (!transactionsUnsupported) throw err
    await run(null)
  } finally {
    if (session) await session.endSession()
  }
}

function mongoGuard(req, res) {
  const status = getMongoStatus()
  if (!status.enabled) {
    res.status(503).json({ ok: false, error: 'Auth requires MongoDB (set MONGO_URI)' })
    return false
  }
  return true
}

function isConsentAccepted(value) {
  if (value === true) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }
  return false
}

function setRefreshCookie(res, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  })
}

function clearRefreshCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  })
}

async function issueTokens({ user, authIdentity }) {
  const jti = generateJti()

  const refreshToken = signRefreshToken({
    userId: user._id,
    authIdentityId: authIdentity._id,
    jti,
  })

  const decoded = verifyRefreshToken(refreshToken)
  const expiresAt = new Date(decoded.exp * 1000)

  await RefreshToken.create({
    userId: user._id,
    authIdentityId: authIdentity._id,
    jti,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
    revokedAt: null,
  })

  const accessToken = signAccessToken({ userId: user._id, role: user.role })

  return { accessToken, refreshToken }
}

async function verifyGoogleCredential(credential) {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID ?? '').trim()
  if (!googleClientId) {
    const err = new Error('Google sign-in is not configured')
    err.statusCode = 503
    throw err
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: googleClientId,
  })

  const payload = ticket.getPayload() ?? {}
  const email = String(payload.email ?? '').trim().toLowerCase()
  const providerUserId = String(payload.sub ?? '').trim()
  const emailVerified = Boolean(payload.email_verified)

  if (!providerUserId || !email || !emailVerified) {
    const err = new Error('Invalid Google account')
    err.statusCode = 401
    throw err
  }

  return {
    providerUserId,
    email,
    emailVerified,
    displayName: String(payload.name ?? '').trim(),
    avatarUrl: String(payload.picture ?? '').trim(),
  }
}

async function findOrCreateUserForGoogleIdentity(profile, { termsAndPrivacyAccepted } = {}) {
  const { email, providerUserId, displayName, avatarUrl, emailVerified } = profile

  let googleIdentity = await AuthIdentity.findOne({
    provider: 'google',
    $or: [{ providerUserId }, { emailLower: email }],
  })

  let user = null
  if (googleIdentity) {
    user = await User.findById(googleIdentity.userId)
    if (!user) {
      await AuthIdentity.deleteOne({ _id: googleIdentity._id })
      googleIdentity = null
    }
  }

  if (!user) {
    const existingIdentity = await AuthIdentity.findOne({ provider: 'local', emailLower: email })
    if (existingIdentity) {
      user = await User.findById(existingIdentity.userId)
    }
  }

  if (!user) {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      user = existingUser
    }
  }

  if (!user) {
    if (!isConsentAccepted(termsAndPrivacyAccepted)) {
      const err = new Error('You must agree to the Terms and Privacy Policy before creating an account')
      err.statusCode = 400
      throw err
    }

    const fallbackPasswordHash = await bcrypt.hash(`${providerUserId}:${Date.now()}`, 12)
    user = await User.create({
      name: displayName || email.split('@')[0],
      email,
      passwordHash: fallbackPasswordHash,
      role: 'buyer',
      termsAndPrivacyAccepted: true,
      termsAndPrivacyAcceptedAt: new Date(),
    })
  }

  if (!googleIdentity) {
    googleIdentity = await AuthIdentity.create({
      userId: user._id,
      provider: 'google',
      providerUserId,
      emailLower: email,
      passwordHash: null,
      emailVerified,
      profile: {
        displayName: displayName || user.name,
        avatarUrl,
      },
      lastLoginAt: new Date(),
    })
  } else {
    await AuthIdentity.updateOne(
      { _id: googleIdentity._id },
      {
        $set: {
          userId: user._id,
          providerUserId,
          emailLower: email,
          emailVerified,
          profile: {
            displayName: displayName || user.name,
            avatarUrl,
          },
          lastLoginAt: new Date(),
        },
      },
    )

    googleIdentity = await AuthIdentity.findById(googleIdentity._id)
  }

  if (!googleIdentity) {
    throw new Error('Failed to establish Google identity')
  }

  return { user, authIdentity: googleIdentity }
}

// POST /api/v1/auth/register
authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const { name, email, password, termsAndPrivacyAccepted } = req.body ?? {}

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing fields' })
    }

    if (!isConsentAccepted(termsAndPrivacyAccepted)) {
      return res.status(400).json({ ok: false, error: 'You must agree to the Terms and Privacy Policy' })
    }

    if (String(password).length < 8) {
      return res.status(400).json({ ok: false, error: 'Password too short' })
    }

    const emailLower = String(email).trim().toLowerCase()

    const existingIdentity = await AuthIdentity.findOne({ provider: 'local', emailLower })
    if (existingIdentity) {
      const existingUser = await User.findById(existingIdentity.userId).select('_id')

      // If the user record was deleted but the identity remains, clean up the stale identity.
      // This prevents "Email already in use" for an email that is no longer registered.
      if (!existingUser) {
        await AuthIdentity.deleteOne({ _id: existingIdentity._id })
      } else {
        return res.status(409).json({ ok: false, error: 'Email already in use' })
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 12)

    const user = await User.create({
      name: String(name).trim(),
      email: emailLower,
      passwordHash,
      role: 'buyer',
      termsAndPrivacyAccepted: true,
      termsAndPrivacyAcceptedAt: new Date(),
    })

    const authIdentity = await AuthIdentity.create({
      userId: user._id,
      provider: 'local',
      emailLower,
      passwordHash: null,
      emailVerified: false,
      profile: { displayName: user.name, avatarUrl: '' },
      lastLoginAt: new Date(),
    })

    const { accessToken, refreshToken } = await issueTokens({ user, authIdentity })
    setRefreshCookie(res, refreshToken)

    return res.status(201).json({
      ok: true,
      accessToken,
      user: await buildUserResponse(user),
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/auth/login
authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing fields' })
    }

    const emailLower = String(email).trim().toLowerCase()

    const authIdentity = await AuthIdentity.findOne({ provider: 'local', emailLower })
    if (!authIdentity) {
      const googleIdentity = await AuthIdentity.findOne({ provider: 'google', emailLower }).select('_id').lean()
      if (googleIdentity) {
        return res.status(409).json({
          ok: false,
          error: 'This account uses Google sign-in. Set a password from Account first, or sign in with Google.',
        })
      }

      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }

    const user = await User.findById(authIdentity.userId).select('+passwordHash')
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }

    await AuthIdentity.updateOne({ _id: authIdentity._id }, { $set: { lastLoginAt: new Date() } })

    const { accessToken, refreshToken } = await issueTokens({ user, authIdentity })
    setRefreshCookie(res, refreshToken)

    return res.json({
      ok: true,
      accessToken,
      user: await buildUserResponse(user),
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/auth/google
// body: { credential } where credential is Google ID token
authRouter.post('/google', authLimiter, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const credential = String(req.body?.credential ?? '').trim()
    const termsAndPrivacyAccepted = req.body?.termsAndPrivacyAccepted
    if (!credential) {
      return res.status(400).json({ ok: false, error: 'Missing Google credential' })
    }

    const googleProfile = await verifyGoogleCredential(credential)
    const { user, authIdentity } = await findOrCreateUserForGoogleIdentity(googleProfile, {
      termsAndPrivacyAccepted,
    })

    const { accessToken, refreshToken } = await issueTokens({ user, authIdentity })
    setRefreshCookie(res, refreshToken)

    return res.json({
      ok: true,
      accessToken,
      user: await buildUserResponse(user),
    })
  } catch (err) {
    const statusCode = Number(err?.statusCode)
    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600) {
      return res.status(statusCode).json({ ok: false, error: err.message || 'Google sign-in failed' })
    }
    return next(err)
  }
})

// POST /api/v1/auth/refresh
authRouter.post('/refresh', refreshLimiter, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const token = req.cookies?.refresh_token
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const authIdentityId = decoded.aid
    const jti = decoded.jti

    const stored = await RefreshToken.findOne({ authIdentityId, jti }).select('+tokenHash')
    if (!stored) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    if (stored.revokedAt) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    if (stored.tokenHash !== hashRefreshToken(token)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    // Rotate refresh token
    await RefreshToken.updateOne({ _id: stored._id }, { $set: { revokedAt: new Date() } })

    const user = await User.findById(stored.userId)
    if (!user) {
      clearRefreshCookie(res)
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const authIdentity = await AuthIdentity.findById(stored.authIdentityId)
    if (!authIdentity) {
      clearRefreshCookie(res)
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    const { accessToken, refreshToken } = await issueTokens({ user, authIdentity })
    setRefreshCookie(res, refreshToken)

    return res.json({ ok: true, accessToken })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const token = req.cookies?.refresh_token

    if (token) {
      try {
        const decoded = verifyRefreshToken(token)
        await RefreshToken.updateOne(
          { authIdentityId: decoded.aid, jti: decoded.jti, revokedAt: null },
          { $set: { revokedAt: new Date() } },
        )
      } catch {
        // ignore
      }
    }

    clearRefreshCookie(res)
    return res.json({ ok: true })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const user = await User.findById(req.auth.userId)
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    return res.json({
      ok: true,
      user: await buildUserResponse(user),
    })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/v1/auth/me
// body: { name }
authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const name = String(req.body?.name ?? '').trim()
    if (!name || name.length < 2 || name.length > 50) {
      return res.status(400).json({ ok: false, error: 'Invalid name' })
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: { name } },
      { new: true },
    )

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    return res.json({
      ok: true,
      user: await buildUserResponse(user),
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/auth/set-password
// body: { newPassword }
authRouter.post('/set-password', authLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const newPassword = String(req.body?.newPassword ?? '')

    if (!newPassword) {
      return res.status(400).json({ ok: false, error: 'Missing fields' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password too short' })
    }

    const user = await User.findById(req.auth.userId).select('name email role')
    if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const authMethods = await getAuthMethodsForUser(user._id)
    if (authMethods.includes('local')) {
      return res.status(409).json({ ok: false, error: 'A local password already exists. Use change password instead.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await User.updateOne({ _id: user._id }, { $set: { passwordHash } })
    await createOrUpdateLocalIdentity({ user, emailLower: String(user.email).trim().toLowerCase() })

    return res.json({
      ok: true,
      user: await buildUserResponse(user),
      message: 'Password set successfully. You can now sign in with email and password.',
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/auth/change-password
// body: { currentPassword, newPassword }
authRouter.post('/change-password', authLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const currentPassword = String(req.body?.currentPassword ?? '')
    const newPassword = String(req.body?.newPassword ?? '')

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'Missing fields' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password too short' })
    }

    const user = await User.findById(req.auth.userId).select('+passwordHash')
    if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await User.updateOne({ _id: user._id }, { $set: { passwordHash } })

    // Require re-auth by revoking refresh tokens.
    await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })
    clearRefreshCookie(res)

    return res.json({ ok: true, requiresReauth: true })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/auth/export-data
// GDPR / Data Portability endpoint
authRouter.get('/export-data', authLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const userId = req.auth.userId
    const user = await User.findById(userId).select('-passwordHash').lean()
    if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const [orders, wishlist, products] = await Promise.all([
      Order.find({ userId }).lean(),
      Wishlist.findOne({ userId }).lean(),
      Product.find({ sellerUserId: userId }).lean(),
    ])

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        platform: 'G-mart E-Commerce',
        purpose: 'GDPR / Personal Data Portability Report',
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        termsAndPrivacyAccepted: user.termsAndPrivacyAccepted,
        termsAndPrivacyAcceptedAt: user.termsAndPrivacyAcceptedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      orders: orders.map((o) => ({
        id: o._id,
        subtotal: o.subtotal,
        currency: o.currency,
        status: o.status,
        shipping: o.shipping,
        items: o.items,
        paymentMethod: o.payment?.method,
        legalConsent: o.legalConsent,
        createdAt: o.createdAt,
      })),
      wishlist: wishlist?.items || [],
      listedProducts: products.map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        createdAt: p.createdAt,
      })),
    }

    return res.json({
      ok: true,
      data: exportPayload,
    })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/v1/auth/account
// body: { password }
authRouter.delete('/account', authLimiter, requireAuth, async (req, res, next) => {
  try {
    if (!mongoGuard(req, res)) return

    const password = String(req.body?.password ?? '')
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Password is required' })
    }

    const user = await User.findById(req.auth.userId).select('+passwordHash')
    if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    if (user.isPermanentAdmin) {
      return res.status(403).json({ ok: false, error: 'This admin account is permanent and cannot be deleted' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const userId = user._id

    await deleteAllUserData(userId)

    clearRefreshCookie(res)
    return res.json({ ok: true })
  } catch (err) {
    return next(err)
  }
})
