import test from 'node:test'
import { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { agent, makeApp, registerAndGetToken, setUserRoleByEmail } from './helpers.js'
import { resetTestDb, setupTestDb, teardownTestDb } from './setup.js'

function uniqueEmail() {
  return `test${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

before(async () => {
  await setupTestDb('gmart_test_admin')
})

beforeEach(async () => {
  await resetTestDb()

  process.env.ADMIN_PAYMENT_TELEBIRR_PHONE = '+251911111111'
  process.env.ADMIN_PAYMENT_BANK_NAME = 'Legacy Bank'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NUMBER = '111222333'
  process.env.ADMIN_PAYMENT_BANK_ACCOUNT_NAME = 'Legacy Admin'
})

after(async () => {
  await teardownTestDb()
})

async function createAdminAndToken(http) {
  const email = uniqueEmail()
  const password = 'password123'

  const reg = await registerAndGetToken(http, {
    name: 'Admin User',
    email,
    password,
  })
  assert.equal(reg.status, 201)

  await setUserRoleByEmail(email, 'admin')

  const loginRes = await http
    .post('/api/v1/auth/login')
    .send({ email, password })

  assert.equal(loginRes.status, 200)
  assert.equal(loginRes.body?.user?.role, 'admin')

  return {
    token: loginRes.body.accessToken,
    userId: loginRes.body.user.id,
    email,
  }
}

async function createBuyerAndToken(http, name = 'Buyer User') {
  const email = uniqueEmail()
  const reg = await registerAndGetToken(http, {
    name,
    email,
    password: 'password123',
  })

  assert.equal(reg.status, 201)
  assert.equal(reg.body?.user?.role, 'buyer')

  return {
    token: reg.body.accessToken,
    userId: reg.body.user.id,
    email,
  }
}

async function createAdminProduct() {
  const { default: Product } = await import('../src/models/Product.js')
  return Product.create({
    name: 'Admin Catalog Product',
    price: 120,
    category: 'Test',
    description: 'Admin product for testing order administration',
    contactPhone: '+251900000000',
    imageUrl: 'http://localhost:4000/uploads/products/admin.jpg',
    images: ['http://localhost:4000/uploads/products/admin.jpg'],
    sellerUserId: null,
    isAdminProduct: true,
  })
}

async function createSellerProduct({ sellerUserId, name = 'Seller Product', category = 'Electronics' }) {
  const { default: Product } = await import('../src/models/Product.js')
  return Product.create({
    name,
    price: 350,
    category,
    description: 'Seller uploaded product for admin moderation tests',
    contactPhone: '+251955555555',
    imageUrl: 'http://localhost:4000/uploads/products/seller.jpg',
    images: ['http://localhost:4000/uploads/products/seller.jpg'],
    sellerUserId,
    isAdminProduct: false,
  })
}

test('admin: non-admin cannot access admin routes', async () => {
  const app = await makeApp()
  const http = agent(app)

  const buyer = await createBuyerAndToken(http)

  const usersRes = await http
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${buyer.token}`)

  assert.equal(usersRes.status, 403)
  assert.equal(usersRes.body?.ok, false)
})

test('admin: can list users and change roles with self-demote protection', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const buyer = await createBuyerAndToken(http, 'Regular Buyer')

  const listRes = await http
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(listRes.status, 200)
  assert.equal(listRes.body?.ok, true)
  assert.equal(Array.isArray(listRes.body?.users), true)
  assert.ok(listRes.body.users.some((user) => user.email === buyer.email.toLowerCase()))

  const promoteRes = await http
    .patch(`/api/v1/admin/users/${buyer.userId}/role`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'seller' })

  assert.equal(promoteRes.status, 200)
  assert.equal(promoteRes.body?.ok, true)
  assert.equal(promoteRes.body?.user?.role, 'seller')

  const selfDemoteRes = await http
    .patch(`/api/v1/admin/users/${admin.userId}/role`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'buyer' })

  assert.equal(selfDemoteRes.status, 400)
  assert.equal(selfDemoteRes.body?.ok, false)
})

test('admin: permanent admin cannot be demoted or deleted', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const protectedAdmin = await createBuyerAndToken(http, 'Protected Admin')

  const { default: User } = await import('../src/models/User.js')
  await User.updateOne(
    { email: protectedAdmin.email.toLowerCase() },
    { $set: { role: 'admin', isPermanentAdmin: true } },
  )

  const demoteRes = await http
    .patch(`/api/v1/admin/users/${protectedAdmin.userId}/role`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'buyer' })

  assert.equal(demoteRes.status, 403)
  assert.equal(demoteRes.body?.ok, false)

  const loginRes = await http
    .post('/api/v1/auth/login')
    .send({ email: protectedAdmin.email, password: 'password123' })

  assert.equal(loginRes.status, 200)
  assert.equal(loginRes.body?.user?.role, 'admin')

  const deleteRes = await http
    .delete('/api/v1/auth/account')
    .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
    .send({ password: 'password123' })

  assert.equal(deleteRes.status, 403)
  assert.equal(deleteRes.body?.ok, false)
})

test('admin: permanent-admin flag grants admin access even before role refresh', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const flagOnlyUser = await createBuyerAndToken(http, 'Flag Only Admin')

  const { default: User } = await import('../src/models/User.js')
  await User.updateOne(
    { email: flagOnlyUser.email.toLowerCase() },
    { $set: { isPermanentAdmin: true } },
  )

  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${flagOnlyUser.token}`)

  assert.equal(meRes.status, 200)
  assert.equal(meRes.body?.user?.isPermanentAdmin, true)

  const usersRes = await http
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${flagOnlyUser.token}`)

  assert.equal(usersRes.status, 200)
  assert.equal(usersRes.body?.ok, true)

  const demoteRes = await http
    .patch(`/api/v1/admin/users/${flagOnlyUser.userId}/role`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'buyer' })

  assert.equal(demoteRes.status, 403)
  assert.equal(demoteRes.body?.ok, false)
})

