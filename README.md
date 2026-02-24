# PHC MSDS Portal

A Next.js 15 + Prisma application for managing healthcare facility registration, compliance, drills, training, consultant assignment, pricing, and payment workflows.

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env`.

4. Run Prisma migrations and seed data:

```bash
pnpm prisma migrate deploy
pnpm db:seed
```

5. Start the app:

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

## Production checks

- Health endpoint: `GET /api/health`
  - Returns `200` when app + database are healthy.
  - Returns `503` when database is unavailable.

## Scripts

- `pnpm dev` - Start local development server.
- `pnpm build` - Build for production.
- `pnpm start` - Run production build.
- `pnpm lint` - Run lint checks.
- `pnpm db:generate` - Generate Prisma client.
- `pnpm db:seed` - Seed initial users/facility.

> Prisma Client generation is also run automatically after install via `postinstall`.
