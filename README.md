# PetMe Monorepo

This repository hosts the PetMe web application built with Next.js (located in `frontend/`). Deploy the project to Vercel using the standard Next.js workflow:

1. Link the repo to Vercel and select `frontend` as the project root.
2. Use the default build command `npm run build` and output directory `.next`.
3. Configure the following environment variables in Vercel (Production + Preview):
   - `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` – Optional; provide if you host the API on a different origin. When left empty the application will call the built-in Next.js API routes.
   - `ADMIN_TOKEN` – shared secret for the admin dashboard.

For local development run:

```bash
cd frontend
npm install
npm run dev
```

> **Note:** The bundled API stores articles in memory and, when running locally, persists them to `data/news.json`.
> On Vercel the filesystem is ephemeral, so administrative changes are not permanent unless you adapt
> `lib/server/store.ts` to use an external database (e.g. Vercel KV, Postgres, Supabase, etc.).
