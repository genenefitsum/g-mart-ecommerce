import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { apiV1 } from './routes/apiV1.js'
import { getMongoStatus } from './db/mongo.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createServer() {
    const app = express()

    const uploadsRoot = path.resolve(process.cwd(), 'uploads')
    fs.mkdirSync(uploadsRoot, { recursive: true })
    app.use('/uploads', express.static(uploadsRoot))

    app.use(
        cors({
            origin: (origin, callback) => {
                // Allow same-origin requests (no Origin header) and tools like curl/postman
                if (!origin) return callback(null, true)

                const env = process.env.CORS_ORIGIN
                const allowAllLocalhost = process.env.NODE_ENV !== 'production'

                const allowedOrigins = (env ? env.split(',') : [])
                    .map((s) => s.trim())
                    .filter(Boolean)

                const isAllowedByEnv = allowedOrigins.length
                    ? allowedOrigins.includes(origin)
                    : false

                const isAllowedLocalhost =
                    allowAllLocalhost &&
                    /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

                const isAllowedPrivateLan =
                    allowAllLocalhost &&
                    /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):\d+$/.test(
                        origin,
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
    app.use(express.json())

    app.use('/api/v1', apiV1)

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
            if (req.path.startsWith('/api') || req.path === '/health') {
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
        // eslint-disable-next-line no-console
        console.error(err)

        const isProd = process.env.NODE_ENV === 'production'
        const message =
            isProd ? 'Internal server error' : err?.message ?? String(err)

        res.status(500).json({ ok: false, error: message })
    })

    return app
}
