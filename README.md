# PHC MSDS Portal

A Next.js 15 + Prisma application for PHC/MSDS workflows across REGX, facility admins, focal persons, and consultants.

## Current Status

I validated the repository can now build successfully after ensuring Prisma Client generation is part of the normal install/build lifecycle.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth (v5 beta)
- Prisma ORM + PostgreSQL driver adapter

## Quick Start

### 1) Install dependencies

```bash
pnpm install
```

> `postinstall` now auto-runs `prisma generate`, so Prisma client types are available immediately.

### 2) Configure environment

Create `.env` with your database + auth settings:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
AUTH_SECRET="replace-with-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3) Generate Prisma client and sync schema

```bash
pnpm db:generate
pnpm db:push
```

### 4) Seed default data

```bash
pnpm db:seed
```

### 5) Run app

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Build for Production

```bash
pnpm build
pnpm start
```

> `prebuild` now runs `prisma generate` automatically to prevent missing PrismaClient type/runtime issues in CI or fresh servers.

## DB Utility Scripts

- `pnpm db:generate` → runs `prisma generate`
- `pnpm db:push` → pushes schema to DB
- `pnpm db:seed` → seeds baseline users/facility

## Seeded Accounts

- REGX super admin: `regx / RegX@2026`
- Facility admin: `lghadmin / Admin@2026`
- MSDS focal user: `lghfocal / Focal@2026`

## Deployment

- Run `./deploy.sh` on the server after `git pull` (see script in repo root).
- **ChunkLoadError / 400 on RegX or consultant pages:** Next.js chunk URLs contain parentheses (e.g. `/_next/static/chunks/app/(dashboard)/regx/consultants/page-xxx.js`). If nginx or another reverse proxy returns **400 Bad Request**, it may be rejecting paths with `(` and `)`. Proxy the full URI to Next.js without regex on the path; see `docs/nginx-nextjs.conf` for an example.
- Set `NEXTAUTH_URL` on the server to your public URL.

## Notes

- There are existing lint warnings about `<img>` usage in drill pages; these are non-blocking for builds.
- If you want, I can do a second pass focused on “massive features” (prioritized roadmap + implementation) once you list the exact feature set.
