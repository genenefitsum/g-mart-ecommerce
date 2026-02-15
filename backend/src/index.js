import { createServer } from './server.js'
import { connectMongo } from './db/mongo.js'
import AuthIdentity from './models/AuthIdentity.js'

const port = Number(process.env.PORT ?? 4000)
const host = '0.0.0.0'

const app = createServer()

try {
  await connectMongo()
  if (process.env.MONGO_URI) {
    if (process.env.NODE_ENV !== 'production') {
      await AuthIdentity.syncIndexes()
    }
    // eslint-disable-next-line no-console
    console.log('MongoDB connected')
  } else {
    // eslint-disable-next-line no-console
    console.log('MongoDB disabled (set MONGO_URI to enable)')
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection failed')
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
}

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${host}:${port}`)
})
