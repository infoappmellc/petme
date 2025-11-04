import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { getServerApiBaseUrl } from '../../lib/config';
import { getNewsBySlug, type NewsItem } from '../../lib/news';

interface NewsDetailProps {
  article: NewsItem;
}

export default function NewsDetail({ article }: NewsDetailProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/images/logo.webp" />
        <title>{article.title} - PetMe</title>
        <meta name="description" content={article.title} />
      </Head>
      <header className="topbar">
        <div className="container nav">
          <Link className="brand" href="/">
            PetMe.
          </Link>
          <nav className="nav-links" aria-label="Główna nawigacja">
            <Link href="/">O nas</Link>
            <Link href="/">Funkcje</Link>
            <Link href="/news">Aktualności</Link>
            <Link href="/">Zasoby</Link>
            <a href="#kontakt">Kontakt</a>
          </nav>
        </div>
      </header>
      <main className="article-wrapper">
        <section className="article-hero">
          <div className="container article-hero__inner">
            <div>
              <span className="article-label">Aktualności</span>
              <h1 className="article-title">{article.title}</h1>
              <p className="article-meta">Opublikowano {article.published_at}</p>
            </div>
            <Link href="/news" className="article-back">
              ← Wróć do listy aktualności
            </Link>
          </div>
        </section>
        <section className="article-content container">
          <article dangerouslySetInnerHTML={{ __html: article.content }} />
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NewsDetailProps> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) {
    return { notFound: true };
  }

  const apiBaseUrl = getServerApiBaseUrl();
  const article = await getNewsBySlug(apiBaseUrl, slug);
  if (!article) {
    return { notFound: true };
  }

  return {
    props: {
      article,
    },
  };
};

export const config = {
  runtime: 'edge',
};
