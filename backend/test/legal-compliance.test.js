import test from 'node:test'
import assert from 'node:assert/strict'

import { setupTestDb, resetTestDb, teardownTestDb } from './setup.js'
import { agent as makeAgent, makeApp, registerAndGetToken, setUserRoleByEmail } from './helpers.js'
import Product from '../src/models/Product.js'

let app
let http

function uniqueEmail() {
  return `legal-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

test.before(async () => {
  await setupTestDb('gmart_legal_test')
  app = await makeApp()
  http = makeAgent(app)
})

test.beforeEach(async () => {
  await resetTestDb()

  process.env.ADMIN_PAYMENT_TELEBIRR_PHONE = '+251911111111'
  process.env.ADMIN_PAYMENT_BANK_NAME = 'Test Bank'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NUMBER = '1234567890'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NAME = 'Gmart Admin'
})

test.after(async () => {
  await teardownTestDb()
})

test('legal: GET /api/v1/settings returns public legal metadata', async () => {
  const res = await http.get('/api/v1/settings')
  assert.equal(res.status, 200)
  assert.equal(res.body?.ok, true)
  assert.equal(res.body?.settings?.legal?.companyName, 'G-mart E-Commerce PLC')
  assert.equal(res.body?.settings?.legal?.returnWindowDays, 7)
  assert.equal(res.body?.settings?.legal?.termsVersion, '1.0')
})

test('legal: admin can update legal settings via PATCH /api/v1/admin/settings', async () => {
  const email = uniqueEmail()
  const reg = await registerAndGetToken(http, {
    name: 'Compliance Officer',
    email,
    password: 'Password123!',
  })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  await setUserRoleByEmail(email, 'admin')

  const updateRes = await http
    .patch('/api/v1/admin/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      legal: {
        companyName: 'G-mart Global PLC',
        returnWindowDays: 14,
        termsVersion: '2.0',
        registrationNumber: 'ET-999-REV',
      },
    })

  assert.equal(updateRes.status, 200)
  assert.equal(updateRes.body?.settings?.legal?.companyName, 'G-mart Global PLC')
  assert.equal(updateRes.body?.settings?.legal?.returnWindowDays, 14)
  assert.equal(updateRes.body?.settings?.legal?.termsVersion, '2.0')
  assert.equal(updateRes.body?.settings?.legal?.registrationNumber, 'ET-999-REV')

  // Public endpoint reflects updated settings
  const publicRes = await http.get('/api/v1/settings')
  assert.equal(publicRes.body?.settings?.legal?.companyName, 'G-mart Global PLC')
  assert.equal(publicRes.body?.settings?.legal?.returnWindowDays, 14)
})

test('legal: order creation captures legalConsent snapshot', async () => {
  const reg = await registerAndGetToken(http, {
    name: 'Order Placer',
    email: uniqueEmail(),
    password: 'Password123!',
  })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  const product = await Product.create({
    name: 'Legal Test Product',
    price: 500,
    category: 'Electronics',
    description: 'A product used for automated tests only.',
    contactPhone: '+251900000000',
    imageUrl: 'http://localhost:4000/uploads/products/test.jpg',
    images: ['http://localhost:4000/uploads/products/test.jpg'],
    sellerUserId: null,
    isAdminProduct: true,
  })

  // Create order with termsAccepted
  const orderRes = await http
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shipping: {
        name: 'Order Placer',
        phone: '0911223344',
        addressLine1: 'Bole, Addis Ababa',
        city: 'Addis Ababa',
      },
      payment: {
        method: 'telebirr',
      },
      termsAccepted: true,
      termsVersion: '1.0',
    })

  assert.equal(orderRes.status, 201)
  assert.equal(orderRes.body?.order?.legalConsent?.termsAccepted, true)
  assert.equal(orderRes.body?.order?.legalConsent?.termsVersion, '1.0')
  assert.ok(orderRes.body?.order?.legalConsent?.acceptedAt)
})

test('legal: user can export their personal data archive via GET /api/v1/auth/export-data', async () => {
  const email = uniqueEmail()
  const reg = await registerAndGetToken(http, {
    name: 'Privacy Minded User',
    email,
    password: 'Password123!',
  })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  const exportRes = await http
    .get('/api/v1/auth/export-data')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(exportRes.status, 200)
  assert.equal(exportRes.body?.ok, true)
  assert.equal(exportRes.body?.data?.user?.email, email)
  assert.equal(exportRes.body?.data?.exportMetadata?.platform, 'G-mart E-Commerce')
  assert.equal(exportRes.body?.data?.user?.termsAndPrivacyAccepted, true)
  assert.ok(Array.isArray(exportRes.body?.data?.orders))
  assert.ok(Array.isArray(exportRes.body?.data?.wishlist))
})
