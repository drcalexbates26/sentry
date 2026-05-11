import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link href="/" className="legal-brand">
            <span className="legal-brand-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 20h14v2H5v-2z" fill="currentColor" />
                <path d="M7 18h10l1-3H6l1 3z" fill="currentColor" />
                <path d="M8 15h8V9H8v6z" fill="currentColor" />
                <path d="M7 9h10l-1-3H8L7 9z" fill="currentColor" />
                <path d="M6 6h2V3h2v3h4V3h2v3h2v1H6V6z" fill="currentColor" />
              </svg>
            </span>
            <span>Sentry</span>
          </Link>
          <nav className="legal-nav">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
          </nav>
        </div>
      </header>
      <main className="legal-main">
        <article className="legal-article">
          <p className="legal-eyebrow">Last updated · {lastUpdated}</p>
          <h1>{title}</h1>
          {children}
        </article>
      </main>
      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} Dark Rock Labs, Inc.</span>
        <Link href="/">Back to Sentry</Link>
      </footer>
      <style>{`
        .legal-shell { min-height: 100vh; background: #0A0E14; color: #E2E8F0; }
        .legal-header { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .legal-header-inner { max-width: 920px; margin: 0 auto; padding: 20px 28px; display: flex; align-items: center; justify-content: space-between; }
        .legal-brand { display: flex; gap: 10px; align-items: center; text-decoration: none; color: #E2E8F0; font-weight: 800; letter-spacing: -0.01em; font-size: 18px; }
        .legal-brand-mark { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #00B4A6, #009A8E); display: inline-flex; align-items: center; justify-content: center; color: #0A0E14; }
        .legal-nav { display: flex; gap: 18px; font-size: 14px; }
        .legal-nav a { color: #94A3B8; text-decoration: none; }
        .legal-nav a:hover { color: #33C4B8; }
        .legal-main { padding: 56px 28px 96px; }
        .legal-article { max-width: 760px; margin: 0 auto; }
        .legal-article h1 { font-size: 40px; font-weight: 800; letter-spacing: -0.02em; margin: 8px 0 24px; line-height: 1.1; }
        .legal-article h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; margin: 36px 0 12px; color: #E2E8F0; }
        .legal-article p, .legal-article li { color: #B7C2D2; line-height: 1.7; font-size: 15px; }
        .legal-article p { margin: 12px 0; }
        .legal-article ul { margin: 12px 0 12px 22px; }
        .legal-article li { margin: 6px 0; }
        .legal-article a { color: #33C4B8; }
        .legal-article strong { color: #E2E8F0; }
        .legal-eyebrow { color: #33C4B8; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; }
        .legal-footer { max-width: 920px; margin: 0 auto; padding: 28px; display: flex; justify-content: space-between; font-size: 13px; color: #64748B; border-top: 1px solid rgba(255,255,255,0.06); }
        .legal-footer a { color: #64748B; text-decoration: none; }
        .legal-footer a:hover { color: #33C4B8; }
      `}</style>
    </div>
  );
}
