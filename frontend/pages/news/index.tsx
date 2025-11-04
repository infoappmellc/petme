import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { getServerApiBaseUrl } from '../../lib/config';
import { getPaginatedNews, type NewsItem } from '../../lib/news';

interface NewsListProps {
  items: NewsItem[];
  page: number;
  total: number;
  perPage: number;
}

export default function NewsList({ items, page, total, perPage }: NewsListProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <>
      <Head>
        <link rel="icon" href="/images/logo.webp" />
        <title>Aktualności PetMe.</title>
        <meta name="description" content="Najnowsze aktualności dla miłośników zwierząt." />
      </Head>
      <main className="section" style={{ paddingTop: '4rem' }}>
        <div className="container">
          <h1>Aktualności PetMe.</h1>
          {items.length === 0 ? (
            <p className="section-subtitle">Brak opublikowanych artykułów.</p>
          ) : (
            <div className="news-list">
              {items.map((item) => (
                <article key={item.slug} className="news-preview-card" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="news-preview-date">Opublikowano {item.published_at}</div>
                  <h2>{item.title}</h2>
                  <Link className="news-preview-link" href={`/news/${item.slug}`}>
                    Czytaj więcej
                  </Link>
                </article>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Stronicowanie aktualności">
              {page > 1 && (
                <Link href={`/news?page=${page - 1}`}>« Poprzednia</Link>
              )}
              {Array.from({ length: totalPages }).map((_, index) => {
                const p = index + 1;
                if (Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p}>…</span>;
                  }
                  return null;
                }
                if (p === page) {
                  return (
                    <span key={p} className="current">
                      Strona {p}
                    </span>
                  );
                }
                return (
                  <Link key={p} href={`/news?page=${p}`}>
                    Strona {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link href={`/news?page=${page + 1}`}>Następna »</Link>
              )}
            </nav>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NewsListProps> = async ({ query }) => {
  const page = parseInt((query.page as string) || '1', 10) || 1;
  const perPage = 10;
  const apiBaseUrl = getServerApiBaseUrl();
  const { data, total, limit } = await getPaginatedNews(apiBaseUrl, Math.max(page, 1), perPage);
  return {
    props: {
      items: data,
      total,
      perPage: limit,
      page: Math.max(page, 1),
    },
  };
};
