import { Router } from 'itty-router';
import type { Env } from './types';
import { registerNewsRoutes } from './routers/news';
import { registerUploadRoutes } from './routers/uploads';
import { error } from './utils/responses';

const router = Router();

router.get('/health', () => new Response('ok'));

registerNewsRoutes(router);
registerUploadRoutes(router);

router.all('*', () => error('Not found', 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      if (!response) {
        return error('Not found', 404);
      }
      return response;
    } catch (err) {
      console.error('Unhandled worker error', err);
      return error('Internal Server Error', 500);
    }
  },
};
