function sanitiseEnv(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('{{')) {
    return undefined;
  }
  return trimmed;
}

const PUBLIC_API_BASE = sanitiseEnv(process.env.NEXT_PUBLIC_API_BASE_URL);
const SERVER_API_BASE = sanitiseEnv(process.env.API_BASE_URL);

const DEV_FALLBACK = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8787' : undefined;

type RequestLike = {
  headers?: Headers | Record<string, string | string[] | undefined>;
};

function readHeader(req: RequestLike | undefined, name: string): string | undefined {
  if (!req?.headers) return undefined;
  const headers = req.headers;

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const value = headers[name.toLowerCase() as keyof typeof headers] ?? headers[name as keyof typeof headers];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getServerApiBaseUrl(req?: RequestLike): string {
  if (SERVER_API_BASE) return SERVER_API_BASE;
  if (PUBLIC_API_BASE) return PUBLIC_API_BASE;

  if (DEV_FALLBACK) return DEV_FALLBACK;
  throw new Error('API base URL is not configured. Set API_BASE_URL in your environment.');
}

export const clientApiBaseUrl = PUBLIC_API_BASE || DEV_FALLBACK || '';
