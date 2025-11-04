import { load } from 'cheerio';
import type { Env } from '../types';
import { saveRemoteImage } from './uploads';

const DEFAULT_EXCERPT_LENGTH = 220;

export function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `article-${Date.now()}`;
}

export function extractExcerpt(html: string, maxLength = DEFAULT_EXCERPT_LENGTH): string {
  const $ = load(`<div>${html}</div>`);
  const text = $.text().replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '').trim()}…`;
}

export async function rewriteContentImages(env: Env, html: string, slug: string): Promise<{ html: string; firstImage?: string }> {
  const $ = load(html);
  const images = $('img');
  let firstImage: string | undefined;

  await Promise.all(
    images
      .toArray()
      .map(async (element) => {
        const img = $(element);
        const src = img.attr('src');
        if (!src) return;

        if (src.startsWith('/media/')) {
          if (!firstImage) firstImage = src;
          return;
        }

        if (env.MEDIA_BASE_URL && src.startsWith(env.MEDIA_BASE_URL)) {
          if (!firstImage) firstImage = src;
          return;
        }

        if (src.startsWith('https://') && src.includes('r2.dev')) {
          if (!firstImage) firstImage = src;
          return;
        }

        if (/^data:/i.test(src)) {
          // embedded data URL, leave as is
          if (!firstImage) firstImage = src;
          return;
        }

        if (!/^https?:\/\//i.test(src)) {
          // already relative (likely uploaded), leave unchanged
          if (!firstImage) firstImage = src;
          return;
        }

        const newUrl = await saveRemoteImage(env, slug, src);
        if (newUrl) {
          img.attr('src', newUrl);
          if (!firstImage) firstImage = newUrl;
        }
      })
  );

  const cleaned = $.root()
    .children()
    .map((_, element) => $.html(element))
    .get()
    .join('\n');

  return { html: cleaned, firstImage };
}
