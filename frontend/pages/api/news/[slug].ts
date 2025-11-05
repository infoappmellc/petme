import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureAdmin } from '../../../lib/server/auth';
import { normaliseSlug, extractExcerpt, rewriteContentImages } from '../../../lib/server/content';
import { deleteArticle, getArticle, putArticle } from '../../../lib/server/store';
import type { Article } from '../../../lib/types';

interface ArticlePayload {
  title?: string;
  content?: string;
  published_at?: string;
  preview_image?: string;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const slug = normaliseSlug(String(req.query.slug));
  const article = await getArticle(slug);
  if (!article) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(200).json(article);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;

  const slug = normaliseSlug(String(req.query.slug));
  const existing = await getArticle(slug);
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const payload = req.body as ArticlePayload;
  if (!payload?.title || !payload?.content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const now = new Date().toISOString();
  const { html, firstImage } = await rewriteContentImages(payload.content);
  const previewImage = payload.preview_image || firstImage || existing.preview_image;
  const excerpt = extractExcerpt(html);

  const article: Article = {
    slug,
    title: payload.title,
    content: html,
    excerpt,
    preview_image: previewImage,
    created_at: existing.created_at,
    updated_at: now,
    published_at: payload.published_at || existing.published_at,
  };

  await putArticle(article);
  res.status(200).json(article);
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  const slug = normaliseSlug(String(req.query.slug));
  await deleteArticle(slug);
  res.status(204).end();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      await handleGet(req, res);
      return;
    }
    if (req.method === 'PUT') {
      await handlePut(req, res);
      return;
    }
    if (req.method === 'DELETE') {
      await handleDelete(req, res);
      return;
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Unhandled /api/news/[slug] error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
