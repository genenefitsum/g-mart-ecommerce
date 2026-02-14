import mongoose from 'mongoose'

let didConnect = false
let connectedDbName = ''

export async function setupTestDb(dbName = 'gmart_test') {
  process.env.NODE_ENV = 'test'
  process.env.MONGO_URI = `mongodb://127.0.0.1:27017/${dbName}`
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret'

  if (didConnect) {
    if (connectedDbName === dbName && mongoose.connection.readyState === 1) return

    const { disconnectMongo } = await import('../src/db/mongo.js')
    await disconnectMongo()
    didConnect = false
    connectedDbName = ''
  }

  const { connectMongo } = await import('../src/db/mongo.js')
  await connectMongo()
  didConnect = true
  connectedDbName = dbName
}

export async function resetTestDb() {
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db.collections()
    await Promise.all(collections.map((c) => c.deleteMany({})))
  }
}

export async function teardownTestDb() {
  if (!didConnect) return
  const { disconnectMongo } = await import('../src/db/mongo.js')
  await disconnectMongo()
  didConnect = false
  connectedDbName = ''
}
