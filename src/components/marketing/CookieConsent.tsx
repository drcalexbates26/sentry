"use client";

import { useEffect, useState } from "react";

const COOKIE_KEY = "sentry_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!document.cookie.includes(`${COOKIE_KEY}=`)) setVisible(true);
    } catch {
      // SSR / private mode
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    document.cookie = `${COOKIE_KEY}=accepted; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 720,
        margin: "0 auto",
        padding: "14px 18px",
        background: "rgba(10, 14, 20, 0.94)",
        border: "1px solid rgba(0, 180, 166, 0.4)",
        borderRadius: 12,
        backdropFilter: "blur(8px)",
        color: "#E2E8F0",
        fontSize: 13,
        lineHeight: 1.5,
        display: "flex",
        gap: 16,
        alignItems: "center",
        zIndex: 50,
        boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ flex: 1 }}>
        <strong style={{ color: "#33C4B8" }}>We use minimal, first-party cookies.</strong>{" "}
        <span style={{ color: "#94A3B8" }}>
          Sentry only sets cookies required to keep you signed in and remember your preferences. No third-party
          trackers, no advertising.
        </span>{" "}
        <a href="/privacy" style={{ color: "#33C4B8", textDecoration: "underline" }}>
          Privacy policy
        </a>
        .
      </div>
      <button
        type="button"
        onClick={accept}
        style={{
          padding: "8px 14px",
          background: "linear-gradient(135deg, #00B4A6, #009A8E)",
          color: "#0A0E14",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        OK, got it
      </button>
    </div>
  );
}
