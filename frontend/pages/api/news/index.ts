import type { NextApiRequest, NextApiResponse } from 'next';
import { getPaginatedNews, normaliseSlug, upsertNews, downloadRemoteImages, getNewsBySlug } from '../../../lib/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '10', 10) || 10;
    const { data, total } = await getPaginatedNews(Math.max(page, 1), Math.max(limit, 1));
    res.status(200).json({ data, total, page, limit });
    return;
  }

  if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'];
    if (!token || token !== process.env.ADMIN_TOKEN) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, slug, content, published_at } = req.body || {};
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const normalSlug = normaliseSlug(slug || title);
    const transformedContent = await downloadRemoteImages(content, normalSlug);

    const article = await upsertNews({
      title,
      slug: normalSlug,
      content: transformedContent,
      published_at: published_at || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json(article);
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}
