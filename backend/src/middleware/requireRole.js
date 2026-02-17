import User from '../models/User.js'

function normalizeRoles(roles) {
  return Array.from(
    new Set(
      roles
        .map((role) => String(role ?? '').trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

export function requireAnyRole(...roles) {
  const allowedRoles = normalizeRoles(roles)

  return async (req, res, next) => {
    const currentRole = String(req.auth?.role ?? '').trim().toLowerCase()

    if (!allowedRoles.length || allowedRoles.includes(currentRole)) {
      return next()
    }

    const userId = String(req.auth?.userId ?? '').trim()
    if (!userId) {
      return res.status(403).json({ ok: false, error: 'Forbidden' })
    }

    try {
      const user = await User.findById(userId).select('role').lean()
      const dbRole = String(user?.role ?? '').trim().toLowerCase()

      if (allowedRoles.includes(dbRole)) {
        req.auth = {
          ...(req.auth ?? {}),
          role: dbRole,
        }
        return next()
      }
    } catch {
      return res.status(503).json({ ok: false, error: 'Authorization temporarily unavailable' })
    }

    return res.status(403).json({ ok: false, error: 'Forbidden' })
  }
}

export function requireRole(role) {
  return requireAnyRole(role)
}

export const requireAdmin = requireRole('admin')
