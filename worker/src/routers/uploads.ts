import type { RouterType, IRequest } from 'itty-router';
import type { Env } from '../types';
import { json, error } from '../utils/responses';
import { requireAdmin } from '../utils/auth';
import { getObject, saveUploadedFile } from '../utils/uploads';

type RouterInstance = RouterType;

function decodeKey(path?: string): string | null {
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch (err) {
    console.warn('Failed to decode media key', path, err);
    return null;
  }
}

export function registerUploadRoutes(router: RouterInstance) {
  router.post('/api/uploads', async (request: IRequest, env: Env) => {
    const unauthorized = requireAdmin(request, env);
    if (unauthorized) return unauthorized;

    let formData: FormData;
    try {
      formData = await (request as Request).formData();
    } catch (err) {
      console.error('Unable to parse form data', err);
      return error('Unable to parse form data', 400);
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return error('Missing file', 400);
    }

    try {
      const { url } = await saveUploadedFile(env, file, 'uploads/news');
      return json({ url }, { status: 201 });
    } catch (err) {
      console.error('Failed to save upload', err);
      return error('Internal Server Error', 500);
    }
  });

  router.get('/media/*', async (request: IRequest, env: Env) => {
    const key = decodeKey(request.params?.['*']);
    if (!key) {
      return error('Not found', 404);
    }

    try {
      const object = await getObject(env, key);
      if (!object) {
        return error('Not found', 404);
      }

      const headers = new Headers();
      const metadata = object.httpMetadata || {};
      if (metadata.contentType) headers.set('content-type', metadata.contentType);
      if (metadata.cacheControl) {
        headers.set('cache-control', metadata.cacheControl);
      } else {
        headers.set('cache-control', 'public, max-age=31536000, immutable');
      }
      if (metadata.contentDisposition) headers.set('content-disposition', metadata.contentDisposition);

      return new Response(object.body, { headers });
    } catch (err) {
      console.error('Failed to read media object', err);
      return error('Internal Server Error', 500);
    }
  });
}
