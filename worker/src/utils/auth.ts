import type { Env } from '../types';
import { error } from './responses';

const FALLBACK_PASSWORD = '123123';

function extractToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const headerToken = request.headers.get('x-admin-token');
  if (headerToken) {
    return headerToken.trim();
  }
  return null;
}

function resolveRequiredToken(env: Env): string | null {
  const configured = env.ADMIN_TOKEN?.trim();
  if (configured) {
    return configured;
  }
  return FALLBACK_PASSWORD;
}

export function requireAdmin(request: Request, env: Env): Response | null {
  const required = resolveRequiredToken(env);
  if (!required) {
    return null;
  }
  const token = extractToken(request);
  if (!token || token !== required) {
    return error('Unauthorized', 401);
  }
  return null;
}
