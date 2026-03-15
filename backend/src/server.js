import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { apiV1 } from './routes/apiV1.js'
import { getMongoStatus } from './db/mongo.js'
import { getUploadsRoot } from './lib/uploads.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function normalizeOrigin(value) {
    const raw = String(value ?? '').trim()
    if (!raw) return ''

    try {
        const parsed = new URL(raw)
        return parsed.origin
    } catch {
        return raw.replace(/\/+$/, '')
    }
}

export function createServer() {
    const app = express()
    const isProd = process.env.NODE_ENV === 'production'

    app.disable('x-powered-by')
    app.set('trust proxy', 1)
    app.set('query parser', 'simple')

    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false,
            hsts: isProd
                ? {
                      maxAge: 15552000,
                      includeSubDomains: true,
                      preload: false,
                  }
                : false,
        }),
    )

    const uploadsRoot = getUploadsRoot()
    app.use(
        '/uploads',
        express.static(uploadsRoot, {
            index: false,
            dotfiles: 'deny',
            etag: true,
            maxAge: '1h',
            setHeaders: (res) => {
                res.setHeader('X-Content-Type-Options', 'nosniff')
                res.setHeader('Content-Disposition', 'inline')
            },
        }),
    )

    app.use(
        cors({
            origin: (origin, callback) => {
                // Allow same-origin requests (no Origin header) and tools like curl/postman
                if (!origin) return callback(null, true)

                const env = process.env.CORS_ORIGIN
                const allowAllLocalhost = process.env.NODE_ENV !== 'production'
                const requestOrigin = normalizeOrigin(origin)

                const allowedOrigins = (env ? env.split(',') : [])
                    .map((s) => normalizeOrigin(s))
                    .filter(Boolean)

                const isAllowedByEnv = allowedOrigins.length
                    ? allowedOrigins.includes(requestOrigin)
                    : false

                const isAllowedLocalhost =
                    allowAllLocalhost &&
                    /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin)

                const isAllowedPrivateLan =
                    allowAllLocalhost &&
                    /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):\d+$/.test(
                        requestOrigin,
                    )

                if (isAllowedByEnv || isAllowedLocalhost || isAllowedPrivateLan) {
                    return callback(null, true)
                }

                return callback(new Error('Not allowed by CORS'))
            },
            credentials: true,
        }),
    )
    app.use(cookieParser())
    app.use(express.json({ limit: '100kb' }))
    app.use(express.urlencoded({ extended: false, limit: '50kb' }))

    app.use('/api/v1', apiV1)

    app.get('/healthz', (_req, res) => {
        res.json({ ok: true, service: 'g-mart-api', ts: Date.now(), uptimeSec: Math.floor(process.uptime()) })
    })

    app.get('/health', (_req, res) => {
        res.json({ ok: true, mongo: getMongoStatus() })
    })

    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist')
    const hasFrontendBuild = fs.existsSync(
        path.join(frontendDistPath, 'index.html'),
    )

    const shouldServeFrontend =
        process.env.SERVE_FRONTEND === 'true' ||
        (process.env.NODE_ENV === 'production' && hasFrontendBuild)

    if (shouldServeFrontend) {
        app.use(express.static(frontendDistPath))

        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/healthz') {
                return next()
            }

            res.sendFile(path.join(frontendDistPath, 'index.html'))
        })
    }

    app.use((req, res) => {
        res.status(404).json({ ok: false, error: 'Not found' })
    })

    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
        if (err?.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ ok: false, error: 'File too large. Max size is 5MB.' })
        }

        if (String(err?.message ?? '').startsWith('Invalid proof file type')) {
            return res.status(400).json({ ok: false, error: err.message })
        }

        // eslint-disable-next-line no-console
        console.error(err)

        const isProd = process.env.NODE_ENV === 'production'
        const message =
            isProd ? 'Internal server error' : err?.message ?? String(err)

        res.status(500).json({ ok: false, error: message })
    })

    return app
}
