import supertest from 'supertest'

export async function makeApp() {
  const { createServer } = await import('../src/server.js')
  return createServer()
}

export async function registerAndGetToken(agent, { name, email, password }) {
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name, email, password })

  return { status: res.status, body: res.body }
}

export async function loginAndGetToken(agent, { email, password }) {
  const res = await agent
    .post('/api/v1/auth/login')
    .send({ email, password })

  return { status: res.status, body: res.body }
}

export function agent(app) {
  return supertest.agent(app)
}
