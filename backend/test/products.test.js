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
  await setupTestDb('gmart_test_products')
})

beforeEach(async () => {
  await resetTestDb()
})

after(async () => {
  await teardownTestDb()
})

test('products: list returns ok', async () => {
  const app = await makeApp()
  const http = agent(app)

  const res = await http.get('/api/v1/products')
  assert.equal(res.status, 200)
  assert.equal(res.body?.ok, true)
  assert.equal(Array.isArray(res.body?.products), true)
})

test('products: create (auth) then fetch by id', async () => {
  const app = await makeApp()
  const http = agent(app)

  const reg = await registerAndGetToken(http, {
    name: 'Seller',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(reg.status, 201)

  const token = reg.body.accessToken

  const imgPath = path.join(os.tmpdir(), `img-${Date.now()}.jpg`)
  await fs.writeFile(imgPath, 'fake-image')

  const createRes = await http
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'Test Listing')
    .field('price', '123')
    .field('category', 'Test')
    .field('description', 'This is a description long enough for validation.')
    .field('contactPhone', '+251900000000')
    .field('telebirrPhone', '+251911111111')
    .attach('image', imgPath)

  assert.equal(createRes.status, 201)
  assert.equal(createRes.body?.ok, true)
  assert.ok(createRes.body?.product?._id)

  const productId = String(createRes.body.product._id)

  const getRes = await http.get(`/api/v1/products/${productId}`)
  assert.equal(getRes.status, 200)
  assert.equal(getRes.body?.ok, true)
  assert.equal(String(getRes.body?.product?._id), productId)
})
