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
  excerpt: string;
  preview_image?: string;
  updated_at: string;
  published_at: string;
}
