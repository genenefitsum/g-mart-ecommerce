import supertest from 'supertest'

export async function makeApp() {
  const { createServer } = await import('../src/server.js')
  return createServer()
}

export async function registerAndGetToken(agent, { name, email, password, termsAndPrivacyAccepted = true }) {
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name, email, password, termsAndPrivacyAccepted })

  return { status: res.status, body: res.body }
}

export async function loginAndGetToken(agent, { email, password }) {
  const res = await agent
    .post('/api/v1/auth/login')
    .send({ email, password })

  return { status: res.status, body: res.body }
}

export async function setUserRoleByEmail(email, role) {
  const { default: User } = await import('../src/models/User.js')
  await User.updateOne(
    { email: String(email ?? '').trim().toLowerCase() },
    { $set: { role: String(role ?? '').trim().toLowerCase() } },
  )
}

export function agent(app) {
  return supertest.agent(app)
}
