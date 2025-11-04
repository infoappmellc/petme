import type { Env, Article } from '../types';
import type { RouterType, IRequest } from 'itty-router';
import { json, error } from '../utils/responses';
import { normaliseSlug, rewriteContentImages, extractExcerpt } from '../utils/articles';
import { deleteArticle, getArticle, getPaginatedArticles, putArticle } from '../utils/storage';
import { requireAdmin } from '../utils/auth';
import { saveRemoteImage } from '../utils/uploads';

type RouterInstance = RouterType;

interface ArticlePayload {
  title?: string;
  slug?: string;
  content?: string;
  published_at?: string;
  preview_image?: string;
}

function parsePagination(url: string): { page: number; limit: number } {
  const { searchParams } = new URL(url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10) || 10));
  return { page, limit };
}

async function resolvePreviewImage(env: Env, slug: string, payload: ArticlePayload, fallback?: string) {
  let preview = payload.preview_image?.trim();
  if (!preview && fallback) {
    return fallback;
  }
  if (!preview) return undefined;

  if (preview.startsWith('/media/')) {
    return preview;
  }

  if (env.MEDIA_BASE_URL && preview.startsWith(env.MEDIA_BASE_URL)) {
    return preview;
  }

  if (!/^https?:\/\//i.test(preview)) {
    return preview;
  }

  const stored = await saveRemoteImage(env, slug, preview);
  return stored ?? fallback;
}

function validatePayload(payload: ArticlePayload): payload is Required<Pick<ArticlePayload, 'title' | 'content'>> & ArticlePayload {
  return Boolean(payload.title && payload.content);
}

export function registerNewsRoutes(router: RouterInstance) {
  router.get('/api/news', async (request: IRequest, env: Env) => {
    try {
      const { page, limit } = parsePagination(request.url);
      const { data, total } = await getPaginatedArticles(env, page, limit);
      return json({ data, total, page, limit });
    } catch (err) {
      console.error('Failed to list articles', err);
      return error('Internal Server Error', 500);
    }
  });

  router.get('/api/news/:slug', async (request: IRequest, env: Env) => {
    try {
      const slug = normaliseSlug(request.params?.slug || '');
      const article = await getArticle(env, slug);
      if (!article) {
        return error('Not found', 404);
      }
      return json(article);
    } catch (err) {
      console.error('Failed to fetch article', err);
      return error('Internal Server Error', 500);
    }
  });

  router.post('/api/news', async (request: IRequest, env: Env) => {
    const unauthorized = requireAdmin(request, env);
    if (unauthorized) return unauthorized;

    let payload: ArticlePayload;
    try {
      payload = await (request as Request).json<ArticlePayload>();
    } catch (err) {
      console.error('Invalid JSON body', err);
      return error('Invalid JSON body', 400);
    }

    if (!validatePayload(payload)) {
      return error('Missing required fields', 400);
    }

    const slug = normaliseSlug(payload.slug || payload.title);
    const now = new Date().toISOString();

    try {
      const { html, firstImage } = await rewriteContentImages(env, payload.content!, slug);
      const previewImage = await resolvePreviewImage(env, slug, payload, firstImage);
      const excerpt = extractExcerpt(html);

      const existing = await getArticle(env, slug);
      const publishedAt =
        payload.published_at ||
        existing?.published_at ||
        now.slice(0, 10);

      const article: Article = {
        slug,
        title: payload.title!,
        content: html,
        excerpt,
        preview_image: previewImage,
        created_at: existing?.created_at || now,
        updated_at: now,
        published_at: publishedAt,
      };

      await putArticle(env, article);
      return json(article, { status: existing ? 200 : 201 });
    } catch (err) {
      console.error('Failed to create article', err);
      return error('Internal Server Error', 500);
    }
  });

  router.put('/api/news/:slug', async (request: IRequest, env: Env) => {
    const unauthorized = requireAdmin(request, env);
    if (unauthorized) return unauthorized;

    const slugParam = request.params?.slug || '';
    const slug = normaliseSlug(slugParam);

    let payload: ArticlePayload;
    try {
      payload = await (request as Request).json<ArticlePayload>();
    } catch (err) {
      console.error('Invalid JSON body', err);
      return error('Invalid JSON body', 400);
    }

    if (!validatePayload(payload)) {
      return error('Missing required fields', 400);
    }

    const existing = await getArticle(env, slug);
    if (!existing) {
      return error('Not found', 404);
    }

    const now = new Date().toISOString();

    try {
      const { html, firstImage } = await rewriteContentImages(env, payload.content!, slug);
      const previewImage = await resolvePreviewImage(env, slug, payload, firstImage || existing.preview_image);
      const excerpt = extractExcerpt(html);
      const publishedAt = payload.published_at || existing.published_at;

      const article: Article = {
        slug,
        title: payload.title!,
        content: html,
        excerpt,
        preview_image: previewImage,
        created_at: existing.created_at,
        updated_at: now,
        published_at: publishedAt,
      };

      await putArticle(env, article);
      return json(article);
    } catch (err) {
      console.error('Failed to update article', err);
      return error('Internal Server Error', 500);
    }
  });

  router.delete('/api/news/:slug', async (request: IRequest, env: Env) => {
    const unauthorized = requireAdmin(request, env);
    if (unauthorized) return unauthorized;

    const slug = normaliseSlug(request.params?.slug || '');
    try {
      await deleteArticle(env, slug);
      return new Response(null, { status: 204 });
    } catch (err) {
      console.error('Failed to delete article', err);
      return error('Internal Server Error', 500);
    }
  });
}
