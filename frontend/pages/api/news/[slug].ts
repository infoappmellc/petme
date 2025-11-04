import type { NextApiRequest, NextApiResponse } from 'next';
import { getNewsBySlug, deleteNews, normaliseSlug, upsertNews, downloadRemoteImages } from '../../../lib/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug as string;
  const slug = normaliseSlug(slugParam);

  if (req.method === 'GET') {
    const article = await getNewsBySlug(slug);
    if (!article) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(article);
    return;
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'PUT') {
    const { title, content, published_at } = req.body || {};
    if (!title || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const transformedContent = await downloadRemoteImages(content, slug);
    const existing = await getNewsBySlug(slug);
    const article = await upsertNews({
      id: existing?.id,
      title,
      slug,
      content: transformedContent,
      published_at: published_at || existing?.published_at || new Date().toISOString().slice(0, 10),
    });
    res.status(200).json(article);
    return;
  }

  if (req.method === 'DELETE') {
    await deleteNews(slug);
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}
