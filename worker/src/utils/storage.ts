import type { Article, ArticleSummary, Env } from '../types';

const ARTICLE_PREFIX = 'article:';
const INDEX_KEY = 'index';

function requireKv(env: Env): KVNamespace {
  if (!env.NEWS) {
    throw new Error('KV namespace "NEWS" is not bound. Update wrangler.toml before deploying.');
  }
  return env.NEWS;
}

export async function getArticle(env: Env, slug: string): Promise<Article | null> {
  const kv = requireKv(env);
  const article = await kv.get<Article>(ARTICLE_PREFIX + slug, 'json');
  return article ?? null;
}

export async function putArticle(env: Env, article: Article): Promise<void> {
  const kv = requireKv(env);
  await kv.put(ARTICLE_PREFIX + article.slug, JSON.stringify(article));
  await upsertIndexEntry(env, article);
}

export async function deleteArticle(env: Env, slug: string): Promise<void> {
  const kv = requireKv(env);
  await kv.delete(ARTICLE_PREFIX + slug);
  const index = await getIndex(env);
  const filtered = index.filter((entry) => entry.slug !== slug);
  await putIndex(env, filtered);
}

export async function getPaginatedArticles(
  env: Env,
  page: number,
  limit: number
): Promise<{ data: Article[]; total: number }> {
  const index = await getIndex(env);
  const total = index.length;
  const start = (page - 1) * limit;
  const slice = index.slice(start, start + limit);
  const data = await Promise.all(
    slice.map((item) => getArticle(env, item.slug))
  );
  const articles = data.filter((item): item is Article => Boolean(item));
  return { data: articles, total };
}

async function getIndex(env: Env): Promise<ArticleSummary[]> {
  const kv = requireKv(env);
  const index = await kv.get<ArticleSummary[]>(INDEX_KEY, 'json');
  if (!Array.isArray(index)) {
    return [];
  }
  return index;
}

async function putIndex(env: Env, index: ArticleSummary[]): Promise<void> {
  const kv = requireKv(env);
  await kv.put(INDEX_KEY, JSON.stringify(index));
}

async function upsertIndexEntry(env: Env, article: Article): Promise<void> {
  const index = await getIndex(env);
  const entry: ArticleSummary = {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    preview_image: article.preview_image,
    published_at: article.published_at,
    updated_at: article.updated_at,
  };

  const existingIndex = index.findIndex((item) => item.slug === article.slug);
  if (existingIndex >= 0) {
    index[existingIndex] = entry;
  } else {
    index.push(entry);
  }

  index.sort((a, b) => {
    const dateA = Date.parse(a.published_at || a.updated_at);
    const dateB = Date.parse(b.published_at || b.updated_at);
    return dateB - dateA;
  });

  await putIndex(env, index);
}
