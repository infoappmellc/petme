import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import type { NewsItem } from '../../lib/news';
import { clientApiBaseUrl } from '../../lib/config';

interface ApiListResponse {
  data: NewsItem[];
  total: number;
  page: number;
  limit: number;
}

type RichTextEditorGlobal = Window & { RichTextEditor?: any };

const createInitialForm = () => ({
  title: '',
  slug: '',
  published_at: new Date().toISOString().slice(0, 10),
  content: '',
});

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123123';
const EDITOR_ELEMENT_ID = 'admin-news-editor';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [form, setForm] = useState(createInitialForm);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [rteReady, setRteReady] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<any>(null);
  const editorLastHtmlRef = useRef('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const apiBase = clientApiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const withBase = (path: string) => {
    const base = apiBase.replace(/\/$/, '');
    return `${base}${path}`;
  };

  const editorScripts = (
    <>
      <Script
        src="/vendor/rte/scripts/rte.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as RichTextEditorGlobal).RichTextEditor) {
            setRteReady(true);
          }
        }}
      />
      <Script src="/vendor/rte/scripts/all_plugins.js" strategy="afterInteractive" />
    </>
  );

  const initializeEditor = useCallback(() => {
    if (!rteReady) return;
    if (typeof window === 'undefined') return;
    if (!editorContainerRef.current) return;
    if (editorInstanceRef.current) return;

    const globalWithRte = window as RichTextEditorGlobal & { RTE_DefaultConfig?: Record<string, unknown> };
    if (globalWithRte.RTE_DefaultConfig) {
      globalWithRte.RTE_DefaultConfig.url_base = '/vendor/rte';
      globalWithRte.RTE_DefaultConfig.contentCssUrl = '/vendor/rte/runtime/richtexteditor_content.css';
      globalWithRte.RTE_DefaultConfig.previewCssUrl = '/vendor/rte/runtime/richtexteditor_preview.css';
      globalWithRte.RTE_DefaultConfig.previewScriptUrl = '/vendor/rte/runtime/richtexteditor_preview.js';
      globalWithRte.RTE_DefaultConfig.helpUrl = '/vendor/rte/runtime/help.htm';
    }
    const RTE = globalWithRte.RichTextEditor;
    if (!RTE) return;

    const instance = new RTE(`#${EDITOR_ELEMENT_ID}`);
    editorInstanceRef.current = instance;

    const initialHtml = form.content || '';
    if (typeof instance.setHTMLCode === 'function') {
      instance.setHTMLCode(initialHtml);
    } else if (typeof instance.insertHTML === 'function') {
      instance.insertHTML(initialHtml);
    }
    editorLastHtmlRef.current = initialHtml;

    const syncFromEditor = () => {
      const html =
        typeof instance.getHTMLCode === 'function'
          ? instance.getHTMLCode()
          : typeof instance.getText === 'function'
          ? instance.getText()
          : '';
      editorLastHtmlRef.current = html;
      setForm((prev) => ({ ...prev, content: html }));
    };

    if (typeof instance.attachEvent === 'function') {
      instance.attachEvent('change', syncFromEditor);
    } else if (typeof instance.onchange === 'function') {
      instance.onchange = syncFromEditor;
    }
  }, [form.content, rteReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as RichTextEditorGlobal).RichTextEditor) {
      setRteReady(true);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    initializeEditor();
  }, [initializeEditor, loggedIn]);

  useEffect(() => {
    if (!editorInstanceRef.current) return;
    const html = form.content || '';
    if (editorLastHtmlRef.current === html) {
      return;
    }
    if (typeof editorInstanceRef.current.setHTMLCode === 'function') {
      editorInstanceRef.current.setHTMLCode(html);
      editorLastHtmlRef.current = html;
    }
  }, [form.content]);

  useEffect(() => {
    return () => {
      const instance = editorInstanceRef.current;
      if (instance) {
        if (typeof instance.destroy === 'function') {
          instance.destroy();
        } else if (typeof instance.dispose === 'function') {
          instance.dispose();
        }
      }
      editorInstanceRef.current = null;
    };
  }, []);

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
      setError('Không thể tải danh sách tin tức.');
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
        throw new Error(data.error || 'Đã xảy ra lỗi.');
      }
      setMessage('Đã lưu bài viết tin tức.');
      setForm(createInitialForm());
      editorLastHtmlRef.current = '';
      if (editorInstanceRef.current && typeof editorInstanceRef.current.setHTMLCode === 'function') {
        editorInstanceRef.current.setHTMLCode('');
      }
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
    editorLastHtmlRef.current = item.content;
    setMessage('Đang chỉnh sửa — cập nhật nội dung rồi bấm "Cập nhật".');
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
        throw new Error(data.error || 'Đã xảy ra lỗi.');
      }
      setMessage('Đã cập nhật bài viết.');
      setForm(createInitialForm());
      editorLastHtmlRef.current = '';
      if (editorInstanceRef.current && typeof editorInstanceRef.current.setHTMLCode === 'function') {
        editorInstanceRef.current.setHTMLCode('');
      }
      fetchNews(page);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
    try {
      const res = await fetch(withBase(`/api/news/${slug}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Đã xảy ra lỗi khi xóa.');
      }
      setMessage('Đã xóa bài viết.');
      fetchNews(page);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!token) {
      setError('Hãy nhập mã quản trị trước khi tải tệp lên.');
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
        throw new Error(data.error || 'Đã xảy ra lỗi khi tải lên.');
      }
      const data = await res.json();
      setMessage(`Tải tệp thành công. URL: ${data.url}`);
      setForm((prev) => {
        const updatedContent = `${prev.content}\n<img src="${data.url}" alt="" />`;
        editorLastHtmlRef.current = updatedContent;
        return { ...prev, content: updatedContent };
      });
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
      setError('Sai tên đăng nhập hoặc mật khẩu.');
      return;
    }

    setToken(DEFAULT_PASSWORD);
    setLoggedIn(true);
    setMessage('Đăng nhập thành công.');
    setCredentials({ username: '', password: '' });
  };

  if (!loggedIn) {
    return (
      <>
        {editorScripts}
        <Head>
          <link rel="icon" href="/images/logo.webp" />
          <link rel="stylesheet" href="/vendor/rte/styles/rte-theme-default.css" />
          <title>Đăng nhập quản trị PetMe</title>
        </Head>
        <main className="section" style={{ paddingTop: '4rem' }}>
          <div className="container" style={{ maxWidth: '480px', display: 'grid', gap: '1.5rem' }}>
            <h1>Bảng điều khiển quản trị</h1>
            <p className="section-subtitle">Sử dụng thông tin đăng nhập mặc định để truy cập bảng điều khiển.</p>
            <form onSubmit={handleLogin} className="card" style={{ padding: '2rem', display: 'grid', gap: '1rem', boxShadow: 'var(--shadow-card)' }}>
              <div>
                <label htmlFor="username">Tên đăng nhập</label>
                <input id="username" name="username" value={credentials.username} onChange={handleCredentialsChange} autoComplete="username" required />
              </div>
              <div>
                <label htmlFor="password">Mật khẩu</label>
                <input id="password" name="password" type="password" value={credentials.password} onChange={handleCredentialsChange} autoComplete="current-password" required />
              </div>
              <button type="submit" className="button-primary">Đăng nhập</button>
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
      {editorScripts}
      <Head>
        <link rel="icon" href="/images/logo.webp" />
        <link rel="stylesheet" href="/vendor/rte/styles/rte-theme-default.css" />
        <title>Bảng điều khiển quản trị PetMe</title>
      </Head>
      <main className="section" style={{ paddingTop: '4rem' }}>
        <div className="container" style={{ display: 'grid', gap: '2rem' }}>
          <h1>Bảng điều khiển quản trị</h1>
          <section className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2>Thêm / Chỉnh sửa tin tức</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label htmlFor="title">Tiêu đề</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="slug">Slug (URL)</label>
                <input id="slug" name="slug" value={form.slug} onChange={handleChange} placeholder="ví dụ: cam-nang-cho-meo" />
              </div>
              <div>
                <label htmlFor="published_at">Ngày đăng</label>
                <input type="date" id="published_at" name="published_at" value={form.published_at} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor={EDITOR_ELEMENT_ID}>Nội dung (HTML hoặc văn bản)</label>
                <div
                  id={EDITOR_ELEMENT_ID}
                  ref={editorContainerRef}
                  style={{ minHeight: '320px', border: '1px solid var(--border-muted, rgba(0, 0, 0, 0.12))', borderRadius: '0.5rem' }}
                />
                <small>Khi dán bài viết từ trang khác, hình ảnh sẽ được tải về và lưu lại trên máy chủ.</small>
              </div>
              <div>
                <label htmlFor="upload">Tải ảnh lên</label>
                <input id="upload" type="file" accept="image/*" onChange={handleUpload} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit">Lưu bài viết mới</button>
                <button type="button" onClick={handleUpdate}>
                  Cập nhật bài viết hiện có
                </button>
              </div>
            </form>
          </section>

          {message && <div className="messages">{message}</div>}
          {error && <div className="errors">{error}</div>}

          <section className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2>Danh sách tin tức</h2>
            {loading ? (
              <p>Đang tải…</p>
            ) : news.length === 0 ? (
              <p>Chưa có bài viết.</p>
            ) : (
              <div className="news-list">
                {news.map((item) => (
                  <article key={item.slug} className="news-preview-card" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="news-preview-date">Đăng ngày {item.published_at}</div>
                    <h3>{item.title}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => handleEdit(item)}>
                        Chỉnh sửa
                      </button>
                      <button type="button" onClick={() => handleDelete(item.slug)}>
                        Xóa
                      </button>
                      <a className="news-preview-link" href={`/news/${item.slug}`} target="_blank" rel="noopener">
                        Xem trước
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <nav className="pagination" aria-label="Phân trang">
                {page > 1 && (
                  <button type="button" onClick={() => fetchNews(page - 1)}>
                    « Trang trước
                  </button>
                )}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const p = index + 1;
                  if (p === page) {
                    return (
                      <span key={p} className="current">
                        Trang {p}
                      </span>
                    );
                  }
                  return (
                    <button key={p} type="button" onClick={() => fetchNews(p)}>
                      Trang {p}
                    </button>
                  );
                })}
                {page < totalPages && (
                  <button type="button" onClick={() => fetchNews(page + 1)}>
                    Trang tiếp »
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
