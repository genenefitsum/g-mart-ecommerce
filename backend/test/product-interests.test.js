import test from 'node:test'
import { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { agent, makeApp, registerAndGetToken } from './helpers.js'
import { resetTestDb, setupTestDb, teardownTestDb } from './setup.js'

function uniqueEmail() {
  return `interest${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

before(async () => {
  await setupTestDb('gmart_test_product_interests')
})

beforeEach(async () => {
  await resetTestDb()
})

after(async () => {
  await teardownTestDb()
})

async function createSellerProduct({ sellerUserId, name = 'Seller Product' }) {
  const { default: Product } = await import('../src/models/Product.js')
  return Product.create({
    name,
    price: 399,
    category: 'Electronics',
    description: 'A user-added product for interest notification tests.',
    contactPhone: '+251900001111',
    imageUrl: 'http://localhost:4000/uploads/products/product-interest-test.jpg',
    images: ['http://localhost:4000/uploads/products/product-interest-test.jpg'],
    sellerUserId,
    isAdminProduct: false,
  })
}

async function getCurrentUser(http, token) {
  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(meRes.status, 200)
  assert.equal(meRes.body?.ok, true)
  return meRes.body?.user
}

test('product interests: buyer can send notify_only and with_contact', async () => {
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

  const notifyOnlyRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })

  assert.equal(notifyOnlyRes.status, 201)
  assert.equal(notifyOnlyRes.body?.ok, true)
  assert.ok(notifyOnlyRes.body?.interestId)

  const withContactRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({
      mode: 'with_contact',
      buyerContact: {
        phone: '+251900009999',
        email: 'buyer-contact@example.com',
        note: 'Please contact me in the evening.',
      },
    })

  assert.equal(withContactRes.status, 201)
  assert.equal(withContactRes.body?.ok, true)
  assert.ok(withContactRes.body?.interestId)
})

test('product interests: duplicate mode for same product is blocked within 24h', async () => {
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

  const firstRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })

  assert.equal(firstRes.status, 201)

  const duplicateRes = await http
    .post(`/api/v1/products/${product._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })

  assert.equal(duplicateRes.status, 409)
  assert.equal(duplicateRes.body?.ok, false)
})

test('product interests: seller inbox lists only own product interests', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerAReg = await registerAndGetToken(http, {
    name: 'Seller A',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerAReg.status, 201)

  const sellerBReg = await registerAndGetToken(http, {
    name: 'Seller B',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerBReg.status, 201)

  const buyerReg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(buyerReg.status, 201)

  const sellerAUser = await getCurrentUser(http, sellerAReg.body.accessToken)
  const sellerBUser = await getCurrentUser(http, sellerBReg.body.accessToken)

  const productA = await createSellerProduct({ sellerUserId: sellerAUser.id, name: 'Seller A Product' })
  const productB = await createSellerProduct({ sellerUserId: sellerBUser.id, name: 'Seller B Product' })

  const sendA = await http
    .post(`/api/v1/products/${productA._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({ mode: 'notify_only' })
  assert.equal(sendA.status, 201)

  const sendB = await http
    .post(`/api/v1/products/${productB._id}/interest`)
    .set('Authorization', `Bearer ${buyerReg.body.accessToken}`)
    .send({
      mode: 'with_contact',
      buyerContact: {
        email: 'buyer@example.com',
        note: 'Interested in this as well.',
      },
    })
  assert.equal(sendB.status, 201)

  const inboxA = await http
    .get('/api/v1/products/interests/mine')
    .set('Authorization', `Bearer ${sellerAReg.body.accessToken}`)

  assert.equal(inboxA.status, 200)
  assert.equal(inboxA.body?.ok, true)
  assert.equal(Array.isArray(inboxA.body?.interests), true)
  assert.equal(inboxA.body.interests.length, 1)
  assert.equal(inboxA.body.interests[0]?.product?.name, 'Seller A Product')
  assert.equal(inboxA.body.interests[0]?.buyer?.name, 'Buyer')
})
