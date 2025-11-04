import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { NewsItem } from '../../lib/news';
import { clientApiBaseUrl } from '../../lib/config';

interface ApiListResponse {
  data: NewsItem[];
  total: number;
  page: number;
  limit: number;
}

const initialForm = {
  title: '',
  slug: '',
  published_at: new Date().toISOString().slice(0, 10),
  content: '',
};

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123123';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [form, setForm] = useState(initialForm);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loggedIn, setLoggedIn] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const apiBase = clientApiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const withBase = (path: string) => {
    const base = apiBase.replace(/\/$/, '');
    return `${base}${path}`;
  };

  const fetchNews = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await fetch(withBase(`/api/news?page=${pageNumber}&limit=${limit}`));
      const json: ApiListResponse = await res.json();
      setNews(json.data);
      setTotal(json.total);
      setPage(json.page);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać listy aktualności.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchNews();
    }
  }, [loggedIn]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(withBase('/api/news'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Wystąpił błąd');
      }
      setMessage('Zapisano aktualność.');
      setForm(initialForm);
      fetchNews();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setForm({
      title: item.title,
      slug: item.slug,
      published_at: item.published_at,
      content: item.content,
    });
    setMessage('Tryb edycji — wprowadź zmiany i kliknij "Aktualizuj".');
  };

  const handleUpdate = async () => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(withBase(`/api/news/${form.slug}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Wystąpił błąd');
      }
      setMessage('Zaktualizowano aktualność.');
      setForm(initialForm);
      fetchNews(page);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten artykuł?')) return;
    try {
      const res = await fetch(withBase(`/api/news/${slug}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Wystąpił błąd podczas usuwania.');
      }
      setMessage('Usunięto artykuł.');
      fetchNews(page);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!token) {
      setError('Wpisz token administratora przed przesłaniem pliku.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(withBase('/api/uploads'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Wystąpił błąd podczas przesyłania.');
      }
      const data = await res.json();
      setMessage(`Przesłano plik. URL: ${data.url}`);
      setForm((prev) => ({ ...prev, content: `${prev.content}\n<img src="${data.url}" alt="" />` }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCredentialsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const username = credentials.username.trim();
    if (username !== DEFAULT_USERNAME || credentials.password !== DEFAULT_PASSWORD) {
      setError('Nieprawidłowa nazwa użytkownika lub hasło.');
      return;
    }

    setToken(DEFAULT_PASSWORD);
    setLoggedIn(true);
    setMessage('Zalogowano pomyślnie.');
    setCredentials({ username: '', password: '' });
  };

  if (!loggedIn) {
    return (
      <>
        <Head>
          <link rel="icon" href="/images/logo.webp" />
          <title>Logowanie administratora PetMe</title>
        </Head>
        <main className="section" style={{ paddingTop: '4rem' }}>
          <div className="container" style={{ maxWidth: '480px', display: 'grid', gap: '1.5rem' }}>
            <h1>Panel administracyjny</h1>
            <p className="section-subtitle">Użyj domyślnych danych logowania, aby uzyskać dostęp do panelu.</p>
            <form onSubmit={handleLogin} className="card" style={{ padding: '2rem', display: 'grid', gap: '1rem', boxShadow: 'var(--shadow-card)' }}>
              <div>
                <label htmlFor="username">Nazwa użytkownika</label>
                <input id="username" name="username" value={credentials.username} onChange={handleCredentialsChange} autoComplete="username" required />
              </div>
              <div>
                <label htmlFor="password">Hasło</label>
                <input id="password" name="password" type="password" value={credentials.password} onChange={handleCredentialsChange} autoComplete="current-password" required />
              </div>
              <button type="submit" className="button-primary">Zaloguj</button>
            </form>
            {error && <div className="errors">{error}</div>}
            {message && <div className="messages">{message}</div>}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/images/logo.webp" />
        <title>Panel administracyjny PetMe</title>
      </Head>
      <main className="section" style={{ paddingTop: '4rem' }}>
        <div className="container" style={{ display: 'grid', gap: '2rem' }}>
          <h1>Panel administracyjny</h1>
          <section className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2>Dodaj / Edytuj aktualność</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label htmlFor="title">Tytuł</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="slug">Slug (URL)</label>
                <input id="slug" name="slug" value={form.slug} onChange={handleChange} placeholder="np. wielki-poradnik" />
              </div>
              <div>
                <label htmlFor="published_at">Data publikacji</label>
                <input type="date" id="published_at" name="published_at" value={form.published_at} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="content">Treść (HTML lub tekst)</label>
                <textarea id="content" name="content" rows={12} value={form.content} onChange={handleChange} required />
                <small>Wklejając artykuł z innej strony, obrazki zostaną pobrane i zapisane lokalnie.</small>
              </div>
              <div>
                <label htmlFor="upload">Prześlij obraz</label>
                <input id="upload" type="file" accept="image/*" onChange={handleUpload} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit">Zapisz jako nowy</button>
                <button type="button" onClick={handleUpdate}>
                  Aktualizuj istniejący
                </button>
              </div>
            </form>
          </section>

          {message && <div className="messages">{message}</div>}
          {error && <div className="errors">{error}</div>}

          <section className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2>Lista aktualności</h2>
            {loading ? (
              <p>Ładowanie…</p>
            ) : news.length === 0 ? (
              <p>Brak artykułów.</p>
            ) : (
              <div className="news-list">
                {news.map((item) => (
                  <article key={item.slug} className="news-preview-card" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="news-preview-date">Opublikowano {item.published_at}</div>
                    <h3>{item.title}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => handleEdit(item)}>
                        Edytuj
                      </button>
                      <button type="button" onClick={() => handleDelete(item.slug)}>
                        Usuń
                      </button>
                      <a className="news-preview-link" href={`/news/${item.slug}`} target="_blank" rel="noopener">
                        Podgląd
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <nav className="pagination" aria-label="Stronicowanie">
                {page > 1 && (
                  <button type="button" onClick={() => fetchNews(page - 1)}>
                    « Poprzednia
                  </button>
                )}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const p = index + 1;
                  if (p === page) {
                    return (
                      <span key={p} className="current">
                        Strona {p}
                      </span>
                    );
                  }
                  return (
                    <button key={p} type="button" onClick={() => fetchNews(p)}>
                      Strona {p}
                    </button>
                  );
                })}
                {page < totalPages && (
                  <button type="button" onClick={() => fetchNews(page + 1)}>
                    Następna »
                  </button>
                )}
              </nav>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
