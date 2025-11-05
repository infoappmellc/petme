import { load } from 'cheerio';

export function normaliseSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `article-${Date.now()}`
  );
}

const DEFAULT_EXCERPT_LENGTH = 220;

export function extractExcerpt(html: string, maxLength = DEFAULT_EXCERPT_LENGTH): string {
  const $ = load(`<div>${html}</div>`);
  const text = $.text().replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '').trim()}…`;
}

function toDataUrl(buffer: Uint8Array, contentType: string): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

async function fetchRemoteImage(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) {
      console.warn('Remote image responded with error', src, response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return toDataUrl(new Uint8Array(arrayBuffer), contentType);
  } catch (error) {
    console.error('Unable to fetch remote image', src, error);
    return null;
  }
}

export async function rewriteContentImages(html: string): Promise<{ html: string; firstImage?: string }> {
  const $ = load(html);
  const images = $('img');
  let firstImage: string | undefined;

  await Promise.all(
    images.toArray().map(async (element) => {
      const img = $(element);
      const src = img.attr('src');
      if (!src) return;

      if (src.startsWith('data:')) {
        if (!firstImage) firstImage = src;
        return;
      }

      if (/^https?:\/\//i.test(src)) {
        const dataUrl = await fetchRemoteImage(src);
        if (dataUrl) {
          img.attr('src', dataUrl);
          if (!firstImage) firstImage = dataUrl;
        }
        return;
      }

      if (!firstImage) {
        firstImage = src;
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
