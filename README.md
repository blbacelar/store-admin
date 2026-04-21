# Store Product Automator

Store Product Automator is a full-stack admin dashboard for curating ecommerce products from Amazon links. It combines authenticated product scraping, catalog management, category and branch organization, and a MongoDB-backed admin workflow in a single Next.js application.

It is used to feed product data into https://www.thelittlebigentrepreneur.com/, serving as the admin-side ingestion and catalog management tool behind that storefront experience.

This is the project I would present as a portfolio piece for full-stack product engineering: it includes backend APIs, authentication, database modeling, scraping logic, defensive validation, deployment setup, and a polished admin UI.

## Demo

See the portfolio demo walkthrough in [docs/demo/README.md](docs/demo/README.md) for screenshots, a recorded product tour, and a concise explanation of the main admin flows.

## What The Project Does

- Scrapes product data from supported Amazon URLs and short links.
- Persists products in MongoDB through Prisma.
- Feeds curated product data to https://www.thelittlebigentrepreneur.com/.
- Organizes products by store, branch, and category.
- Supports editing, reordering, archiving, and deleting products.
- Protects admin routes and APIs with credentials-based authentication.
- Applies rate limiting and URL validation to the scraping flow.
- Uses a custom Node server plus Socket.IO for real-time refresh signals.

## Core Features

- **Authenticated admin dashboard**: only approved emails can register and sign in.
- **Amazon product scraping**: extracts title, image, description, rating, review count, availability, and parsed price data.
- **Catalog operations**: create, update, archive, delete, and reorder products.
- **Store model**: supports a default shared store plus per-user ownership flows.
- **Branch and category structure**: lets the same admin experience operate across store segments.
- **Responsive UI**: modern interface built with Next.js App Router, Tailwind CSS, and Radix UI primitives.

## Architecture Overview

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS
- Radix UI components
- i18next for internationalization

### Backend

- Next.js route handlers for the main API surface
- Custom Node server in `server.ts`
- Socket.IO server for refresh notifications
- NextAuth with credentials provider
- Prisma ORM on MongoDB

### Scraping Layer

- Server-side scraping endpoint at `/api/scrape`
- URL/domain allowlist protection against SSRF
- Redirect resolution for `amzn.to` links
- HTML parsing with Cheerio
- Browser automation dependencies available for more resilient scraping flows

## How It Works

1. An authenticated user signs in through the credentials-based login flow.
2. The dashboard loads the user’s available store context and branches.
3. The user submits an Amazon URL.
4. The backend validates the URL, rate limits the request, and runs the scraping pipeline.
5. The scraped product is returned to the UI and can be saved into MongoDB.
6. Product updates emit a Socket.IO refresh signal so connected clients can stay in sync.

## Data Model

The Prisma schema models the application around these entities:

- `User`: authenticated admin accounts
- `Store`: top-level ownership boundary
- `Branch`: subdivision of a store
- `Category`: organizational grouping within a store/branch
- `Product`: the main catalog record with price, image, URL, description, order, and archived state
- `Account`, `Session`, `VerificationToken`: NextAuth persistence models

See [prisma/schema.prisma](prisma/schema.prisma) for the full schema.

## Security And Operational Notes

- Registration and sign-in are restricted by `ALLOWED_EMAILS`.
- The scrape API only accepts HTTPS Amazon domains.
- Localhost and private-network targets are rejected.
- Scraping requests are rate limited per user.
- Environment variables are validated on server startup.
- The app can continue functioning even if real-time socket sync is unavailable.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` with the values below:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ALLOWED_EMAILS="your-email@example.com"

# Optional but recommended for shared-store mode
DEFAULT_STORE_ID="6984f69469a68016b608074b"

# Optional for explicit socket/server URLs
NEXT_PUBLIC_SOCKET_URL="http://127.0.0.1:3005"
NEXT_PUBLIC_APP_URL="http://127.0.0.1:3005"
```

Notes:

- If `ALLOWED_EMAILS` is missing, all registrations and logins are blocked by design.
- `NEXTAUTH_URL` should match the URL you use to access the app.
- The custom production-style server listens on port `3005` by default.

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Start the app

For standard local UI development:

```bash
npm run dev
```

For the production-style runtime with the custom server and Socket.IO:

```bash
npm run build
npm start
```

## Useful Scripts

- `npm run dev`: run the Next.js development server
- `npm run build`: build the Next.js app and custom server output
- `npm start`: run the custom server from `dist-server`
- `npm run lint`: run ESLint
- `npm run script -- scripts/...`: execute TypeScript maintenance scripts via `ts-node`

## Portfolio Highlights

This project demonstrates:

- Full-stack TypeScript application design
- Secure API design with auth and request validation
- Practical web scraping and defensive URL handling
- Database-backed CRUD and ordering logic
- Custom server deployment beyond a default framework-only setup
- Real-time update signaling with Socket.IO
- Multi-tenant-ish admin modeling with store and branch boundaries

## Deployment Notes

- The app is designed to build with Next.js plus a custom server output in `dist-server`.
- A Docker-based deployment flow is already included.
- Additional deployment notes live in the `docs` folder.

## Documentation

- Deployment overview: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- EasyPanel deployment: [docs/EASYPANEL_DEPLOYMENT.md](docs/EASYPANEL_DEPLOYMENT.md)
- VPS deployment: [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md)
- Vercel environment setup: [docs/VERCEL_ENV_SETUP.md](docs/VERCEL_ENV_SETUP.md)
- Data migration notes: [docs/MIGRATION.md](docs/MIGRATION.md)
