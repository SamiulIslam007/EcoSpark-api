

# 🌿 EcoSpark Hub — API

**A community-driven platform for sharing and funding sustainability ideas**

[TypeScript](https://www.typescriptlang.org/)
[Node.js](https://nodejs.org/)
[Express](https://expressjs.com/)
[Prisma](https://www.prisma.io/)
[PostgreSQL](https://www.postgresql.org/)
[Vercel](https://vercel.com/)



---

## 📖 Overview

EcoSpark Hub is a RESTful API backend that powers a sustainability idea-sharing platform. Users can post eco-friendly ideas, vote and comment on them, and purchase premium content. An admin workflow handles idea moderation — from draft through review, approval or rejection.

Key capabilities:

- **Authentication** via [Better Auth](https://better-auth.com) (sessions, OAuth, email/password)
- **Idea lifecycle** — draft → under review → approved/rejected
- **Paid ideas** — Stripe-powered purchases with webhook verification
- **Media uploads** — Multer (memory) → Cloudinary pipeline
- **Voting & commenting** — per-idea community engagement
- **Admin dashboard** — full content moderation with feedback

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── config/          # better-auth setup, environment config
│   ├── errors/          # AppError, global error handler
│   ├── interfaces/      # Shared TypeScript interfaces
│   ├── middlewares/     # auth guard, admin guard, upload, error handler
│   ├── modules/         # Feature modules (controller → service → Prisma)
│   │   ├── admin/
│   │   ├── category/
│   │   ├── comment/
│   │   ├── idea/
│   │   ├── payment/
│   │   └── vote/
│   ├── routes/          # Central route aggregator
│   └── utils/           # catchAsync, sendResponse, cloudinary, validateEnv
├── app.ts               # Express app bootstrap
└── server.ts            # Entry point (local dev)
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Realistic seed data (12 ideas, 5 users, categories)
```

Each module follows the layered pattern:

```
idea.routes.ts  →  idea.controller.ts  →  idea.service.ts  →  Prisma
```

---

## ⚙️ Tech Stack


| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Runtime    | Node.js 20+                                     |
| Language   | TypeScript 5 (ESM, `moduleResolution: bundler`) |
| Framework  | Express 4                                       |
| ORM        | Prisma 7 with `@prisma/adapter-pg`              |
| Database   | PostgreSQL 15+ (Neon / Supabase recommended)    |
| Auth       | Better Auth                                     |
| Payments   | Stripe (webhooks + checkout)                    |
| Media      | Cloudinary (upload) + Multer (memory buffer)    |
| Deployment | Vercel Serverless (`@vercel/node`)              |


---

## 🗄️ Database Schema

```
User ──< Session
User ──< Account        (better-auth OAuth accounts)
User ──< Idea
User ──< Vote
User ──< Purchase
User ──< Comment

Category ──< Idea
Idea ──< Vote
Idea ──< Purchase
Idea ──< Comment

Enums:
  Role        → MEMBER | ADMIN
  IdeaStatus  → DRAFT | UNDER_REVIEW | APPROVED | REJECTED
  VoteType    → UPVOTE | DOWNVOTE
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or a hosted provider like [Neon](https://neon.tech))
- Cloudinary account
- Stripe account (for payment features)

### 1. Clone & Install

```bash
git clone https://github.com/SamiulIslam007/EcoSpark-api.git
cd ecospark-api
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="a-long-random-secret"
BETTER_AUTH_URL="http://localhost:5000"
CLIENT_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Server
PORT=5000
NODE_ENV=development
```

### 3. Set Up the Database

```bash
# Push schema to your database
npx prisma db push

# (Optional) Seed with realistic demo data
npx ts-node --esm prisma/seed.ts
```

The seed script creates:

- 8 sustainability categories
- 5 users (1 admin + 4 members)
- 12 ideas (mix of free & paid, approved/draft/rejected) with Unsplash images
- Votes, comments, and newsletter subscribers

### 4. Run Locally

```bash
# Development (with ts-node)
npm run dev

# Build and run compiled output
npm run build
npm start
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

Better Auth handles auth at `/api/v1/auth/*` (same `/api/v1` prefix as the REST API). See [Better Auth docs](https://better-auth.com/docs) for details on email/password, OAuth, and session management.

---

### Categories


| Method   | Endpoint          | Auth  | Description         |
| -------- | ----------------- | ----- | ------------------- |
| `GET`    | `/categories`     | —     | List all categories |
| `POST`   | `/categories`     | Admin | Create a category   |
| `PATCH`  | `/categories/:id` | Admin | Update a category   |
| `DELETE` | `/categories/:id` | Admin | Delete a category   |


---

### Ideas


| Method   | Endpoint             | Auth     | Description                                         |
| -------- | -------------------- | -------- | --------------------------------------------------- |
| `GET`    | `/ideas`             | —        | List all approved ideas (with filters)              |
| `GET`    | `/ideas/:id`         | Optional | Get idea detail (auth/purchase gate for paid ideas) |
| `GET`    | `/ideas/my`          | Member   | Get my own ideas                                    |
| `POST`   | `/ideas`             | Member   | Create a new idea (supports image upload)           |
| `PATCH`  | `/ideas/:id`         | Member   | Update a draft idea (supports image upload)         |
| `DELETE` | `/ideas/:id`         | Member   | Delete a draft idea                                 |
| `PATCH`  | `/ideas/:id/submit`  | Member   | Submit idea for admin review                        |
| `PATCH`  | `/ideas/:id/approve` | Admin    | Approve an idea                                     |
| `PATCH`  | `/ideas/:id/reject`  | Admin    | Reject with feedback                                |
| `GET`    | `/ideas/admin/all`   | Admin    | List all ideas with full details                    |


**Query params for `GET /ideas`:**


| Param      | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| `page`     | number  | Page number (default: 1)                          |
| `limit`    | number  | Items per page (default: 10)                      |
| `category` | string  | Filter by category slug                           |
| `search`   | string  | Full-text search on title/description             |
| `sort`     | string  | `newest` | `popular` | `price-asc` | `price-desc` |
| `isPaid`   | boolean | Filter free or paid ideas                         |


**Image uploads** use `multipart/form-data` with field name `images` (max 5 files, 5 MB each). Files are uploaded to Cloudinary automatically.

---

### Votes


| Method | Endpoint | Auth   | Description                      |
| ------ | -------- | ------ | -------------------------------- |
| `POST` | `/votes` | Member | Cast or toggle a vote on an idea |


```json
// POST /api/v1/votes
{ "ideaId": "...", "type": "UPVOTE" }
```

---

### Comments


| Method   | Endpoint               | Auth         | Description              |
| -------- | ---------------------- | ------------ | ------------------------ |
| `GET`    | `/comments?ideaId=...` | —            | Get comments for an idea |
| `POST`   | `/comments`            | Member       | Post a comment           |
| `DELETE` | `/comments/:id`        | Member/Admin | Delete a comment         |


---

### Payments


| Method | Endpoint                    | Auth   | Description                      |
| ------ | --------------------------- | ------ | -------------------------------- |
| `POST` | `/payments/create-checkout` | Member | Create a Stripe checkout session |
| `POST` | `/payments/webhook`         | —      | Stripe webhook (raw body)        |
| `GET`  | `/payments/my-purchases`    | Member | List user's purchased ideas      |


---

### Admin


| Method  | Endpoint                         | Auth  | Description                   |
| ------- | -------------------------------- | ----- | ----------------------------- |
| `GET`   | `/admin/users`                   | Admin | List all users                |
| `PATCH` | `/admin/users/:id/toggle-active` | Admin | Activate/deactivate a user    |
| `PATCH` | `/admin/users/:id/role`          | Admin | Change user role              |
| `GET`   | `/admin/stats`                   | Admin | Platform statistics dashboard |


---

## 🌐 Deployment (Vercel)

### Environment Variables

In your Vercel project dashboard → **Settings → Environment Variables**, add all variables from `.env.example`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` ← set to your production API URL
- `CLIENT_URL` ← set to your frontend URL
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Build & Output

```bash
npm run build   # runs tsc → outputs to dist/src/
```

`vercel.json` routes all requests to `dist/src/server.js`:

```json
{
  "version": 2,
  "builds": [{ "src": "dist/src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/src/server.js" }]
}
```

### Stripe Webhooks

After deploying, register your webhook endpoint in the Stripe Dashboard:

```
https://your-api.vercel.app/api/v1/payments/webhook
```

Select the event `checkout.session.completed`.

---

## 🧪 Seed Data

The seed script (`prisma/seed.ts`) populates the database with realistic demo content:

```bash
npx ts-node --esm prisma/seed.ts
```

**What gets created:**


| Resource               | Count | Notes                                                             |
| ---------------------- | ----- | ----------------------------------------------------------------- |
| Categories             | 8     | Renewable Energy, Waste Reduction, Sustainable Agriculture, etc.  |
| Users                  | 5     | 1 admin (`admin@admin.com`) + 4 members                           |
| Ideas                  | 12    | Mix of free & paid, approved/draft/rejected, with Unsplash images |
| Votes                  | ~20   | Distributed across approved ideas                                 |
| Comments               | 6     | Contextual sustainability discussions                             |
| Newsletter subscribers | 3     | —                                                                 |


**Admin credentials** (for demo / testing after seed):

```json
{
  "name": "Admin",
  "email": "admin@admin.com",
  "password": "Admin123"
}
```

**Member credentials** (demo member after seed):

```json
{
  "email": "samiul@gmail.com",
  "password": "Samiul123"
}
```

> The seed uses idempotent upserts — safe to run multiple times without creating duplicates. Other seeded members use password `Password123!` (see console output after `npm run db:seed`).

---

## 🖼️ Media Uploads

Images are stored on **Cloudinary** under the `ecospark/` folder.

**Upload flow:**

```
Client (multipart/form-data)
  → Multer (memory buffer, max 5 files × 5 MB)
  → uploadToCloudinary(buffer)
  → Cloudinary CDN URL stored in DB
```

**Supported formats:** JPEG, PNG, WebP, GIF (any `image/`* MIME type)

---

## 🔐 Authentication Flow

EcoSpark uses **Better Auth** for all authentication concerns:

```
POST /api/v1/auth/sign-up/email   → Register
POST /api/v1/auth/sign-in/email   → Login
POST /api/v1/auth/sign-out        → Logout
GET  /api/v1/auth/get-session     → Current session
```

Protected routes use the `protect` middleware, which reads the session from the `Authorization` header or session cookie. Admin routes additionally use `adminOnly` middleware.

---

## 📁 Project Structure Reference

```
ecospark-api/
├── prisma/
│   ├── schema.prisma          # DB models & enums
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── index.ts       # better-auth instance
│   │   ├── errors/
│   │   │   └── AppError.ts    # Custom HTTP error class
│   │   ├── interfaces/        # Shared TS interfaces
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── adminOnly.middleware.ts
│   │   │   ├── upload.middleware.ts  # Multer config
│   │   │   ├── globalError.middleware.ts
│   │   │   └── notFound.middleware.ts
│   │   ├── modules/
│   │   │   ├── admin/         # User management & stats
│   │   │   ├── category/      # Category CRUD
│   │   │   ├── comment/       # Idea comments
│   │   │   ├── idea/          # Core idea lifecycle
│   │   │   ├── payment/       # Stripe integration
│   │   │   └── vote/          # Voting system
│   │   ├── routes/
│   │   │   └── index.ts       # Route aggregator
│   │   └── utils/
│   │       ├── catchAsync.ts
│   │       ├── cloudinary.ts  # Upload & delete helpers
│   │       ├── sendResponse.ts
│   │       └── validateEnv.ts
│   ├── app.ts                 # Express setup & middleware
│   └── server.ts              # Local server entry point
├── .env.example
├── prisma.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

Please follow the existing module structure: add new features as a `src/app/modules/<feature>/` folder with `routes`, `controller`, `service`, and `interface` files.

---

## 📄 License

This project is licensed under the **MIT License**.

---

Made with 💚 for a greener planet