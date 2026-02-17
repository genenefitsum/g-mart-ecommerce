import test from 'node:test'
import { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { agent, makeApp, registerAndGetToken } from './helpers.js'
import { resetTestDb, setupTestDb, teardownTestDb } from './setup.js'

function uniqueEmail() {
  return `test${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

before(async () => {
  await setupTestDb('gmart_test_orders')
})

beforeEach(async () => {
  await resetTestDb()

  process.env.ADMIN_PAYMENT_TELEBIRR_PHONE = '+251911111111'
  process.env.ADMIN_PAYMENT_BANK_NAME = 'Test Bank'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NUMBER = '1234567890'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NAME = 'Gmart Admin'
})

after(async () => {
  await teardownTestDb()
})

async function makeProduct() {
  const { default: Product } = await import('../src/models/Product.js')
  return Product.create({
    name: 'Test Product',
    price: 50,
    category: 'Test',
    description: 'A product used for automated tests only.',
    contactPhone: '+251900000000',
    imageUrl: 'http://localhost:4000/uploads/products/test.jpg',
    images: ['http://localhost:4000/uploads/products/test.jpg'],
    sellerUserId: null,
    isAdminProduct: true,
  })
}

test('orders: create -> list -> get single', async () => {
  const app = await makeApp()
  const http = agent(app)

  const reg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(reg.status, 201)

  const token = reg.body.accessToken

  const product = await makeProduct()

  const createRes = await http
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: String(product._id), quantity: 2 }],
      shipping: {
        name: 'John',
        phone: '+251900000000',
        addressLine1: 'Somewhere',
        city: 'Addis',
      },
      payment: { method: 'telebirr', transactionRef: 'TX-1' },
    })

  assert.equal(createRes.status, 201)
  assert.equal(createRes.body?.ok, true)
  assert.ok(createRes.body?.order?._id)
  assert.equal(createRes.body.order.subtotal, 100)
  assert.equal(createRes.body.order.recipient?.telebirrPhone, process.env.ADMIN_PAYMENT_TELEBIRR_PHONE)

  const orderId = String(createRes.body.order._id)

  const listRes = await http
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(listRes.status, 200)
  assert.equal(listRes.body?.ok, true)
  assert.equal(Array.isArray(listRes.body?.orders), true)
  assert.equal(listRes.body.orders.length, 1)

  const getRes = await http
    .get(`/api/v1/orders/${orderId}`)
    .set('Authorization', `Bearer ${token}`)

  assert.equal(getRes.status, 200)
  assert.equal(getRes.body?.ok, true)
  assert.equal(String(getRes.body?.order?._id), orderId)
})

test('orders: upload payment proof sets status payment_submitted', async () => {
  const app = await makeApp()
  const http = agent(app)

  const reg = await registerAndGetToken(http, {
    name: 'Buyer',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(reg.status, 201)

  const token = reg.body.accessToken

  const product = await makeProduct()

  const createRes = await http
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shipping: { name: 'John', phone: '+251900000000', addressLine1: 'X', city: 'Y' },
      payment: { method: 'bank', transactionRef: 'BANK-REF' },
    })

  assert.equal(createRes.status, 201)
  const orderId = String(createRes.body.order._id)

  const tmpFile = path.join(os.tmpdir(), `proof-${Date.now()}.txt`)
  await fs.writeFile(tmpFile, 'proof')

  const uploadRes = await http
    .post(`/api/v1/orders/${orderId}/payment-proof`)
    .set('Authorization', `Bearer ${token}`)
    .attach('proof', tmpFile)

  assert.equal(uploadRes.status, 201)
  assert.equal(uploadRes.body?.ok, true)
  assert.equal(uploadRes.body?.order?.status, 'payment_submitted')
  assert.ok(uploadRes.body?.order?.payment?.proofImageUrl)
})
