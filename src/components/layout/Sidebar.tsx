"use client";

import { useTheme } from "@/lib/theme";
import { NAV_GROUPS, ChevronDown, ChevronRight } from "@/data/nav";
import { useStore } from "@/store";
import { Sun, Moon } from "lucide-react";

export function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen, collapsedGroups, toggleGroup, themeMode, setThemeMode } = useStore();
  const { colors } = useTheme();

  return (
    <aside
      style={{
        width: sidebarOpen ? 215 : 50,
        flexShrink: 0,
        background: colors.bgL,
        borderRight: `1px solid ${colors.panelBorder}`,
        transition: "width 0.18s ease",
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
          padding: sidebarOpen ? "16px 16px 12px" : "16px 8px 12px",
          borderBottom: `1px solid ${colors.panelBorder}`,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 8px ${colors.teal}33`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {/* Rook chess piece */}
              <path d="M5 20h14v2H5v-2z" fill="#0A0E14"/>
              <path d="M7 18h10l1-3H6l1 3z" fill="#0A0E14"/>
              <path d="M8 15h8V9H8v6z" fill="#0A0E14"/>
              <path d="M7 9h10l-1-3H8L7 9z" fill="#0A0E14"/>
              <path d="M6 6h2V3h2v3h4V3h2v3h2v1H6V6z" fill="#0A0E14"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: colors.white, fontWeight: 700, fontSize: 13 }}>Sentry</div>
              <div style={{ color: colors.teal, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em" }}>
                DARK ROCK LABS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "6px 6px", overflowY: "auto" }}>
        {NAV_GROUPS.map((group, groupIdx) => {
          const isCollapsed = collapsedGroups[group.id] ?? false;
          const hasActiveItem = group.items.some((item) => item.id === page);

          return (
            <div key={group.id} style={{ marginBottom: 2 }}>
              {/* Separator before collapsible groups */}
              {group.collapsible && sidebarOpen && groupIdx > 0 && (
                <div style={{ height: 1, background: colors.panelBorder, margin: "6px 8px 4px" }} />
              )}

              {/* Group Header */}
              {group.collapsible && sidebarOpen && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "5px 10px", marginTop: 2,
                    borderRadius: 5, border: "none", cursor: "pointer",
                    background: "transparent",
                    color: hasActiveItem ? colors.teal : colors.textDim,
                    fontSize: 9, fontWeight: 700, fontFamily: "inherit",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    transition: "color 0.15s",
                  }}
                >
                  <span>{group.label}</span>
                  {isCollapsed
                    ? <ChevronRight size={10} style={{ opacity: 0.5 }} />
                    : <ChevronDown size={10} style={{ opacity: 0.5 }} />
                  }
                </button>
              )}

              {/* Group Items */}
              {(!group.collapsible || !isCollapsed) && group.items.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      width: "100%",
                      padding: sidebarOpen
                        ? (group.collapsible ? "6px 10px 6px 20px" : "7px 10px")
                        : "7px 0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      borderRadius: 7, border: "none", cursor: "pointer",
                      marginBottom: 1,
                      background: isActive ? colors.teal + "15" : "transparent",
                      borderLeft: isActive && sidebarOpen ? `2px solid ${colors.teal}` : "2px solid transparent",
                      color: isActive ? colors.teal : colors.textMuted,
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "inherit",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = colors.panelBorder + "33";
                        (e.currentTarget as HTMLElement).style.color = colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = colors.textMuted;
                      }
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: sidebarOpen ? "10px 14px" : "10px 6px", borderTop: `1px solid ${colors.panelBorder}` }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            justifyContent: sidebarOpen ? "flex-start" : "center",
            width: "100%", padding: "6px 6px",
            borderRadius: 7, border: `1px solid ${colors.panelBorder}`,
            cursor: "pointer",
            background: colors.obsidianM,
            color: colors.textMuted, fontSize: 10, fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {themeMode === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          {sidebarOpen && <span style={{ fontWeight: 500 }}>{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        {sidebarOpen && <div style={{ fontSize: 8, color: colors.textDim, marginTop: 6 }}>Sentry v3.1.0</div>}
      </div>
    </aside>
  );
}
