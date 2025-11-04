import { Router } from 'itty-router';
import type { Env } from './types';
import { registerNewsRoutes } from './routers/news';
import { registerUploadRoutes } from './routers/uploads';
import { error } from './utils/responses';

const router = Router();

router.get('/health', () => new Response('ok'));

registerNewsRoutes(router);
registerUploadRoutes(router);

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type, authorization, x-admin-token',
};

router.options('/api/*', () => new Response(null, { status: 204, headers: CORS_HEADERS }));

router.all('*', () => error('Not found', 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      if (!response) {
        return error('Not found', 404);
      }
      return applyCors(request, response);
    } catch (err) {
      console.error('Unhandled worker error', err);
      return error('Internal Server Error', 500);
    }
  },
};

function applyCors(request: Request, response: Response): Response {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return response;
  }

  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));

  if (request.method === 'OPTIONS') {
    headers.set('content-length', '0');
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
