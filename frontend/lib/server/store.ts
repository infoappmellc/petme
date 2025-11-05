import fs from 'node:fs/promises';
import path from 'node:path';
import { Article, ArticleSummary } from '../types';
import { extractExcerpt, normaliseSlug } from './content';

interface StoreState {
  loaded: boolean;
  articles: Map<string, Article>;
}

const DATA_FILE = path.join(process.cwd(), 'data/news.json');
const state: StoreState = {
  loaded: false,
  articles: new Map(),
};

async function loadFromDisk(): Promise<void> {
  if (state.loaded) return;
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const entries = JSON.parse(content) as unknown[];
    if (Array.isArray(entries)) {
      entries.forEach((item) => {
        try {
          const article = normaliseRawArticle(item);
          state.articles.set(article.slug, article);
        } catch (error) {
          console.warn('Skipping malformed article entry', error);
        }
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Unable to read data/news.json', error);
    }
  } finally {
    state.loaded = true;
  }
}

function normaliseRawArticle(input: any): Article {
  const now = new Date().toISOString();
  const slug = normaliseSlug(String(input?.slug || input?.title || `article-${Date.now()}`));
  const title = String(input?.title || 'Untitled');
  const content = String(input?.content || '');
  const createdAt = String(input?.created_at || input?.createdAt || now);
  const updatedAt = String(input?.updated_at || input?.updatedAt || createdAt);
  const publishedAt = String(input?.published_at || input?.publishedAt || now.slice(0, 10));

  return {
    slug,
    title,
    content,
    excerpt: String(input?.excerpt || extractExcerpt(content)),
    preview_image: input?.preview_image || input?.image_url || undefined,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: publishedAt,
  };
}

async function persistToDisk(): Promise<void> {
  if (process.env.VERCEL) {
    // Vercel builds are ephemeral; skip persisting.
    return;
  }

  const data = Array.from(state.articles.values()).sort(
    (a, b) => Date.parse(b.published_at || b.updated_at) - Date.parse(a.published_at || a.updated_at)
  );
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function ensureLoaded() {
  if (!state.loaded) {
    throw new Error('Store not initialised');
  }
}

export async function getArticle(slug: string): Promise<Article | null> {
  await loadFromDisk();
  ensureLoaded();
  return state.articles.get(slug) ?? null;
}

export async function putArticle(article: Article): Promise<void> {
  await loadFromDisk();
  ensureLoaded();
  state.articles.set(article.slug, article);
  await persistToDisk();
}

export async function deleteArticle(slug: string): Promise<void> {
  await loadFromDisk();
  ensureLoaded();
  state.articles.delete(slug);
  await persistToDisk();
}

export async function getPaginatedArticles(page: number, limit: number): Promise<{ data: Article[]; total: number }> {
  await loadFromDisk();
  ensureLoaded();
  const sorted = Array.from(state.articles.values()).sort(
    (a, b) => Date.parse(b.published_at || b.updated_at) - Date.parse(a.published_at || a.updated_at)
  );
  const total = sorted.length;
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);
  return { data, total };
}

export async function getSummaries(): Promise<ArticleSummary[]> {
  await loadFromDisk();
  ensureLoaded();
  return Array.from(state.articles.values())
    .sort((a, b) => Date.parse(b.published_at || b.updated_at) - Date.parse(a.published_at || a.updated_at))
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      preview_image: article.preview_image,
      updated_at: article.updated_at,
      published_at: article.published_at,
    }));
}
