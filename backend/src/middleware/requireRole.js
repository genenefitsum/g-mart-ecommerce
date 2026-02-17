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

  return (req, res, next) => {
    const currentRole = String(req.auth?.role ?? '').trim().toLowerCase()

    if (!allowedRoles.length || allowedRoles.includes(currentRole)) {
      return next()
    }

    return res.status(403).json({ ok: false, error: 'Forbidden' })
  }
}

export function requireRole(role) {
  return requireAnyRole(role)
}

export const requireAdmin = requireRole('admin')
