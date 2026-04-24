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
        width: sidebarOpen ? 210 : 48,
        flexShrink: 0,
        background: colors.bgL,
        borderRight: `1px solid ${colors.panelBorder}`,
        transition: "width 0.15s",
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
              width: 30, height: 30, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: themeMode === "dark" ? "#0A0E14" : "#FFFFFF",
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
      <nav style={{ flex: 1, padding: "4px 4px", overflowY: "auto" }}>
        {NAV_GROUPS.map((group) => {
          const isCollapsed = collapsedGroups[group.id] ?? false;
          const hasActiveItem = group.items.some((item) => item.id === page);

          return (
            <div key={group.id} style={{ marginBottom: group.collapsible ? 2 : 4 }}>
              {/* Group Header */}
              {group.collapsible && sidebarOpen && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "6px 10px", marginTop: group.id === "onboarding" ? 4 : 2,
                    borderRadius: 5, border: "none", cursor: "pointer",
                    background: "transparent",
                    color: hasActiveItem ? colors.teal : colors.textDim,
                    fontSize: 9, fontWeight: 700, fontFamily: "inherit",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}
                >
                  <span>{group.label}</span>
                  {isCollapsed
                    ? <ChevronRight size={11} style={{ opacity: 0.5 }} />
                    : <ChevronDown size={11} style={{ opacity: 0.5 }} />
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
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%",
                      padding: sidebarOpen
                        ? (group.collapsible ? "5px 10px 5px 18px" : "6px 10px")
                        : "6px 0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      borderRadius: 6, border: "none", cursor: "pointer",
                      marginBottom: 1,
                      background: isActive ? colors.teal + "18" : "transparent",
                      color: isActive ? colors.teal : colors.textMuted,
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "inherit",
                      transition: "background 0.1s",
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}

              {/* Collapsed indicator when sidebar collapsed */}
              {group.collapsible && isCollapsed && sidebarOpen && (
                <div style={{ height: 1, background: colors.panelBorder, margin: "4px 10px" }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — Theme toggle + version */}
      <div style={{ padding: sidebarOpen ? "8px 14px" : "8px 6px", borderTop: `1px solid ${colors.panelBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            justifyContent: sidebarOpen ? "flex-start" : "center",
            width: "100%", padding: "5px 4px",
            borderRadius: 5, border: "none", cursor: "pointer",
            background: "transparent",
            color: colors.textMuted, fontSize: 10, fontFamily: "inherit",
          }}
        >
          {themeMode === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          {sidebarOpen && <span>{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        {sidebarOpen && <div style={{ fontSize: 8, color: colors.textDim }}>v3.1.0</div>}
      </div>
    </aside>
  );
}
