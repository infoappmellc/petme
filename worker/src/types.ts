export interface Env {
  ADMIN_TOKEN: string;
  MEDIA_BASE_URL?: string;
  NEWS: KVNamespace;
  UPLOADS: R2Bucket;
}

export interface Article {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  preview_image?: string;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  published_at: string;
  updated_at: string;
  excerpt: string;
  preview_image?: string;
}
