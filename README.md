# PetMe Monorepo

This repository now contains separate projects for the web frontend and the Cloudflare Worker backend.

```
petme/
├── frontend/    # Next.js application (deploy to Vercel)
└── worker/      # Cloudflare Worker API (KV/R2 ready)
```

## Frontend

The Next.js source code originally found in `next-app/` is now located inside `frontend/`. The project uses the stock Next.js build pipeline, so Vercel can deploy it without additional adapters:

1. Link the repo to Vercel and select `frontend` as the project root.
2. Use the default build command `npm run build` and output directory `.next`.
3. Configure the following environment variables in Vercel (Production + Preview):
   - `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` – HTTPS origin of the API Worker (e.g. `https://petme-backend.yourdomain.workers.dev`).
   - `ADMIN_TOKEN` – shared secret for the admin dashboard.

For local development run:

```bash
cd frontend
npm install
npm run dev
```

## Worker

The `worker/` directory now contains a fully fledged Cloudflare Worker that mirrors the former Next.js API routes. It stores articles in KV, saves media assets to R2, rewrites remote images on ingest, and exposes the `/api/news`, `/api/uploads`, and `/media/*` endpoints needed by the admin panel and public pages.

Review `worker/README.md` for storage provisioning and deployment steps before running `wrangler dev` or `wrangler deploy`.
