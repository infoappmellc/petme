import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureAdmin } from '../../../lib/server/auth';
import { rewriteContentImages, extractExcerpt, normaliseSlug } from '../../../lib/server/content';
import { getArticle, getPaginatedArticles, putArticle } from '../../../lib/server/store';
import type { Article } from '../../../lib/types';

interface ArticlePayload {
  title?: string;
  slug?: string;
  content?: string;
  published_at?: string;
  preview_image?: string;
}

function parsePagination(req: NextApiRequest): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit ?? '10'), 10) || 10));
  return { page, limit };
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { page, limit } = parsePagination(req);
  const { data, total } = await getPaginatedArticles(page, limit);
  res.status(200).json({ data, total, page, limit });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;

  const payload = req.body as ArticlePayload;
  if (!payload?.title || !payload?.content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const now = new Date().toISOString();
  const slug = normaliseSlug(payload.slug || payload.title);
  const existing = await getArticle(slug);
  const { html, firstImage } = await rewriteContentImages(payload.content);
  const previewImage = payload.preview_image || firstImage;
  const excerpt = extractExcerpt(html);

  const article: Article = {
    slug,
    title: payload.title,
    content: html,
    excerpt,
    preview_image: previewImage,
    created_at: existing?.created_at || now,
    updated_at: now,
    published_at: payload.published_at || existing?.published_at || now.slice(0, 10),
  };

  await putArticle(article);
  res.status(existing ? 200 : 201).json(article);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      await handleGet(req, res);
      return;
    }
    if (req.method === 'POST') {
      await handlePost(req, res);
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Unhandled /api/news error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
