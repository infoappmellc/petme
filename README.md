# PetMe Monorepo

This repository now contains separate projects for the web frontend and the Cloudflare Worker backend.

```
petme/
├── frontend/    # Next.js application deployed with Cloudflare Pages
└── worker/      # Cloudflare Worker API (KV/R2 ready)
```

## Frontend

The Next.js source code originally found in `next-app/` is now located inside `frontend/`. Deploy it with Cloudflare Pages by pointing the build command to that directory.

### Automated deploys

The repository ships with a GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`) that builds the OpenNext bundle and publishes it to Cloudflare Pages on every push to `main`. To enable it:

1. Create repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account that owns the Pages project.
   - `CLOUDFLARE_API_TOKEN` — an API token with **Pages Writes** and **R2 Writes** (if you cache to R2) permissions.
2. Make sure a Pages project named `petme-frontend` exists. Adjust `CF_PAGES_PROJECT` in the workflow if you prefer a different name.
3. Configure the Pages project environment variables (`API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, etc.) through the Cloudflare dashboard; they do not need to live in the workflow.

You can also trigger the workflow manually from the Actions tab via the **Run workflow** button.

## Worker

The `worker/` directory now contains a fully fledged Cloudflare Worker that mirrors the former Next.js API routes. It stores articles in KV, saves media assets to R2, rewrites remote images on ingest, and exposes the `/api/news`, `/api/uploads`, and `/media/*` endpoints needed by the admin panel and public pages.

Review `worker/README.md` for storage provisioning and deployment steps before running `wrangler dev` or `wrangler deploy`.
