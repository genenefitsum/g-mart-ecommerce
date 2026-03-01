import test from 'node:test'
import { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { agent, makeApp, registerAndGetToken } from './helpers.js'
import { resetTestDb, setupTestDb, teardownTestDb } from './setup.js'

function uniqueEmail() {
  return `rating${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

before(async () => {
  await setupTestDb('gmart_test_ratings_products')
})

beforeEach(async () => {
  await resetTestDb()
})

after(async () => {
  await teardownTestDb()
})

async function getCurrentUser(http, token) {
  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(meRes.status, 200)
  assert.equal(meRes.body?.ok, true)
  return meRes.body?.user
}

async function createSellerProduct({ sellerUserId, name = 'Rated Seller Product' }) {
  const { default: Product } = await import('../src/models/Product.js')
  return Product.create({
    name,
    price: 250,
    category: 'Electronics',
    description: 'Seller product used to test buyer ratings through product interest eligibility.',
    contactPhone: '+251900001111',
    imageUrl: 'http://localhost:4000/uploads/products/rating-test.jpg',
    images: ['http://localhost:4000/uploads/products/rating-test.jpg'],
    sellerUserId,
    isAdminProduct: false,
  })
}

test('ratings: eligible buyer can create and update product rating', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerReg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerUser = await getCurrentUser(http, sellerReg.body.accessToken)
  const product = await createSellerProduct({ sellerUserId: sellerUser.id })

  const interestRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })

  assert.equal(interestRes.status, 201)

  const firstRatingRes = await http
    .put(`/api/v1/ratings/products/${product._id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 4 })

  assert.equal(firstRatingRes.status, 201)
  assert.equal(firstRatingRes.body?.ok, true)
  assert.equal(firstRatingRes.body?.stars, 4)
  assert.equal(firstRatingRes.body?.created, true)
  assert.equal(firstRatingRes.body?.rating, 4)
  assert.equal(firstRatingRes.body?.reviewCount, 1)

  const secondRatingRes = await http
    .put(`/api/v1/ratings/products/${product._id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 5 })

  assert.equal(secondRatingRes.status, 200)
  assert.equal(secondRatingRes.body?.ok, true)
  assert.equal(secondRatingRes.body?.created, false)
  assert.equal(secondRatingRes.body?.stars, 5)
  assert.equal(secondRatingRes.body?.rating, 5)
  assert.equal(secondRatingRes.body?.reviewCount, 1)

  const mineRes = await http
    .get(`/api/v1/ratings/products/${product._id}/me`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)

  assert.equal(mineRes.status, 200)
  assert.equal(mineRes.body?.ok, true)
  assert.equal(mineRes.body?.hasRating, true)
  assert.equal(mineRes.body?.stars, 5)

  const summaryRes = await http.get(`/api/v1/ratings/products/${product._id}/summary`)
  assert.equal(summaryRes.status, 200)
  assert.equal(summaryRes.body?.ok, true)
  assert.equal(summaryRes.body?.rating, 5)
  assert.equal(summaryRes.body?.reviewCount, 1)

  const productRes = await http.get(`/api/v1/products/${product._id}`)
  assert.equal(productRes.status, 200)
  assert.equal(productRes.body?.ok, true)
  assert.equal(productRes.body?.product?.rating, 5)
  assert.equal(productRes.body?.product?.reviewCount, 1)
})

test('ratings: buyer without product interest is blocked', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerReg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerUser = await getCurrentUser(http, sellerReg.body.accessToken)
  const product = await createSellerProduct({ sellerUserId: sellerUser.id })

  const ratingRes = await http
    .put(`/api/v1/ratings/products/${product._id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 3 })

  assert.equal(ratingRes.status, 403)
  assert.equal(ratingRes.body?.ok, false)
})

test('ratings: stars validation and auth checks', async () => {
  const app = await makeApp()
  const http = agent(app)

  const invalidIdRes = await http
    .put('/api/v1/ratings/products/not-an-id')
    .send({ stars: 5 })

  assert.equal(invalidIdRes.status, 401)

  const sellerReg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerUser = await getCurrentUser(http, sellerReg.body.accessToken)
  const product = await createSellerProduct({ sellerUserId: sellerUser.id })

  await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })

  const badStarsRes = await http
    .put(`/api/v1/ratings/products/${product._id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 6 })

  assert.equal(badStarsRes.status, 400)
  assert.equal(badStarsRes.body?.ok, false)
})

test('seller ratings: eligible buyer can create and update seller rating', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerReg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerUser = await getCurrentUser(http, sellerReg.body.accessToken)
  const product = await createSellerProduct({ sellerUserId: sellerUser.id })

  const interestRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })
  assert.equal(interestRes.status, 201)

  const firstRatingRes = await http
    .put(`/api/v1/ratings/sellers/${sellerUser.id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 4 })

  assert.equal(firstRatingRes.status, 201)
  assert.equal(firstRatingRes.body?.ok, true)
  assert.equal(firstRatingRes.body?.created, true)
  assert.equal(firstRatingRes.body?.rating, 4)
  assert.equal(firstRatingRes.body?.reviewCount, 1)

  const secondRatingRes = await http
    .put(`/api/v1/ratings/sellers/${sellerUser.id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 5 })

  assert.equal(secondRatingRes.status, 200)
  assert.equal(secondRatingRes.body?.ok, true)
  assert.equal(secondRatingRes.body?.created, false)
  assert.equal(secondRatingRes.body?.rating, 5)
  assert.equal(secondRatingRes.body?.reviewCount, 1)

  const mineRes = await http
    .get(`/api/v1/ratings/sellers/${sellerUser.id}/me`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)

  assert.equal(mineRes.status, 200)
  assert.equal(mineRes.body?.ok, true)
  assert.equal(mineRes.body?.hasRating, true)
  assert.equal(mineRes.body?.stars, 5)

  const summaryRes = await http.get(`/api/v1/ratings/sellers/${sellerUser.id}/summary`)
  assert.equal(summaryRes.status, 200)
  assert.equal(summaryRes.body?.ok, true)
  assert.equal(summaryRes.body?.rating, 5)
  assert.equal(summaryRes.body?.reviewCount, 1)
})

test('seller ratings: buyer without product interest is blocked', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerReg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerUser = await getCurrentUser(http, sellerReg.body.accessToken)

  await createSellerProduct({ sellerUserId: sellerUser.id, name: 'Seller Without Interest Rating Product' })

  const ratingRes = await http
    .put(`/api/v1/ratings/sellers/${sellerUser.id}`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ stars: 4 })

  assert.equal(ratingRes.status, 403)
  assert.equal(ratingRes.body?.ok, false)
})
