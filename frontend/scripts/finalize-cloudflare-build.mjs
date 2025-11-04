import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('.open-next');
const WORKER_SOURCE = path.join(OUTPUT_DIR, 'worker.js');
const WORKER_TARGET = path.join(OUTPUT_DIR, '_worker.js');
const ROUTES_FILE = path.join(OUTPUT_DIR, '_routes.json');
const ROUTES_PAYLOAD = {
  version: 1,
  include: ['/*'],
  exclude: ['/_assets/*', '/_next/static/*', '/static/*', '/favicon.ico'],
};

async function renameWorker() {
  try {
    await fs.access(WORKER_SOURCE);
  } catch {
    // nothing to rename if worker already moved
    return;
  }
  await fs.rename(WORKER_SOURCE, WORKER_TARGET);
}

async function writeRoutes() {
  await fs.writeFile(ROUTES_FILE, JSON.stringify(ROUTES_PAYLOAD, null, 2));
}

async function main() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    throw new Error('OpenNext build directory (.open-next) not found. Run the OpenNext build before finalizing.');
  }

  await renameWorker();
  await writeRoutes();
}

main().catch((error) => {
  console.error('[finalize-cloudflare-build]', error);
  process.exitCode = 1;
});
