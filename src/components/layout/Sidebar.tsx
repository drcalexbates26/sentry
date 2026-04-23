"use client";

import { colors } from "@/lib/tokens";
import { NAV_ITEMS } from "@/data/nav";
import { useStore } from "@/store";

export function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen } = useStore();

  return (
    <aside
      style={{
        width: sidebarOpen ? 200 : 48,
        flexShrink: 0,
        background: colors.obsidianL,
        borderRight: `1px solid ${colors.panelBorder}`,
        transition: "width 0.12s",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: sidebarOpen ? "14px 14px 10px" : "14px 6px 10px",
          borderBottom: `1px solid ${colors.panelBorder}`,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              color: colors.obsidian,
            }}
          >
            S
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: colors.white, fontWeight: 700, fontSize: 12 }}>Sentry</div>
              <div style={{ color: colors.teal, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em" }}>
                DARK ROCK LABS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "6px 4px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: sidebarOpen ? "6px 10px" : "6px 0",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                marginBottom: 1,
                background: page === item.id ? colors.teal + "18" : "transparent",
                color: page === item.id ? colors.teal : colors.textMuted,
                fontSize: 11,
                fontWeight: page === item.id ? 600 : 400,
                fontFamily: "inherit",
              }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${colors.panelBorder}` }}>
          <div style={{ fontSize: 8, color: colors.textDim }}>v3.1.0</div>
        </div>
      )}
    </aside>
  );
}
