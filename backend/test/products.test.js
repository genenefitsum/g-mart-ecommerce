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

  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(meRes.status, 200)
  assert.equal(meRes.body?.ok, true)
  assert.equal(meRes.body?.user?.role, 'seller')
})

test('products: seller can update and delete own product', async () => {
  const app = await makeApp()
  const http = agent(app)

  const reg = await registerAndGetToken(http, {
    name: 'Seller 2',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(reg.status, 201)

  const token = reg.body.accessToken

  const firstImg = path.join(os.tmpdir(), `img-first-${Date.now()}.jpg`)
  const secondImg = path.join(os.tmpdir(), `img-second-${Date.now()}.jpg`)
  await fs.writeFile(firstImg, 'fake-image-first')
  await fs.writeFile(secondImg, 'fake-image-second')

  const createRes = await http
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'Owner Listing')
    .field('price', '150')
    .field('category', 'Test')
    .field('description', 'This listing belongs to the seller for update/delete checks.')
    .field('contactPhone', '+251900000001')
    .attach('images', firstImg)
    .attach('images', secondImg)

  assert.equal(createRes.status, 201)
  assert.equal(createRes.body?.ok, true)
  assert.equal(Array.isArray(createRes.body?.product?.images), true)
  assert.equal(createRes.body?.product?.images?.length, 2)
  assert.equal(createRes.body?.product?.imageUrl, createRes.body?.product?.images?.[0])

  const productId = String(createRes.body.product._id)

  const patchRes = await http
    .patch(`/api/v1/products/${productId}`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'Updated Owner Listing')

  assert.equal(patchRes.status, 200)
  assert.equal(patchRes.body?.ok, true)
  assert.equal(patchRes.body?.product?.name, 'Updated Owner Listing')

  const deleteRes = await http
    .delete(`/api/v1/products/${productId}`)
    .set('Authorization', `Bearer ${token}`)

  assert.equal(deleteRes.status, 200)
  assert.equal(deleteRes.body?.ok, true)

  const getRes = await http.get(`/api/v1/products/${productId}`)
  assert.equal(getRes.status, 404)
})

test('products: seller cannot update or delete another seller product', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerA = await registerAndGetToken(http, {
    name: 'Seller A',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerA.status, 201)

  const sellerB = await registerAndGetToken(http, {
    name: 'Seller B',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerB.status, 201)

  const imgPath = path.join(os.tmpdir(), `img-${Date.now()}-forbidden.jpg`)
  await fs.writeFile(imgPath, 'fake-image-forbidden')

  const createRes = await http
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerA.body.accessToken}`)
    .field('name', 'Seller A Product')
    .field('price', '111')
    .field('category', 'Test')
    .field('description', 'Owned by seller A and should not be editable by seller B.')
    .field('contactPhone', '+251900000002')
    .attach('image', imgPath)

  assert.equal(createRes.status, 201)
  const productId = String(createRes.body?.product?._id)

  const patchRes = await http
    .patch(`/api/v1/products/${productId}`)
    .set('Authorization', `Bearer ${sellerB.body.accessToken}`)
    .field('name', 'Hacked Name')

  assert.equal(patchRes.status, 403)

  const deleteRes = await http
    .delete(`/api/v1/products/${productId}`)
    .set('Authorization', `Bearer ${sellerB.body.accessToken}`)

  assert.equal(deleteRes.status, 403)
})

test('products: mine returns only products created by current user', async () => {
  const app = await makeApp()
  const http = agent(app)

  const sellerA = await registerAndGetToken(http, {
    name: 'My Products Seller A',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerA.status, 201)

  const sellerB = await registerAndGetToken(http, {
    name: 'My Products Seller B',
    email: uniqueEmail(),
    password: 'password123',
  })
  assert.equal(sellerB.status, 201)

  const sellerAImage = path.join(os.tmpdir(), `img-seller-a-${Date.now()}.jpg`)
  const sellerBImage = path.join(os.tmpdir(), `img-seller-b-${Date.now()}.jpg`)
  await fs.writeFile(sellerAImage, 'fake-image-a')
  await fs.writeFile(sellerBImage, 'fake-image-b')

  const createA = await http
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerA.body.accessToken}`)
    .field('name', 'Seller A Listing')
    .field('price', '100')
    .field('category', 'Test')
    .field('description', 'Seller A product to verify mine endpoint filtering.')
    .field('contactPhone', '+251900000010')
    .attach('image', sellerAImage)

  assert.equal(createA.status, 201)
  const sellerAProductId = String(createA.body?.product?._id)

  const createB = await http
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerB.body.accessToken}`)
    .field('name', 'Seller B Listing')
    .field('price', '200')
    .field('category', 'Test')
    .field('description', 'Seller B product to verify mine endpoint filtering.')
    .field('contactPhone', '+251900000011')
    .attach('image', sellerBImage)

  assert.equal(createB.status, 201)

  const mineRes = await http
    .get('/api/v1/products/mine')
    .set('Authorization', `Bearer ${sellerA.body.accessToken}`)

  assert.equal(mineRes.status, 200)
  assert.equal(mineRes.body?.ok, true)
  assert.equal(Array.isArray(mineRes.body?.products), true)
  assert.equal(mineRes.body.products.length, 1)
  assert.equal(String(mineRes.body.products[0]?._id), sellerAProductId)
})
