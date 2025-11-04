# PetMe Monorepo

This repository now contains separate projects for the web frontend and the Cloudflare Worker backend.

```
petme/
├── frontend/    # Next.js application deployed with Cloudflare Pages
└── worker/      # Cloudflare Worker API (KV/R2 ready)
```

## Frontend

The Next.js source code originally found in `next-app/` is now located inside `frontend/`. Deploy it with Cloudflare Pages by pointing the build command to that directory.

## Worker

The `worker/` directory now contains a fully fledged Cloudflare Worker that mirrors the former Next.js API routes. It stores articles in KV, saves media assets to R2, rewrites remote images on ingest, and exposes the `/api/news`, `/api/uploads`, and `/media/*` endpoints needed by the admin panel and public pages.

Review `worker/README.md` for storage provisioning and deployment steps before running `wrangler dev` or `wrangler deploy`.
