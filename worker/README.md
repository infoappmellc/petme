# PetMe Worker

This Cloudflare Worker exposes the news API used by the PetMe frontend.

## Endpoints

- `GET /health` – simple health probe.
- `GET /api/news?page=1&limit=10` – paginated list of articles.
- `GET /api/news/:slug` – fetch a single article.
- `POST /api/news` – create or overwrite an article *(admin token required)*.
- `PUT /api/news/:slug` – update an existing article *(admin token required)*.
- `DELETE /api/news/:slug` – remove an article *(admin token required)*.
- `POST /api/uploads` – upload an image; returns a URL that can be embedded in article content *(admin token required)*.
- `GET /media/*` – serve files stored in the R2 bucket.

## Storage bindings

Create the resources and copy their identifiers into `wrangler.toml`:

```bash
wrangler kv namespace create petme-news   # fill in binding NEWS.id
wrangler kv namespace create petme-news --preview  # fill in NEWS.preview_id
wrangler r2 bucket create petme-news-images
```

The Worker expects the following bindings:

- `NEWS` – KV namespace storing article records and their index.
- `UPLOADS` – R2 bucket for uploaded/rewritten images.

## Environment variables

- `ADMIN_TOKEN` *(required)* – shared secret used by the administrative endpoints.
- `MEDIA_BASE_URL` *(optional)* – absolute base URL to use when returning media links.
  When omitted, responses fall back to relative URLs served via `/media/...`.

## Local development

```bash
cd worker
npm install
wrangler dev --persist
```

Running with `--persist` gives you a local KV and R2 implementation, so uploaded
files and articles stick around between restarts.

## Deployment

Once the bindings and environment variables are configured, deploy with:

```bash
wrangler deploy
```

Remember to `wrangler secret put ADMIN_TOKEN` (and `MEDIA_BASE_URL` if used) so
the Worker receives the values at runtime.
