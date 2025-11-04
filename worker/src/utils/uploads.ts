import type { Env } from '../types';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function requireBucket(env: Env): R2Bucket {
  if (!env.UPLOADS) {
    throw new Error('R2 bucket "UPLOADS" is not bound. Update wrangler.toml before deploying.');
  }
  return env.UPLOADS;
}

export function buildPublicUrl(env: Env, key: string): string {
  if (env.MEDIA_BASE_URL) {
    const base = env.MEDIA_BASE_URL.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
  return `/media/${key}`;
}

export function ensureExtension(contentType: string | null, fallbackName?: string): string {
  const fromMime = contentType ? MIME_EXTENSION_MAP[contentType.split(';')[0].trim().toLowerCase()] : undefined;
  if (fromMime) return fromMime;
  if (fallbackName) {
    const match = fallbackName.match(/\.([a-z0-9]+)$/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return 'jpg';
}

export async function saveFile(env: Env, key: string, body: ReadableStream | ArrayBuffer, contentType?: string): Promise<void> {
  const bucket = requireBucket(env);
  await bucket.put(key, body, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });
}

export async function saveUploadedFile(env: Env, file: File, prefix = 'uploads'): Promise<{ key: string; url: string }> {
  const extension = ensureExtension(file.type || null, file.name);
  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;
  await saveFile(env, key, file.stream(), file.type || undefined);
  return { key, url: buildPublicUrl(env, key) };
}

export async function saveRemoteImage(env: Env, slug: string, url: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(url, {
      cf: { cacheEverything: false },
    });
  } catch (error) {
    console.error('Unable to fetch remote image', url, error);
    return null;
  }

  if (!response.ok) {
    console.warn('Remote image responded with error', url, response.status);
    return null;
  }

  const contentType = response.headers.get('content-type');
  const extension = ensureExtension(contentType, url);
  const key = `articles/${slug}/${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await response.arrayBuffer();
  await saveFile(env, key, arrayBuffer, contentType || undefined);
  return buildPublicUrl(env, key);
}

export async function getObject(env: Env, key: string): Promise<R2ObjectBody | null> {
  const bucket = requireBucket(env);
  return bucket.get(key);
}
