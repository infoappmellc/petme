import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import type { GetStaticProps } from 'next';
import { getServerApiBaseUrl } from '../lib/config';
import { type NewsItem, getPaginatedNews } from '../lib/news';

interface HomeProps {
  latestNews: NewsItem[];
}

export default function Home({ latestNews }: HomeProps) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.will-animate'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.2 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Head>
        <title>Petme — społeczność miłośników zwierząt w Polsce</title>
        <meta
          name="description"
          content="Polska sieć społecznościowa dla miłośników psów, kotów i innych pupili. Dołącz do Petme, dziel się historiami i pobierz aplikację w Google Play lub App Store."
        />
        <link rel="icon" href="/images/logo.webp" />
      </Head>
      <header className="topbar">
        <div className="container nav">
          <a className="brand" href="#hero">
            PetMe.
          </a>
          <nav className="nav-links" aria-label="Główna nawigacja">
            <a href="#about">O nas</a>
            <a href="#features">Funkcje</a>
            <a href="#news">Aktualności</a>
            <a href="#zasoby">Zasoby</a>
            <a href="#kontakt">Kontakt</a>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="hero-section">
          <div className="container hero-wrapper">
            <div className="hero-content will-animate" data-animate>
              <span className="hero-pill">Nowa aplikacja społecznościowa dla opiekunów</span>
              <h1 className="hero-title">Petme — Twoja społeczność miłośników zwierząt w Polsce</h1>
              <p className="hero-text">Poznawaj, dziel się i pomagaj — wszystko w jednej aplikacji!</p>
              <div className="store-badges">
                <a className="store-badge" href="#pobierz-google" aria-label="Pobierz w Google Play">
                  <img src="/images/google-play.webp" alt="Pobierz w Google Play" />
                </a>
                <a className="store-badge" href="#pobierz-apple" aria-label="Pobierz w App Store">
                  <img src="/images/app-store.webp" alt="Pobierz w App Store" />
                </a>
              </div>
              <a className="hero-link" href="#about">
                Zobacz, jak to działa
              </a>
            </div>
            <div className="hero-media will-animate" data-animate>
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80"
                alt="Grupa przyjaciół z psami i kotami w parku"
              />
              <div className="hero-bubble hero-bubble--top" aria-hidden="true">
                ❤️
              </div>
              <div className="hero-bubble hero-bubble--bottom" aria-hidden="true">
                ⭐
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container about-grid">
            <div className="section-header will-animate" data-animate>
              <h2>O nas</h2>
              <p className="section-subtitle">
                Petme to polska sieć społecznościowa dla miłośników psów, kotów i innych pupili.
                <br />Dołącz do grup, dziel się historiami i poznawaj ludzi z Twojej okolicy.
                <br />Wspólnie budujemy bezpieczne i życzliwe miejsce dla opiekunów zwierząt.
              </p>
            </div>
            <div className="about-card">
              <div className="will-animate" data-animate>
                <img src="/images/image1.png" alt="Animowana grupa ludzi z pupilami" />
              </div>
              <div className="will-animate" data-animate>
                <p>
                  Jesteśmy pierwszą polską społecznością stworzoną specjalnie dla miłośników zwierząt. Nasza misja to
                  wsparcie ludzi, którzy kochają zwierzęta i chcą dzielić się swoją pasją.
                </p>
                <p style={{ marginTop: '1.1rem' }}>
                  W Petme znajdziesz lokalne grupy tematyczne, porady oraz skrzynkę z adopcyjnymi historiami. Każdy dzień
                  to okazja, by dzielić się radością i troską o pupili.
                </p>
                <span className="stat-chip" aria-label="Ponad dziesięć tysięcy aktywnych użytkowników">
                  10 000+ aktywnych użytkowników
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <div className="section-header will-animate" data-animate>
              <h2>Co możesz robić w Petme?</h2>
              <p className="section-subtitle">Funkcje aplikacji, które zbliżają społeczność miłośników zwierząt.</p>
            </div>
            <div className="feature-grid">
              <article className="card will-animate" data-animate>
                <span className="card-icon" role="img" aria-label="Pies">
                  🐶
                </span>
                <h3>Dziel się chwilami</h3>
                <p>Publikuj zdjęcia i wideo swojego pupila, śledź aktywność znajomych i inspiruj się społecznością.</p>
              </article>
              <article className="card will-animate" data-animate>
                <span className="card-icon" role="img" aria-label="Serce">
                  ❤️
                </span>
                <h3>Poznawaj przyjaciół</h3>
                <p>Łącz się z opiekunami zwierząt w Twojej okolicy, twórz grupy tematyczne i wydarzenia.</p>
              </article>
              <article className="card will-animate" data-animate>
                <span className="card-icon" role="img" aria-label="Tarcza">
                  🛡️
                </span>
                <h3>Dbaj o bezpieczeństwo</h3>
                <p>Otrzymuj powiadomienia o zaginięciach, pomocy oraz poradach weterynaryjnych.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="benefits" className="section">
          <div className="container benefit-grid">
            <div className="benefit-content will-animate" data-animate>
              <div className="section-header">
                <h2>Dlaczego warto dołączyć do Petme?</h2>
                <p className="section-subtitle">
                  Petme to społeczność, w której każdy miłośnik zwierząt znajdzie coś dla siebie – niezależnie czy opiekujesz się
                  psiakiem, kotem czy innym pupilem.
                </p>
              </div>
              <ul className="benefit-list">
                <li className="benefit-item will-animate" data-animate>
                  <span className="benefit-icon" role="img" aria-label="Kalendarz">
                    📅
                  </span>
                  Lokalne spotkania i wydarzenia
                </li>
                <li className="benefit-item will-animate" data-animate>
                  <span className="benefit-icon" role="img" aria-label="Serce">
                    💗
                  </span>
                  Adopcje i akcje pomocowe
                </li>
                <li className="benefit-item will-animate" data-animate>
                  <span className="benefit-icon" role="img" aria-label="Gwizdek">
                    📣
                  </span>
                  Powiadomienia na żywo o ważnych wydarzeniach
                </li>
                <li className="benefit-item will-animate" data-animate>
                  <span className="benefit-icon" role="img" aria-label="Gwiazda">
                    ⭐
                  </span>
                  Przyjazny, prosty interfejs
                </li>
              </ul>
            </div>
            <div className="benefit-media will-animate" data-animate>
              <img src="/images/app-preview.webp" alt="Zrzut ekranowy Petme" />
            </div>
          </div>
        </section>

        <section id="news" className="section">
          <div className="container">
            <div className="section-header will-animate" data-animate>
              <h2>Aktualności PetMe</h2>
              <p className="section-subtitle">Najnowsze wiadomości i inspiracje dla miłośników zwierząt.</p>
            </div>
            <div className="news-preview-grid">
              {latestNews.length === 0 && (
                <p className="section-subtitle">Brak opublikowanych artykułów. Odwiedź nas ponownie.</p>
              )}
              {latestNews.map((item) => (
                <article key={item.slug} className="news-preview-card will-animate" data-animate>
                  <div className="news-preview-date">Opublikowano {item.published_at}</div>
                  <h3>{item.title}</h3>
                  <Link className="news-preview-link" href={`/news/${item.slug}`}>
                    Czytaj więcej
                  </Link>
                </article>
              ))}
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link className="news-preview-link" href="/news">
                Zobacz wszystkie aktualności
              </Link>
            </div>
          </div>
        </section>

        <section id="testimonials" className="section">
          <div className="container">
            <div className="section-header will-animate" data-animate>
              <h2>Co mówią użytkownicy?</h2>
              <p className="section-subtitle">Opinie społeczności Petme.pet.</p>
            </div>
            <div className="testimonial-grid">
              <article className="testimonial-card will-animate" data-animate>
                <div className="testimonial-head">
                  <div className="avatar">
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
                      alt="Avatar użytkowniczki Ania"
                      style={{ color: 'transparent' }}
                    />
                  </div>
                  <div>
                    <p className="testimonial-name">Ania, Gdańsk</p>
                    <div className="rating" aria-label="Ocena pięć na pięć">
                      ★★★★★
                    </div>
                  </div>
                </div>
                <p>&quot;Świetne miejsce dla opiekunów psów!&quot;</p>
              </article>
              <article className="testimonial-card will-animate" data-animate>
                <div className="testimonial-head">
                  <div className="avatar">
                    <img
                      src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80"
                      alt="Avatar użytkownika Kuba"
                      style={{ color: 'transparent' }}
                    />
                  </div>
                  <div>
                    <p className="testimonial-name">Kuba, Kraków</p>
                    <div className="rating" aria-label="Ocena pięć na pięć">
                      ★★★★★
                    </div>
                  </div>
                </div>
                <p>&quot;Poznałem tu ludzi z mojego osiedla.&quot;</p>
              </article>
              <article className="testimonial-card will-animate" data-animate>
                <div className="testimonial-head">
                  <div className="avatar">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                      alt="Avatar użytkowniczki Ola"
                      style={{ color: 'transparent' }}
                    />
                  </div>
                  <div>
                    <p className="testimonial-name">Ola, Wrocław</p>
                    <div className="rating" aria-label="Ocena pięć na pięć">
                      ★★★★★
                    </div>
                  </div>
                </div>
                <p>&quot;Uwielbiam grupy adopcyjne i porady.&quot;</p>
              </article>
            </div>
          </div>
        </section>

        <section id="cta" className="section">
          <div className="container">
            <div className="cta-box will-animate" data-animate>
              <h2 className="cta-title">Dołącz do tysięcy miłośników zwierząt już dziś!</h2>
              <p className="cta-text">
                Pobierz aplikację Petme, rozwijaj swoją przyjaźń ze społecznością pełną miłości do zwierząt.
              </p>
              <div className="store-badges" style={{ justifyContent: 'center' }}>
                <a id="pobierz-google" className="store-badge" href="#pobierz-google" aria-label="Pobierz w Google Play">
                  <img src="/images/google-play.webp" alt="Pobierz w Google Play" />
                </a>
                <a id="pobierz-apple" className="store-badge" href="#pobierz-apple" aria-label="Pobierz w App Store">
                  <img src="/images/app-store.webp" alt="Pobierz w App Store" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="kontakt" className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <span className="brand">PetMe.</span>
            <p>
              Polska społeczność dla miłośników zwierząt. Tworzymy bezpieczne i życzliwe miejsce dla opiekunów i ich pupili.
            </p>
            <div className="socials" aria-label="Znajdź nas w mediach społecznościowych">
              <a className="social-pill" href="#facebook" aria-label="Facebook">
                <span aria-hidden="true">f</span>
              </a>
              <a className="social-pill" href="#instagram" aria-label="Instagram">
                <span aria-hidden="true">◎</span>
              </a>
              <a className="social-pill" href="#tiktok" aria-label="TikTok">
                <span aria-hidden="true">♪</span>
              </a>
            </div>
          </div>
          <div className="footer-columns">
            <div className="footer-column">
              <h4>Aplikacja</h4>
              <div className="footer-links">
                <a href="#about">O nas</a>
                <a href="#features">Funkcje</a>
                <a href="#benefits">Społeczność</a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Firma</h4>
              <div className="footer-links">
                <a href="#regulamin">Regulamin</a>
                <a href="#polityka">Polityka prywatności</a>
                <a href="#zasoby">Zasoby</a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Społeczność</h4>
              <div className="footer-links">
                <a href="#kontakt">Kontakt</a>
                <a href="#testimonials">Opinie</a>
                <a href="#news">Aktualności</a>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-meta">© {new Date().getFullYear()} PetMe. Wszelkie prawa zastrzeżone.</div>
      </footer>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const apiBaseUrl = getServerApiBaseUrl();
    const { data } = await getPaginatedNews(apiBaseUrl, 1, 3);
    const latestNews = data.slice(0, 3);
    return {
      props: {
        latestNews,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Unable to fetch homepage news', error);
    return {
      props: {
        latestNews: [],
      },
      revalidate: 60,
    };
  }
};
