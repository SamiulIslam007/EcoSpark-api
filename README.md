<div align="center">

# 🌿 EcoSpark Hub — Backend API

**RESTful API powering the EcoSpark Hub sustainability ideas platform.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.0-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-21.0-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

[🌐 Live API](https://ecospark-api.vercel.app) · [🖥 Frontend Repo](../ecospark-web) · [📋 Report Bug](#)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Authentication](#-authentication)
- [Payment Flow](#-payment-flow)
- [Image Uploads](#-image-uploads)
- [Deployment](#-deployment)

---

## 🌱 About

EcoSpark API is the Express 5 backend for EcoSpark Hub. It provides:

- **Full CRUD** for sustainability ideas with a multi-stage review workflow
- **Session-based authentication** via Better Auth with PostgreSQL session storage
- **Stripe-powered payments** for monetised ideas (checkout + webhook)
- **Cloudinary image uploads** streamed from server memory via Multer
- **Threaded comments** with nested replies (up to 3 levels)
- **Role-based access control** — `MEMBER` and `ADMIN` roles
- **Admin moderation** — approve/reject ideas, manage users and categories

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | [Node.js 20+](https://nodejs.org/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (ESM) |
| **Framework** | [Express 5](https://expressjs.com/) |
| **ORM** | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| **Database** | [PostgreSQL 15+](https://www.postgresql.org/) |
| **Authentication** | [Better Auth 1.5.6](https://www.better-auth.com/) (email/password + sessions) |
| **Payments** | [Stripe 21.0](https://stripe.com/) (Checkout Sessions + Webhooks) |
| **File Upload** | [Multer 1.4](https://github.com/expressjs/multer) (memory storage) → [Cloudinary 2.6](https://cloudinary.com/) |
| **Security** | [Helmet 8.1](https://helmetjs.github.io/), [CORS 2.8](https://github.com/expressjs/cors) |
| **Logging** | [Morgan 1.10](https://github.com/expressjs/morgan) |
| **Deployment** | [Vercel](https://vercel.com/) (serverless via `@vercel/node`) |

---

## 📁 Project Structure

```
ecospart-api/
├── src/
│   ├── server.ts                    # Entry point (local dev)
│   ├── app.ts                       # Express app bootstrap (CORS, middleware, routes)
│   └── app/
│       ├── config/
│       │   ├── index.ts             # Better Auth configuration
│       │   └── validateEnv.ts       # Startup env validation (throws if missing)
│       ├── lib/
│       │   ├── prisma.ts            # Prisma client singleton
│       │   ├── cloudinary.ts        # Cloudinary upload / delete utilities
│       │   └── catchAsync.ts        # Async error wrapper (eliminates try/catch boilerplate)
│       ├── middleware/
│       │   ├── auth.middleware.ts   # `protect` — validates session, attaches req.user
│       │   ├── adminOnly.middleware.ts  # `adminOnly` — rejects non-ADMIN
│       │   ├── upload.middleware.ts # Multer config (5 MB, images only, memory storage)
│       │   ├── globalError.middleware.ts  # Global error handler
│       │   └── notFound.middleware.ts     # 404 handler
│       ├── module/                  # Feature modules (controller / service / route / interface)
│       │   ├── admin/               # Admin stats, user management, newsletter
│       │   ├── category/            # Category CRUD
│       │   ├── comment/             # Threaded comments
│       │   ├── idea/                # Idea CRUD + status workflow
│       │   ├── payment/             # Stripe checkout + webhook
│       │   ├── upload/              # Image upload to Cloudinary
│       │   └── vote/                # Upvote / downvote
│       ├── routes/
│       │   └── index.ts             # Central route aggregator
│       ├── utils/
│       │   ├── sendResponse.ts      # Standardised JSON response helper
│       │   └── trustedOrigins.ts    # CORS origin builder from env
│       ├── interfaces/
│       │   └── common.interface.ts
│       └── errorHelpers/
│           └── AppError.ts          # Custom error class
│
├── prisma/
│   ├── schema.prisma                # Database schema (all models)
│   └── seed.ts                      # Demo data seeder
│
├── dist/                            # Compiled JavaScript (git-ignored)
├── vercel.json                      # Vercel deployment config
├── .env.example                     # Environment variable template
├── tsconfig.json
└── package.json
```

---

## 🗄 Database Schema

### Models Overview

```
User ──────┬──── ideas    ──── Idea ──┬──── votes    ──── Vote
           ├──── votes                ├──── comments ──── Comment (nested)
           ├──── purchases            ├──── purchases──── Purchase
           ├──── comments             └──── category ──── Category
           ├──── sessions  (Better Auth)
           └──── accounts  (Better Auth OAuth)

NewsletterSubscriber (standalone)
Verification (Better Auth)
```

### Key Model Details

**`User`**
```prisma
id          String   @id
name        String
email       String   @unique
role        Role     @default(MEMBER)   // MEMBER | ADMIN
isActive    Boolean  @default(true)
```

**`Idea`**
```prisma
id                 String      @id @default(cuid())
title              String
problemStatement   String
proposedSolution   String
description        String
images             String[]    // Cloudinary URLs
isPaid             Boolean     @default(false)
price              Float?
status             IdeaStatus  @default(DRAFT)
                               // DRAFT | UNDER_REVIEW | APPROVED | REJECTED
rejectionFeedback  String?
authorId           String      // → User
categoryId         String      // → Category
```

**`Vote`** — unique per `[userId, ideaId]`
```prisma
type    VoteType  // UPVOTE | DOWNVOTE
```

**`Comment`** — supports self-referential nesting
```prisma
content   String
parentId  String?  // null = top-level comment
replies   Comment[]
```

**`Purchase`** — unique per `[userId, ideaId]`
```prisma
stripePaymentId  String?
```

---

## 📡 API Reference

**Base URL:** `https://ecospark-api.vercel.app/api/v1`
**Local:** `http://localhost:5000/api/v1`

All responses follow this envelope:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ideas retrieved successfully",
  "data": { ... }
}
```

---

### 🔐 Authentication
> Handled by Better Auth. Session cookie is set on `/api/v1/auth/*`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/sign-up/email` | Register with name, email, password |
| `POST` | `/auth/sign-in/email` | Login with email, password |
| `POST` | `/auth/sign-out` | Destroy session |
| `GET` | `/auth/get-session` | Get current session + user |

---

### 🏷 Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | — | List all categories |
| `POST` | `/categories` | Admin | Create a category `{ name }` |
| `DELETE` | `/categories/:id` | Admin | Delete a category |

---

### 💡 Ideas

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/ideas` | — | List approved ideas |
| `GET` | `/ideas/:id` | Optional | Get one idea (handles paid gate) |
| `GET` | `/ideas/my` | Member | Get current user's ideas |
| `GET` | `/ideas/admin/all` | Admin | Get all ideas (any status) |
| `POST` | `/ideas` | Member | Create idea (multipart/form-data) |
| `PATCH` | `/ideas/:id` | Member | Update idea (multipart/form-data) |
| `DELETE` | `/ideas/:id` | Member | Delete idea (DRAFT only) |
| `PATCH` | `/ideas/:id/submit` | Member | Submit DRAFT → UNDER_REVIEW |
| `PATCH` | `/ideas/:id/approve` | Admin | Approve idea → APPROVED |
| `PATCH` | `/ideas/:id/reject` | Admin | Reject with feedback `{ feedback }` |

**`GET /ideas` — Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: `1`) |
| `limit` | number | Items per page (default: `10`) |
| `category` | string | Filter by category ID |
| `search` | string | Search title / description |
| `sort` | string | `newest` \| `popular` \| `price-asc` \| `price-desc` |
| `isPaid` | boolean | Filter free / paid ideas |

**`GET /ideas/:id` — Response Shapes**

```jsonc
// Unauthenticated + paid idea
{ "requiresAuth": true }

// Authenticated, not yet purchased
{ "requiresPurchase": true, "price": 9.99, "teaser": { "title": "...", ... } }

// Authenticated + purchased (or free idea, or admin)
{ "id": "...", "title": "...", /* full idea */ }
```

**Create / Update — `multipart/form-data` Fields**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | ✅ |
| `problemStatement` | string | ✅ |
| `proposedSolution` | string | ✅ |
| `description` | string | ✅ |
| `categoryId` | string | ✅ |
| `isPaid` | boolean | ✅ |
| `price` | number | Only if `isPaid: true` |
| `images` | File[] | Up to 4 files, 5 MB each |

---

### 👍 Votes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/votes/:ideaId` | — | Get all votes for an idea |
| `POST` | `/votes/:ideaId` | Member | Cast / change / remove vote |

**`POST /votes/:ideaId`** body: `{ "type": "UPVOTE" | "DOWNVOTE" }`

- Voting the same type again **removes** the vote (toggle)
- Voting a different type **updates** the existing vote
- Returns `201 Created` for new vote, `200 OK` for removal

---

### 💬 Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/comments/:ideaId` | — | Get nested comment tree |
| `POST` | `/comments/:ideaId` | Member | Post a comment or reply |
| `DELETE` | `/comments/:id` | Member/Admin | Delete a comment |

**`POST /comments/:ideaId`** body:
```json
{ "content": "Great idea!", "parentId": "optional-parent-id" }
```

---

### 💳 Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/payments/checkout` | Member | Create Stripe Checkout Session |
| `GET` | `/payments/status/:ideaId` | Member | Check purchase status |
| `POST` | `/payments/webhook` | — (Stripe) | Handle `checkout.session.completed` |

**`POST /payments/checkout`** body: `{ "ideaId": "..." }`
Returns: `{ "url": "https://checkout.stripe.com/..." }`

After successful payment, Stripe redirects to:
`{CLIENT_URL}/ideas/{ideaId}?purchase=success`

---

### 📤 Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/upload/image` | Member | Upload single image to Cloudinary |

**Request:** `multipart/form-data` with field name `file`
**Response:** `{ "url": "https://res.cloudinary.com/..." }`

Constraints: images only, max 5 MB per file.

---

### 👑 Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/stats` | Admin | Platform statistics |
| `GET` | `/admin/users` | Admin | List all users |
| `PATCH` | `/admin/users/:id/toggle-active` | Admin | Enable / disable user account |
| `PATCH` | `/admin/users/:id/role` | Admin | Change user role |
| `DELETE` | `/admin/ideas/:id` | Admin | Force-delete any idea |
| `POST` | `/admin/newsletter/subscribe` | — | Subscribe email to newsletter |

**`GET /admin/stats`** response:
```json
{
  "totalUsers": 157,
  "totalIdeas": 342,
  "pendingIdeas": 12,
  "approvedIdeas": 289
}
```

**`GET /admin/users`** query params: `page`, `limit`, `search`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** database (local or hosted — e.g. [Supabase](https://supabase.com/), [Neon](https://neon.tech/))
- **Stripe** account (for payments)
- **Cloudinary** account (for image uploads)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ecospart-api.git
cd ecospart-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in all values — see [Environment Variables](#-environment-variables) below.

### 4. Set up the database

```bash
# Push schema to your database (dev — no migration history)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate

# Optional: seed with demo data
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

API available at [http://localhost:5000](http://localhost:5000).

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# ─── Better Auth ────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your_random_secret_min_32_chars"

# No trailing slash — must match the deployed API URL
BETTER_AUTH_URL="http://localhost:5000"

# Your frontend URL — used for CORS and Stripe redirect URLs
CLIENT_URL="http://localhost:3000"

# Optional: extra trusted origins (comma or space separated)
# TRUSTED_ORIGINS="https://preview.vercel.app https://staging.vercel.app"

# ─── Stripe ─────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ─── Cloudinary ─────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# ─── Server ─────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV="development"
```

> **Startup validation:** `validateEnv.ts` runs at boot and throws if any required variable is missing, preventing silent failures.

---

## 📜 Available Scripts

```bash
npm run dev          # Start dev server with hot-reload (tsx watch)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled production server
npm run db:push      # Push Prisma schema (no migrations)
npm run db:migrate   # Run Prisma migrations (dev)
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio in browser
```

---

## 🔐 Authentication

This API uses **Better Auth** with PostgreSQL as the session store.

### How it Works

1. **Sign-up / Sign-in** → Better Auth creates a session row in PostgreSQL and sets an `HttpOnly` session cookie
2. **Protected routes** → `protect` middleware calls `auth.api.getSession()` to validate the cookie
3. **Role check** → `adminOnly` middleware verifies `req.user.role === "ADMIN"`

### Middleware

```typescript
// Protect any route
router.get("/my-route", protect, adminOnly, handler);

// req.user is available in all protected handlers:
interface RequestUser {
  id: string;
  role: "MEMBER" | "ADMIN";
}
```

### Cookie Names

The session cookie is named:
- `better-auth.session_token` (HTTP)
- `__Secure-better-auth.session_token` (HTTPS / production)

---

## 💳 Payment Flow

```
Member clicks "Unlock" on a paid idea
    │
    ▼
POST /payments/checkout { ideaId }
    │
    ▼
Server creates Stripe Checkout Session
    │
    ▼
Response: { url: "https://checkout.stripe.com/..." }
    │
    ▼
Client redirects user to Stripe-hosted checkout page
    │
    ▼
User completes payment on Stripe
    │
    ▼
Stripe calls POST /payments/webhook (checkout.session.completed)
    │
    ▼
Server verifies webhook signature + creates Purchase record
    │
    ▼
Stripe redirects user to {CLIENT_URL}/ideas/{ideaId}?purchase=success
    │
    ▼
Frontend shows success toast + unlocks full idea content
```

### Setting Up Stripe Webhooks (local dev)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:5000/api/v1/payments/webhook

# Copy the webhook signing secret it outputs into your .env:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🖼 Image Uploads

Images are uploaded in two steps:

1. **Multer** receives the file into memory (max 5 MB, `image/*` only)
2. **Cloudinary** receives the buffer via a server-side stream upload

```typescript
// POST /upload/image
// multipart/form-data, field: "file"
// Response: { "url": "https://res.cloudinary.com/..." }
```

The returned Cloudinary URL is stored in the `images: String[]` array on the `Idea` model.

---

## 🌍 Deployment

The API is deployed on **Vercel** as a serverless Node.js function.

### Deploy with Vercel CLI

```bash
npm run build        # Compile TypeScript first
vercel --prod
```

### `vercel.json`

```json
{
  "version": 2,
  "builds": [{ "src": "dist/src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/src/server.js" }]
}
```

### Production Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] `DATABASE_URL` points to a production PostgreSQL instance (e.g. Neon, Supabase)
- [ ] `CLIENT_URL` set to the production frontend URL
- [ ] `BETTER_AUTH_URL` set to the production API URL (no trailing slash)
- [ ] Stripe webhook registered for the production URL: `https://your-api.vercel.app/api/v1/payments/webhook`
- [ ] `NODE_ENV=production` set

---

## 💡 Idea Status Flow

```
          ┌──────────┐
          │  DRAFT   │  ◄── Member creates idea
          └────┬─────┘
               │  Member submits for review
               ▼
       ┌───────────────┐
       │  UNDER_REVIEW │  ◄── Awaiting admin decision
       └───┬───────┬───┘
           │       │
  Admin    │       │  Admin
  approves │       │  rejects (with feedback)
           ▼       ▼
      ┌──────┐  ┌──────────┐
      │APPROV│  │ REJECTED │  ◄── Member can edit + resubmit
      │  ED  │  └──────────┘
      └──────┘
         │
  Visible on
  public ideas page
```

---

<div align="center">

Made with 💚 for a greener world · [EcoSpark Hub API](https://ecospark-api.vercel.app)

</div>
