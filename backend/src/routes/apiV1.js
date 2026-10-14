import { Router } from 'express'
import { getMongoStatus } from '../db/mongo.js'
import SiteSettings from '../models/SiteSettings.js'
import { adminRouter } from './admin.js'
import { authRouter } from './auth.js'
import { ordersRouter } from './orders.js'
import { productsRouter } from './products.js'
import { ratingsRouter } from './ratings.js'
import { wishlistRouter } from './wishlist.js'

export const apiV1 = Router()

apiV1.get('/', (_req, res) => {
    res.json({ ok: true, name: 'g-mart api', version: 'v1' })
})

apiV1.get('/healthz', (_req, res) => {
    res.json({ ok: true, name: 'g-mart api', version: 'v1', ts: Date.now() })
})

apiV1.get('/settings', async (_req, res, next) => {
  try {
    const status = getMongoStatus()
    if (!status.enabled) {
      return res.json({ ok: true, settings: null })
    }
    const settings = await SiteSettings.findOne({ key: 'main' }).lean()
    return res.json({
      ok: true,
      settings: {
        content: {
          storeName: settings?.content?.storeName || 'G-mart',
          supportEmail: settings?.content?.supportEmail || '',
          supportPhone: settings?.content?.supportPhone || '',
          bannerMessage: settings?.content?.bannerMessage || '',
        },
        legal: {
          companyName: settings?.legal?.companyName || 'G-mart E-Commerce PLC',
          registeredAddress: settings?.legal?.registeredAddress || 'Bole Sub-City, Addis Ababa, Ethiopia',
          registrationNumber: settings?.legal?.registrationNumber || 'ET-MTR-2024-00918',
          taxId: settings?.legal?.taxId || 'TIN-008291823',
          legalEmail: settings?.legal?.legalEmail || 'gmartofficial@gmail.com',
          effectiveDate: settings?.legal?.effectiveDate || 'October 14, 2026',
          termsVersion: settings?.legal?.termsVersion || '1.0',
          privacyVersion: settings?.legal?.privacyVersion || '1.0',
          returnWindowDays: settings?.legal?.returnWindowDays || 7,
        },
      },
    })
  } catch (err) {
    return next(err)
  }
})

apiV1.use('/auth', authRouter)
apiV1.use('/admin', adminRouter)
apiV1.use('/orders', ordersRouter)
apiV1.use('/products', productsRouter)
apiV1.use('/ratings', ratingsRouter)
apiV1.use('/wishlist', wishlistRouter)
