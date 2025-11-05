export interface NewsItem {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published_at: string;
  updated_at: string;
  created_at: string;
  image_url?: string;
  preview_image?: string;
}

export interface PaginatedNewsResponse {
  data: NewsItem[];
  total: number;
  page: number;
  limit: number;
}

function makeUrl(baseUrl: string, path: string, searchParams?: Record<string, string | number | undefined>) {
  const url = new URL(path, baseUrl);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url;
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error('The API returned an invalid JSON response.');
  }
}

export async function getPaginatedNews(apiBaseUrl: string, page: number, perPage: number): Promise<PaginatedNewsResponse> {
  const url = makeUrl(apiBaseUrl, '/api/news', { page, limit: perPage });
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        data: [],
        total: 0,
        page,
        limit: perPage,
      };
    }
    throw new Error(`Failed to fetch news list (status ${response.status}).`);
  }

  return handleJsonResponse<PaginatedNewsResponse>(response);
}

export async function getNewsBySlug(apiBaseUrl: string, slug: string): Promise<NewsItem | null> {
  const url = makeUrl(apiBaseUrl, `/api/news/${encodeURIComponent(slug)}`);
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch article (status ${response.status}).`);
  }

  return handleJsonResponse<NewsItem>(response);
}
