import type { Env } from '../types';
import { error } from './responses';

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

export function requireAdmin(request: Request, env: Env): Response | null {
  const token = extractToken(request);
  if (!token || token !== env.ADMIN_TOKEN) {
    return error('Unauthorized', 401);
  }
  return null;
}
