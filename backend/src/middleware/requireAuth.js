import { verifyAccessToken } from '../services/jwt.js'

export function requireAuth(req, res, next) {
  const header = req.header('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    const payload = verifyAccessToken(token)

    req.auth = {
      userId: payload.sub,
      role: payload.role,
    }

    return next()
  } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
}
