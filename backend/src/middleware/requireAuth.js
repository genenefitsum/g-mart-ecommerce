import { verifyAccessToken } from '../services/jwt.js'
import { getMongoStatus } from '../db/mongo.js'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  const header = req.header('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    const payload = verifyAccessToken(token)

    const mongo = getMongoStatus()
    if (!mongo.enabled) {
      return res.status(503).json({ ok: false, error: 'Authorization requires MongoDB' })
    }

    const user = await User.findById(payload.sub).select('_id role').lean()
    if (!user?._id) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }

    req.auth = {
      userId: String(user._id),
      role: String(user.role ?? payload.role ?? '').trim().toLowerCase(),
    }

    return next()
  } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
}
