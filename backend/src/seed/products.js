import 'dotenv/config'
import Product from '../models/Product.js'
import { connectMongo, disconnectMongo, getMongoStatus } from '../db/mongo.js'

const DEMO_SELLER_PAYMENT = {
  telebirrPhone: '+251 911 223 344',
  bankName: 'CBE',
  bankAccountNumber: '1000123456789',
  bankAccountName: 'G-mart Demo Seller',
}

const SAMPLE_PRODUCTS = [
  {
    name: 'Classic White Sneakers',
    price: 69.99,
    category: "Men's",
    description: 'Clean, comfortable everyday sneakers in great condition. Lightly used and easy to match with any outfit.',
    contactPhone: '+234 801 000 0001',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1528701800489-20be3c5d0c11?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Minimal Leather Backpack',
    price: 89.0,
    category: 'Accessories',
    description: 'Minimalist genuine leather backpack with multiple compartments. Perfect for work, school, and short trips.',
    contactPhone: '+234 801 000 0002',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Gold Chain Necklace',
    price: 129.5,
    category: 'Jewelry',
    description: 'Elegant gold-tone chain necklace. Great gift item. No rusting; clasp works perfectly.',
    contactPhone: '+234 801 000 0003',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Rose Gold Bracelet',
    price: 79.99,
    category: 'Jewelry',
    description: 'Rose-gold style bracelet with a sleek finish. Lightweight and comfortable for daily wear.',
    contactPhone: '+234 801 000 0004',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1617038220319-276ab780f47f?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Stainless Steel Watch',
    price: 149.0,
    category: 'Watches',
    description: 'Stainless steel watch with a classic look. Battery recently replaced and keeps accurate time.',
    contactPhone: '+234 801 000 0005',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Aviator Shades',
    price: 39.99,
    category: 'Eyewear',
    description: 'Aviator sunglasses with UV protection. Clean lenses and sturdy frame. Includes case.',
    contactPhone: '+234 801 000 0006',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: "Women's Denim Jacket",
    price: 59.0,
    category: "Women's",
    description: 'Stylish denim jacket in excellent condition. Comfortable fit and perfect for casual outfits.',
    contactPhone: '+234 801 000 0007',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1520975958225-6d4b1b0b7a1b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Sale: Weekend Tote Bag',
    price: 24.99,
    category: 'Sale',
    description: 'Spacious weekend tote bag at a discounted price. Durable material and comfortable shoulder straps.',
    contactPhone: '+234 801 000 0008',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80',
  },

  // More Men's
  {
    name: "Men's Slim Fit Chinos",
    price: 34.5,
    category: "Men's",
    description: 'Comfortable slim-fit chinos with a clean look. Great for work or casual wear. No stains or tears.',
    contactPhone: '+234 801 000 0009',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: "Men's Hoodie (Black)",
    price: 29.99,
    category: "Men's",
    description: 'Soft fleece hoodie in black. Warm and cozy, lightly worn. Perfect for evenings and travel.',
    contactPhone: '+234 801 000 0010',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: "Men's Leather Belt",
    price: 18.0,
    category: "Men's",
    description: 'Genuine leather belt with a sturdy buckle. Classic style that fits most outfits.',
    contactPhone: '+234 801 000 0011',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=900&q=80',
  },

  // More Women's
  {
    name: "Women's Summer Dress",
    price: 41.99,
    category: "Women's",
    description: 'Flowy summer dress with a flattering fit. Light fabric, great for warm weather and outings.',
    contactPhone: '+234 801 000 0012',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1520975869015-6a26b0b2f78a?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: "Women's Handbag (Tan)",
    price: 54.0,
    category: "Women's",
    description: 'Stylish tan handbag with lots of space. Zippers work perfectly. Minimal wear.',
    contactPhone: '+234 801 000 0013',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: "Women's White Sneakers",
    price: 49.5,
    category: "Women's",
    description: 'Clean white sneakers with comfortable insoles. Great daily shoes, lightly used.',
    contactPhone: '+234 801 000 0014',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },

  // Accessories
  {
    name: 'Wireless Earbuds Case',
    price: 9.99,
    category: 'Accessories',
    description: 'Protective silicone case for wireless earbuds. Fits common models. New condition.',
    contactPhone: '+234 801 000 0015',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Travel Water Bottle (Stainless)',
    price: 14.99,
    category: 'Accessories',
    description: 'Insulated stainless steel bottle. Keeps drinks cold/hot. No dents, barely used.',
    contactPhone: '+234 801 000 0016',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1526401485004-2fda9f6fb76b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Laptop Sleeve 13"',
    price: 12.5,
    category: 'Accessories',
    description: 'Soft padded laptop sleeve for 13-inch devices. Clean and well maintained.',
    contactPhone: '+234 801 000 0017',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80',
  },

  // Sale
  {
    name: 'Sale: Graphic T-Shirt Pack (2)',
    price: 15.0,
    category: 'Sale',
    description: 'Two comfortable graphic tees. Good condition. Great value bundle.',
    contactPhone: '+234 801 000 0018',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1520975682030-1e3dcf3f2fd4?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Sale: Casual Cap',
    price: 6.99,
    category: 'Sale',
    description: 'Simple casual cap. Clean and adjustable. Discounted price for quick sale.',
    contactPhone: '+234 801 000 0019',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1520975607367-4fa5c1b6d9a2?auto=format&fit=crop&w=900&q=80',
  },

  // Electronics
  {
    name: 'Bluetooth Speaker',
    price: 27.99,
    category: 'Electronics',
    description: 'Portable bluetooth speaker with good bass. Battery lasts long. Includes charging cable.',
    contactPhone: '+234 801 000 0020',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Mechanical Keyboard',
    price: 64.0,
    category: 'Electronics',
    description: 'Compact mechanical keyboard with tactile switches. Fully working. Great for coding and gaming.',
    contactPhone: '+234 801 000 0021',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'LED Desk Lamp',
    price: 19.99,
    category: 'Electronics',
    description: 'Adjustable LED desk lamp with multiple brightness levels. Great for reading and work.',
    contactPhone: '+234 801 000 0022',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
  },

  // Home
  {
    name: 'Ceramic Dinner Plate Set',
    price: 22.0,
    category: 'Home',
    description: 'Set of 4 ceramic dinner plates. No cracks. Minimal scratches, great for everyday meals.',
    contactPhone: '+234 801 000 0023',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Throw Pillow Covers (2)',
    price: 10.0,
    category: 'Home',
    description: 'Two soft pillow covers with zipper. Clean and stylish, perfect for living room refresh.',
    contactPhone: '+234 801 000 0024',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Non-stick Frying Pan',
    price: 16.5,
    category: 'Home',
    description: 'Non-stick pan in good condition. Even heating and easy to clean. No peeling.',
    contactPhone: '+234 801 000 0025',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
  },

  // Beauty
  {
    name: 'Skincare Starter Kit',
    price: 25.0,
    category: 'Beauty',
    description: 'Basic skincare bundle (cleanser + moisturizer). Sealed and unused. Great for beginners.',
    contactPhone: '+234 801 000 0026',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Hair Dryer',
    price: 18.99,
    category: 'Beauty',
    description: 'Hair dryer with two heat settings. Works perfectly. Clean and well maintained.',
    contactPhone: '+234 801 000 0027',
    sellerPayment: DEMO_SELLER_PAYMENT,
    imageUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  },

  // Kids
  {
    name: 'Kids Backpack',
    price: 13.99,
    category: 'Kids',
    description: 'Lightweight kids backpack with fun design. Durable zips. Clean inside and out.',
    contactPhone: '+234 801 000 0028',
    imageUrl:
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Kids Sneakers',
    price: 21.0,
    category: 'Kids',
    description: 'Comfortable kids sneakers. Good grip and cushioning. Lightly used.',
    contactPhone: '+234 801 000 0029',
    imageUrl:
      'https://images.unsplash.com/photo-1528701800489-20be3c5d0c11?auto=format&fit=crop&w=900&q=80',
  },

  // Sports
  {
    name: 'Yoga Mat',
    price: 12.0,
    category: 'Sports',
    description: 'Non-slip yoga mat. Clean and lightly used. Great for home workouts.',
    contactPhone: '+234 801 000 0030',
    imageUrl:
      'https://images.unsplash.com/photo-1599447292180-45b684bcc6c8?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Dumbbell Pair (2 x 5kg)',
    price: 28.0,
    category: 'Sports',
    description: 'Pair of 5kg dumbbells. Great for strength training. Solid grip, no damage.',
    contactPhone: '+234 801 000 0031',
    imageUrl:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
  },

  // Books
  {
    name: 'Productivity Book Bundle (3)',
    price: 17.5,
    category: 'Books',
    description: 'Three popular productivity books. Clean pages, no missing chapters. Great value set.',
    contactPhone: '+234 801 000 0032',
    imageUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Beginner JavaScript Guide',
    price: 9.0,
    category: 'Books',
    description: 'Beginner-friendly JavaScript book. Clean condition and easy to follow.',
    contactPhone: '+234 801 000 0033',
    imageUrl:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
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
