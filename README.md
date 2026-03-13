# G-Mart

G-Mart is a full-stack e-commerce app with a React frontend and an Express + MongoDB backend.

## Features

- User authentication (email/password + Google Sign-In)
- Product create, update, delete, and detail pages
- Buyer ratings for products and sellers (stars 1-5)
- Image upload support (Cloudinary when configured)
- Cart and checkout flow
- Orders and admin management endpoints
- Role-based access (`buyer`, `seller`, `admin`)

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express, MongoDB (Mongoose)
- Media: Cloudinary

## Project Structure

- `frontend` → React app
- `backend` → API server
- Root workspace uses npm workspaces to run both apps

## Prerequisites

- Node.js 22+
- npm
- MongoDB database

## Installation

```bash
npm install
```

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Optional
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary (optional, enables cloud uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Keep-alive cron (optional)
KEEP_ALIVE_ENABLED=false
KEEP_ALIVE_TARGET_URL=https://g-mart-ecommerce-1.onrender.com/healthz
KEEP_ALIVE_CRON=*/14 * * * *
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Run the Project

From the root folder:

```bash
# Frontend dev server
npm run dev

# Backend dev server
npm run dev:api
```



3. Sign out and sign in again.

## Deployment Notes

- Set all required environment variables in your hosting platform.
- Cloudinary is recommended in production for product images.
- `vercel.json` files are included for frontend/backend deployment setup.
- The keep-alive scheduler only runs while the Node process is already alive. If your host fully suspends the service when idle, use an external cron source to hit `KEEP_ALIVE_TARGET_URL` instead.

## Ratings API (v1)

- Product rating submit/update: `PUT /api/v1/ratings/products/:productId` body `{ "stars": 1..5 }`
- Product rating summary: `GET /api/v1/ratings/products/:productId/summary`
- Product current user rating: `GET /api/v1/ratings/products/:productId/me`
- Seller rating submit/update: `PUT /api/v1/ratings/sellers/:sellerUserId` body `{ "stars": 1..5 }`
- Seller rating summary: `GET /api/v1/ratings/sellers/:sellerUserId/summary`
- Seller current user rating: `GET /api/v1/ratings/sellers/:sellerUserId/me`

Eligibility rule for current release:
- Buyers can rate products/sellers after they have sent a product interest for that seller listing.

---
