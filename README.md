# Tour Travel — Airventure

A full-stack travel booking platform with a public storefront and a full admin panel for managing destinations, testimonials, and bookings.

## Stack

**Server** (`/Server`)
- Node.js + Express
- MongoDB via Mongoose
- JWT auth (jsonwebtoken + bcryptjs)
- ESM modules

**Client** (`/travel-tour`)
- React 19 + Vite
- React Router v7
- Framer Motion
- Tailwind CSS v4

## Quick Start

```bash
# Backend
cd Server
npm install
npm run dev          # http://localhost:5000

# Frontend (separate terminal)
cd travel-tour
npm install
npm run dev          # http://localhost:5173
```

## Environment

`Server/.env`:

| Var | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express port | `5000` |
| `MONGODB_URI` | MongoDB connection string | local mongodb |
| `Frontend_URL` | CORS origin (also matches `localhost:5173`, `localhost:3000`, Vercel) | — |
| `JWT_SECRET` | **Required.** Signs/verifies JWTs. Server fails to boot if missing. | — |
| `ADMIN_EMAILS` | Comma-separated list of emails granted admin role on registration. | _empty_ |

`travel-tour/.env`:

| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL for the API. Default: `http://localhost:5000/api` |

## Admin Panel

Admins are bootstrapped via the `ADMIN_EMAILS` env var. When a user registers with an email that matches, they are created with `role: "admin"`. Existing users can be promoted by adding their email to the list and re-registering, or directly updating MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } });
```

The admin area is mounted under `/admin` and is gated by `ProtectedRoute` (auth + `role === "admin"`) and the server-side `adminOnly` middleware.

### Admin pages

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard — totals, revenue, status breakdown, recent bookings |
| `/admin/destinations` | List, search, filter, delete destinations |
| `/admin/destinations/new` | Create a destination |
| `/admin/destinations/:id` | Edit a destination |
| `/admin/testimonials` | Create / edit / delete customer testimonials |
| `/admin/bookings` | View and update booking status (confirmed/pending/cancelled) |

### Admin API

All admin routes require `Authorization: Bearer <token>` **and** `role === "admin"`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/bookings` | List all bookings |
| `GET` | `/api/bookings/mine` | List bookings for the logged-in user |
| `GET` | `/api/bookings/stats` | Dashboard aggregates |
| `PATCH` | `/api/bookings/:id` | Update booking status |
| `POST` | `/api/destinations` | Create destination |
| `PUT` | `/api/destinations/:id` | Update destination |
| `DELETE` | `/api/destinations/:id` | Delete destination |
| `POST` | `/api/testimonials` | Create testimonial |
| `PUT` | `/api/testimonials/:id` | Update testimonial |
| `DELETE` | `/api/testimonials/:id` | Delete testimonial |

## Scripts

| Path | Command | What it does |
| --- | --- | --- |
| `Server` | `npm run dev` | Watch + restart on changes |
| `Server` | `npm start` | Production start |
| `Server` | `npm run seed` | Re-seed destinations & testimonials from JSON |
| `travel-tour` | `npm run dev` | Vite dev server |
| `travel-tour` | `npm run dev:all` | Run client + server together via `concurrently` |
| `travel-tour` | `npm run build` | Production build |
| `travel-tour` | `npm run lint` | ESLint |
