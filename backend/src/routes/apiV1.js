import { Router } from 'express'
import { authRouter } from './auth.js'
import { productsRouter } from './products.js'
import { wishlistRouter } from './wishlist.js'

export const apiV1 = Router()

apiV1.get('/', (_req, res) => {
    res.json({ ok: true, name: 'g-mart api', version: 'v1' })
})

apiV1.use('/auth', authRouter)
apiV1.use('/products', productsRouter)
apiV1.use('/wishlist', wishlistRouter)