test('admin: can list and update order status', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const buyer = await createBuyerAndToken(http)
  const product = await createAdminProduct()

  const orderRes = await http
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shipping: {
        name: 'Buyer Name',
        phone: '+251900000001',
        addressLine1: 'Street 1',
        city: 'Addis Ababa',
      },
      payment: { method: 'telebirr', transactionRef: 'TX-ADMIN-1' },
    })

  assert.equal(orderRes.status, 201)
  const orderId = String(orderRes.body?.order?._id)

  const listOrdersRes = await http
    .get('/api/v1/admin/orders')
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(listOrdersRes.status, 200)
  assert.equal(listOrdersRes.body?.ok, true)
  assert.ok(listOrdersRes.body?.orders?.some((order) => String(order._id) === orderId))

  const updateStatusRes = await http
    .patch(`/api/v1/admin/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ status: 'processing' })

  assert.equal(updateStatusRes.status, 200)
  assert.equal(updateStatusRes.body?.ok, true)
  assert.equal(updateStatusRes.body?.order?.status, 'processing')
})

test('admin: can fetch summary and detailed order review data', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const buyer = await createBuyerAndToken(http)
  const product = await createAdminProduct()

  const orderRes = await http
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shipping: {
        name: 'Buyer Name',
        phone: '+251900000001',
        addressLine1: 'Street 1',
        city: 'Addis Ababa',
      },
      payment: { method: 'telebirr', transactionRef: 'TX-ADMIN-SUMMARY' },
    })

  assert.equal(orderRes.status, 201)
  const orderId = String(orderRes.body?.order?._id)

  const summaryRes = await http
    .get('/api/v1/admin/summary')
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(summaryRes.status, 200)
  assert.equal(summaryRes.body?.ok, true)
  assert.ok(Number(summaryRes.body?.summary?.counts?.orders ?? 0) >= 1)
  assert.ok(Array.isArray(summaryRes.body?.summary?.recentOrders))
  assert.ok(summaryRes.body?.summary?.recentOrders.some((order) => order.id === orderId))

  const detailRes = await http
    .get(`/api/v1/admin/orders/${orderId}`)
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(detailRes.status, 200)
  assert.equal(detailRes.body?.ok, true)
  assert.equal(detailRes.body?.order?.id, orderId)
  assert.equal(detailRes.body?.order?.buyer?.email, buyer.email.toLowerCase())
  assert.equal(detailRes.body?.order?.items?.[0]?.name, 'Admin Catalog Product')
})

test('admin: can list seller products and filter by seller', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const sellerA = await createBuyerAndToken(http, 'Seller A')
  const sellerB = await createBuyerAndToken(http, 'Seller B')

  await setUserRoleByEmail(sellerA.email, 'seller')
  await setUserRoleByEmail(sellerB.email, 'seller')

  const productA = await createSellerProduct({
    sellerUserId: sellerA.userId,
    name: 'Phone X',
    category: 'Phones',
  })
  await createSellerProduct({
    sellerUserId: sellerB.userId,
    name: 'Blender Prime',
    category: 'Kitchen',
  })

  const listRes = await http
    .get('/api/v1/admin/products')
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(listRes.status, 200)
  assert.equal(listRes.body?.ok, true)
  assert.equal(Array.isArray(listRes.body?.products), true)
  assert.ok(listRes.body.products.some((item) => item.name === 'Phone X'))

  const filteredRes = await http
    .get('/api/v1/admin/products')
    .query({ sellerId: sellerA.userId })
    .set('Authorization', `Bearer ${admin.token}`)

  assert.equal(filteredRes.status, 200)
  assert.equal(filteredRes.body?.ok, true)
  assert.equal(Array.isArray(filteredRes.body?.products), true)
  assert.equal(filteredRes.body.products.length, 1)
  assert.equal(filteredRes.body.products[0]?.id, String(productA._id))
  assert.equal(filteredRes.body.products[0]?.seller?.id, String(sellerA.userId))
})

test('admin: settings update drives checkout payment recipient', async () => {
  const app = await makeApp()
  const http = agent(app)

  const admin = await createAdminAndToken(http)
  const buyer = await createBuyerAndToken(http)

  const updateSettingsRes = await http
    .patch('/api/v1/admin/settings')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      paymentRecipient: {
        telebirrPhone: '+251977777777',
        bankName: 'Admin Bank',
        bankAccountNumber: '999888777',
        bankAccountName: 'Gmart Main Admin',
      },
      content: {
        storeName: 'G-mart Main',
        supportEmail: 'support@gmart.test',
        bannerMessage: 'Weekend Sale',
      },
    })

  assert.equal(updateSettingsRes.status, 200)
  assert.equal(updateSettingsRes.body?.ok, true)
  assert.equal(updateSettingsRes.body?.settings?.content?.storeName, 'G-mart Main')

  const recipientRes = await http
    .get('/api/v1/orders/payment-recipient')
    .set('Authorization', `Bearer ${buyer.token}`)

  assert.equal(recipientRes.status, 200)
  assert.equal(recipientRes.body?.ok, true)
  assert.equal(recipientRes.body?.recipient?.telebirrPhone, '+251977777777')
  assert.equal(recipientRes.body?.recipient?.bankAccountNumber, '999888777')
})
