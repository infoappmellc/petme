import path from 'node:path';
import { promises as fs } from 'node:fs';
import { v4 as uuid } from 'uuid';
import { load } from 'cheerio';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  image_url?: string;
}

const dataPath = path.join(process.cwd(), 'data', 'news.json');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'news');

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

export async function readNewsFile(): Promise<NewsItem[]> {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    const parsed = JSON.parse(raw) as NewsItem[];
    return parsed.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(dataPath, '[]', 'utf8');
      return [];
    }
    throw error;
  }
}

async function writeNewsFile(items: NewsItem[]) {
  await fs.writeFile(dataPath, JSON.stringify(items, null, 2), 'utf8');
}

export function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `article-${Date.now()}`;
}

export async function getAllNews() {
  return readNewsFile();
}

export async function getPaginatedNews(page: number, perPage: number) {
  const all = await readNewsFile();
  const total = all.length;
  const start = (page - 1) * perPage;
  const data = all.slice(start, start + perPage);
  return { data, total };
}

export async function getNewsBySlug(slug: string) {
  const all = await readNewsFile();
  return all.find((item) => item.slug === slug) || null;
}

export async function upsertNews(article: Omit<NewsItem, 'id'> & { id?: string }) {
  const all = await readNewsFile();
  const existingIndex = all.findIndex((item) => item.slug === article.slug);
  const item: NewsItem = {
    id: article.id || uuid(),
    title: article.title,
    slug: article.slug,
    content: article.content,
    published_at: article.published_at,
    image_url: article.image_url,
  };

  if (existingIndex >= 0) {
    all[existingIndex] = item;
  } else {
    all.unshift(item);
  }

  await writeNewsFile(all);
  return item;
}

export async function deleteNews(slug: string) {
  const all = await readNewsFile();
  const filtered = all.filter((item) => item.slug !== slug);
  await writeNewsFile(filtered);
}

export async function downloadRemoteImages(html: string, slug: string) {
  const $ = load(html);
  const imgNodes = $('img');
  if (!imgNodes.length) return html;
  await ensureUploadsDir();

  await Promise.all(
    imgNodes.toArray().map(async (el) => {
      const src = $(el).attr('src');
      if (!src || !/^https?:\/\//i.test(src)) return;
      try {
        const newUrl = await saveRemoteImage(src, slug);
        if (newUrl) {
          $(el).attr('src', newUrl);
        }
      } catch (error) {
        console.error('Failed to download remote image', src, error);
      }
    })
  );

  return $.root()
    .children()
    .map((_, element) => $.html(element))
    .get()
    .join('\n');
}

export async function saveRemoteImage(src: string, slug: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Unable to download image: ${src}`);
  }
  const contentType = response.headers.get('content-type') || '';
  const ext = getExtensionFromMime(contentType) || src.split('.').pop() || 'jpg';
  const base = normaliseSlug(slug);
  const fileName = `${base}-${uuid()}.${ext}`;
  const arrayBuffer = await response.arrayBuffer();
  await ensureUploadsDir();
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return `/uploads/news/${fileName}`;
}

function getExtensionFromMime(mime: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  return map[mime];
}
