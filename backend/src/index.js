import { createServer } from './server.js'
import { connectMongo } from './db/mongo.js'
import User from './models/User.js'
import AuthIdentity from './models/AuthIdentity.js'
import RefreshToken from './models/RefreshToken.js'
import Product from './models/Product.js'
import ProductInterest from './models/ProductInterest.js'
import ProductRating from './models/ProductRating.js'
import SellerRating from './models/SellerRating.js'
import Order from './models/Order.js'
import Wishlist from './models/Wishlist.js'
import SiteSettings from './models/SiteSettings.js'
import { startKeepAliveJob } from './services/keepAlive.js'

// Build indexes explicitly on startup. In production `autoIndex` is disabled,
// so without this the unique constraints (e.g. local auth identity, one rating
// per buyer/product) would never be created, allowing duplicates via races.
// `createIndexes()` is non-destructive: it creates missing indexes and never
// drops existing ones. Failures (e.g. pre-existing duplicate data blocking a
// unique index) are logged per-model and never crash the process.
async function ensureIndexes() {
  const models = [
    User,
    AuthIdentity,
    RefreshToken,
    Product,
    ProductInterest,
    ProductRating,
    SellerRating,
    Order,
    Wishlist,
    SiteSettings,
  ]

  await Promise.all(
    models.map(async (model) => {
      try {
        await model.createIndexes()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Index build failed for ${model.modelName}:`, err?.message ?? err)
      }
    }),
  )
}

// In production, refuse to boot with missing, default, or weak JWT secrets.
// Signing tokens with a known/placeholder secret lets anyone forge auth tokens.
function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return

  const defaults = new Set(['change-me-access', 'change-me-refresh'])
  const checks = [
    ['JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET],
  ]

  const problems = []
  for (const [name, value] of checks) {
    const secret = String(value ?? '')
    if (!secret) problems.push(`${name} is not set`)
    else if (defaults.has(secret)) problems.push(`${name} is still the example placeholder value`)
    else if (secret.length < 16) problems.push(`${name} is too short (use at least 16 characters)`)
  }

  if (problems.length) {
    // eslint-disable-next-line no-console
    console.error(`Refusing to start in production: ${problems.join('; ')}`)
    process.exit(1)
  }
}

assertProductionSecrets()

const port = Number(process.env.PORT ?? 4000)
const host = '0.0.0.0'

const app = createServer()

try {
  await connectMongo()
  if (process.env.MONGO_URI) {
    await ensureIndexes()
    // eslint-disable-next-line no-console
    console.log('MongoDB connected')
  } else {
    // eslint-disable-next-line no-console
    console.log('MongoDB disabled (set MONGO_URI to enable)')
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection failed')
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
}

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${host}:${port}`)

  startKeepAliveJob()
})
