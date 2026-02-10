import Product from '../models/Product.js'
import { connectMongo, disconnectMongo, getMongoStatus } from '../db/mongo.js'

const SAMPLE_PRODUCTS = [
  {
    name: 'Classic White Sneakers',
    price: 69.99,
    category: "Men's",
    description: 'Clean, comfortable everyday sneakers in great condition. Lightly used and easy to match with any outfit.',
    contactPhone: '+234 801 000 0001',
    imageUrl:
      'https://images.unsplash.com/photo-1528701800489-20be3c5d0c11?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    name: 'Minimal Leather Backpack',
    price: 89.0,
    category: 'Accessories',
    description: 'Minimalist genuine leather backpack with multiple compartments. Perfect for work, school, and short trips.',
    contactPhone: '+234 801 000 0002',
    imageUrl:
      'https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    name: 'Gold Chain Necklace',
    price: 129.5,
    category: 'Jewelry',
    description: 'Elegant gold-tone chain necklace. Great gift item. No rusting; clasp works perfectly.',
    contactPhone: '+234 801 000 0003',
    imageUrl:
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80',
    featured: false,
  },
  {
    name: 'Rose Gold Bracelet',
    price: 79.99,
    category: 'Jewelry',
    description: 'Rose-gold style bracelet with a sleek finish. Lightweight and comfortable for daily wear.',
    contactPhone: '+234 801 000 0004',
    imageUrl:
      'https://images.unsplash.com/photo-1617038220319-276ab780f47f?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    name: 'Stainless Steel Watch',
    price: 149.0,
    category: 'Watches',
    description: 'Stainless steel watch with a classic look. Battery recently replaced and keeps accurate time.',
    contactPhone: '+234 801 000 0005',
    imageUrl:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
    featured: false,
  },
  {
    name: 'Aviator Shades',
    price: 39.99,
    category: 'Eyewear',
    description: 'Aviator sunglasses with UV protection. Clean lenses and sturdy frame. Includes case.',
    contactPhone: '+234 801 000 0006',
    imageUrl:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    name: "Women's Denim Jacket",
    price: 59.0,
    category: "Women's",
    description: 'Stylish denim jacket in excellent condition. Comfortable fit and perfect for casual outfits.',
    contactPhone: '+234 801 000 0007',
    imageUrl:
      'https://images.unsplash.com/photo-1520975958225-6d4b1b0b7a1b?auto=format&fit=crop&w=900&q=80',
    featured: false,
  },
  {
    name: 'Sale: Weekend Tote Bag',
    price: 24.99,
    category: 'Sale',
    description: 'Spacious weekend tote bag at a discounted price. Durable material and comfortable shoulder straps.',
    contactPhone: '+234 801 000 0008',
    imageUrl:
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80',
    featured: false,
  },
]

async function main() {
  const force = process.argv.includes('--force')

  const status = getMongoStatus()
  if (!status.enabled) {
    console.error('MongoDB disabled (set MONGO_URI to enable seeding)')
    process.exit(1)
  }

  await connectMongo()

  const existingCount = await Product.countDocuments()
  if (existingCount > 0 && !force) {
    console.log(`Products already exist (${existingCount}). Skipping seed.`)
    await disconnectMongo()
    return
  }

  if (force && existingCount > 0) {
    await Product.deleteMany({})
  }

  const inserted = await Product.insertMany(
    SAMPLE_PRODUCTS.map((p) => ({
      ...p,
      sellerUserId: null,
    })),
  )

  console.log(`Seeded ${inserted.length} products.`)
  await disconnectMongo()
}

main().catch(async (err) => {
  console.error(err)
  try {
    await disconnectMongo()
  } catch {
    // ignore
  }
  process.exit(1)
})
