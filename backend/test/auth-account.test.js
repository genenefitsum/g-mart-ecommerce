import test from 'node:test'
import { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { agent, makeApp, loginAndGetToken, registerAndGetToken } from './helpers.js'
import { resetTestDb, setupTestDb, teardownTestDb } from './setup.js'

function uniqueEmail() {
  return `test${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

before(async () => {
  await setupTestDb('gmart_test_auth')
})

beforeEach(async () => {
  await resetTestDb()
})

after(async () => {
  await teardownTestDb()
})

test('auth: register -> me -> logout blocks refresh', async () => {
  const app = await makeApp()
  const http = agent(app)

  const email = uniqueEmail()
  const password = 'password123'

  const reg = await registerAndGetToken(http, { name: 'Test User', email, password })
  assert.equal(reg.status, 201)
  assert.equal(reg.body?.ok, true)
  assert.ok(reg.body?.accessToken)

  const token = reg.body.accessToken

  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(meRes.status, 200)
  assert.equal(meRes.body?.ok, true)
  assert.equal(meRes.body?.user?.email, email.toLowerCase())

  const logoutRes = await http.post('/api/v1/auth/logout')
  assert.equal(logoutRes.status, 200)
  assert.equal(logoutRes.body?.ok, true)

  const refreshRes = await http.post('/api/v1/auth/refresh')
  assert.equal(refreshRes.status, 401)
})

test('account: PATCH /auth/me updates name', async () => {
  const app = await makeApp()
  const http = agent(app)

  const email = uniqueEmail()
  const password = 'password123'

  const reg = await registerAndGetToken(http, { name: 'Old Name', email, password })
  assert.equal(reg.status, 201)

  const token = reg.body.accessToken

  const patchRes = await http
    .patch('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'New Name' })

  assert.equal(patchRes.status, 200)
  assert.equal(patchRes.body?.ok, true)
  assert.equal(patchRes.body?.user?.name, 'New Name')
})

test('account: change password revokes refresh and new login works', async () => {
  const app = await makeApp()
  const http = agent(app)

  const email = uniqueEmail()
  const password1 = 'password123'
  const password2 = 'password456'

  const reg = await registerAndGetToken(http, { name: 'Test', email, password: password1 })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  const changeRes = await http
    .post('/api/v1/auth/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send({ currentPassword: password1, newPassword: password2 })

  assert.equal(changeRes.status, 200)
  assert.equal(changeRes.body?.ok, true)
  assert.equal(changeRes.body?.requiresReauth, true)

  // Refresh should fail because refresh tokens were revoked and cookie was cleared.
  const refreshRes = await http.post('/api/v1/auth/refresh')
  assert.equal(refreshRes.status, 401)

  // Login with new password should work.
  const loginRes = await loginAndGetToken(http, { email, password: password2 })
  assert.equal(loginRes.status, 200)
  assert.equal(loginRes.body?.ok, true)
  assert.ok(loginRes.body?.accessToken)
})

test('account: delete account prevents future login', async () => {
  const app = await makeApp()
  const http = agent(app)

  const email = uniqueEmail()
  const password = 'password123'

  const reg = await registerAndGetToken(http, { name: 'Test', email, password })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  const delRes = await http
    .delete('/api/v1/auth/account')
    .set('Authorization', `Bearer ${token}`)
    .send({ password })

  assert.equal(delRes.status, 200)
  assert.equal(delRes.body?.ok, true)

  const loginRes = await loginAndGetToken(http, { email, password })
  assert.equal(loginRes.status, 401)
})

test('auth: deleted user cannot use previously issued access token', async () => {
  const app = await makeApp()
  const http = agent(app)

  const email = uniqueEmail()
  const password = 'password123'

  const reg = await registerAndGetToken(http, { name: 'Temp User', email, password })
  assert.equal(reg.status, 201)
  const token = reg.body.accessToken

  const { default: User } = await import('../src/models/User.js')
  await User.deleteOne({ email: email.toLowerCase() })

  const meRes = await http
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(meRes.status, 401)
  assert.equal(meRes.body?.ok, false)
})
