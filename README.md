# 🛒 G-Mart — Modern E-Commerce Website

G-Mart is a modern, responsive e-commerce web application built with **React**, **Vite**, and **Tailwind CSS**.  
It provides a smooth shopping experience with fast performance, clean UI, and scalable architecture.

---

## 🚀 Features

- 🛍️ Product listing and product details
- 🔍 Search and category filtering
- 🛒 Shopping cart functionality
- 👤 User authentication (planned)
- 💳 Checkout & payment integration (planned)
- 📦 Order management (planned)
- 📱 Fully responsive design
- ⚡ Fast development with Vite

---

## 🧰 Tech Stack

### Frontend
- **React 19**
- **Vite**
- **React Router DOM**
- **Axios**
- **Tailwind CSS**
- **React Icons**

### Tooling
- ESLint
- PostCSS
- Autoprefixer

---

## 🔐 Admin Account (Backend-First)

G-mart supports role-based access with `buyer`, `seller`, and `admin`.

- Public signup always creates `buyer` users.
- The first admin should be created by manually promoting an existing user in MongoDB.

### One-time admin bootstrap (manual)

1. Register a normal account from the app.
2. In MongoDB shell, update that user role:

```js
db.users.updateOne(
	{ email: "your-email@example.com" },
	{ $set: { role: "admin" } }
)
```

3. Log out and log in again so a new access token is issued with `role: admin`.

### Admin API surface

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:userId/role`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:orderId/status`
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`

All `admin` endpoints require a valid Bearer token from an admin account.

---
