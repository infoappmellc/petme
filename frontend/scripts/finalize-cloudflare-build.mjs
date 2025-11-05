import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('.open-next');
const WORKER_SOURCE = path.join(OUTPUT_DIR, 'worker.js');
const WORKER_TARGET = path.join(OUTPUT_DIR, '_worker.js');
const ROUTES_FILE = path.join(OUTPUT_DIR, '_routes.json');
const INIT_FILE = path.join(OUTPUT_DIR, 'cloudflare', 'init.js');
const ROUTES_PAYLOAD = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_assets/**',
    '/_next/data/**',
    '/static/**',
    '/images/**',
    '/uploads/**',
    '/favicon.ico',
  ],
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

async function patchInitFile() {
  let initSource;
  try {
    initSource = await fs.readFile(INIT_FILE, 'utf8');
  } catch {
    // File may not exist if the layout changes; skip silently.
    return;
  }

  let mutatedSource = initSource;

  if (mutatedSource.includes('__ASSETS_RUN_WORKER_FIRST__: false')) {
    mutatedSource = mutatedSource.replace(
      '__ASSETS_RUN_WORKER_FIRST__: false',
      '__ASSETS_RUN_WORKER_FIRST__: ["/_next/static/*", "/_next/data/*"]',
    );
  }

  if (!mutatedSource.includes('env.ASSETS = env.__STATIC_CONTENT')) {
    mutatedSource = mutatedSource.replace(
      'const url = new URL(request.url);\n  initRuntime();',
      'const url = new URL(request.url);\n  if (!env.ASSETS && env.__STATIC_CONTENT) {\n    env.ASSETS = env.__STATIC_CONTENT;\n  }\n  initRuntime();',
    );
  }

  if (mutatedSource !== initSource) {
    await fs.writeFile(INIT_FILE, mutatedSource);
  }
}

async function main() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    throw new Error('OpenNext build directory (.open-next) not found. Run the OpenNext build before finalizing.');
  }

  await renameWorker();
  await writeRoutes();
  await patchInitFile();
}

main().catch((error) => {
  console.error('[finalize-cloudflare-build]', error);
  process.exitCode = 1;
});
