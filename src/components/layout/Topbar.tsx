"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useColors } from "@/lib/theme";
import { setViewTenant, getTenantContext } from "@/app/app/_actions";

interface TenantContext {
  tenantId: string;
  tenantName: string;
  isDemoTenant: boolean;
  userRole: string;
  userEmail: string;
  userFullName: string | null;
  userAppRole: string;
  userCompany: string | null;
  isImpersonating: boolean;
  homeTenantId: string;
  homeTenantName: string;
  availableTenants: { id: string; name: string; slug: string; isDemoTenant: boolean }[];
}

function initialsOf(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

function roleLabel(appRole: string): string {
  if (appRole === "admin") return "Administrator";
  if (appRole === "manager") return "Manager";
  if (appRole === "analyst") return "Analyst";
  if (appRole === "viewer") return "Viewer";
  return appRole;
}

export function Topbar() {
  const colors = useColors();
  const [ctx, setCtx] = useState<TenantContext | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTenantContext().then(setCtx).catch(() => setCtx(null));
  }, []);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!ctx) return null;

  const isSuperAdmin = ctx.userRole === "super_admin";
  const filtered = ctx.availableTenants.filter((t) =>
    !filter || t.name.toLowerCase().includes(filter.toLowerCase()) || t.slug.toLowerCase().includes(filter.toLowerCase())
  );

  function switchTo(tenantId: string | null) {
    startTransition(async () => {
      await setViewTenant(tenantId);
      setOpen(false);
      // Reload to re-fetch all tenant-scoped data
      window.location.reload();
    });
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0 14px",
        marginBottom: 8,
        borderBottom: `1px solid ${colors.panelBorder}`,
        background: colors.bg,
      }}
    >
      {/* Left side: impersonation banner if active */}
      <div style={{ flex: 1 }}>
        {ctx.isImpersonating && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 11px",
              borderRadius: 999,
              background: "rgba(247, 144, 9, 0.12)",
              border: "1px solid rgba(247, 144, 9, 0.4)",
              color: "#FCD34D",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "Figtree, sans-serif",
            }}
          >
            <span style={{ fontSize: 9 }}>●</span>
            VIEWING AS {ctx.tenantName.toUpperCase()}
            <button
              onClick={() => switchTo(null)}
              disabled={pending}
              style={{
                marginLeft: 6,
                background: "transparent",
                border: 0,
                color: "#FCD34D",
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "underline",
                cursor: pending ? "wait" : "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              return home →
            </button>
          </div>
        )}
      </div>

      {/* Right side: user menu + tenant switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <UserMenu ctx={ctx} colors={colors} />

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => isSuperAdmin && setOpen((v) => !v)}
          disabled={!isSuperAdmin}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            borderRadius: 8,
            background: ctx.isImpersonating ? "rgba(247, 144, 9, 0.10)" : colors.panel,
            border: `1px solid ${ctx.isImpersonating ? "rgba(247, 144, 9, 0.4)" : colors.panelBorder}`,
            color: colors.text,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "Figtree, sans-serif",
            cursor: isSuperAdmin ? "pointer" : "default",
            minWidth: 180,
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ctx.isDemoTenant ? "#F97316" : colors.teal,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ color: colors.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {ctx.isDemoTenant ? "Demo" : "Tenant"}
            </div>
            <div style={{ color: colors.text, fontSize: 12, fontWeight: 700 }}>{ctx.tenantName}</div>
          </div>
          {isSuperAdmin && (
            <span style={{ color: colors.textMuted, fontSize: 11 }}>{open ? "▴" : "▾"}</span>
          )}
        </button>

        {/* user-menu + tenant-switcher wrapper closed below */}
        {open && isSuperAdmin && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              width: 360,
              maxHeight: 480,
              background: colors.panel,
              border: `1px solid ${colors.panelBorder}`,
              borderRadius: 10,
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.panelBorder}` }}>
              <div style={{ color: colors.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                Switch tenant view
              </div>
              <input
                type="text"
                placeholder="Filter…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 7,
                  background: colors.bgL,
                  border: `1px solid ${colors.panelBorder}`,
                  color: colors.text,
                  fontSize: 12,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {/* Home tenant always shown at top */}
              {ctx.homeTenantId !== ctx.tenantId && (
                <button
                  onClick={() => switchTo(null)}
                  disabled={pending}
                  style={rowBtn(colors, false)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ color: colors.tealLight, fontSize: 13 }}>🏠</span>
                    <div>
                      <div style={{ color: colors.text, fontSize: 12, fontWeight: 700 }}>{ctx.homeTenantName}</div>
                      <div style={{ color: colors.textDim, fontSize: 10 }}>your home tenant</div>
                    </div>
                  </div>
                </button>
              )}

              {filtered.map((t) => {
                const active = t.id === ctx.tenantId;
                return (
                  <button
                    key={t.id}
                    onClick={() => active ? null : switchTo(t.id)}
                    disabled={pending || active}
                    style={rowBtn(colors, active)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: t.isDemoTenant ? "#F97316" : colors.teal,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: colors.text, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.name}
                        </div>
                        <div style={{ color: colors.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>{t.slug}</div>
                      </div>
                      {t.isDemoTenant && (
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: "#F9731620", color: "#F97316", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em" }}>
                          DEMO
                        </span>
                      )}
                      {active && (
                        <span style={{ color: colors.teal, fontSize: 12 }}>✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: 16, color: colors.textDim, fontSize: 11, textAlign: "center" }}>
                  No tenants match &ldquo;{filter}&rdquo;
                </div>
              )}
            </div>

            <div style={{ padding: "8px 12px", borderTop: `1px solid ${colors.panelBorder}`, background: colors.bgL }}>
              <a
                href="/admin/tenants"
                style={{ color: colors.tealLight, fontSize: 11, textDecoration: "none", fontFamily: "Figtree, sans-serif" }}
              >
                Manage tenants →
              </a>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/**
 * Avatar pill on the Topbar that exposes the user's identity and a clear
 * Sign Out action. Built with a POST form because `/auth/signout` is a POST
 * route — using a button-inside-form avoids needing a fetch wrapper.
 */
function UserMenu({ ctx, colors }: { ctx: TenantContext; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const displayName = ctx.userFullName?.trim() || ctx.userEmail;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Signed in as ${displayName}`}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px 6px 6px",
          borderRadius: 999,
          background: colors.panel,
          border: `1px solid ${colors.panelBorder}`,
          color: colors.text,
          fontSize: 12, fontWeight: 600,
          fontFamily: "Figtree, sans-serif",
          cursor: "pointer",
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
          color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, letterSpacing: "0.02em", flexShrink: 0,
        }}>{initialsOf(ctx.userFullName, ctx.userEmail)}</span>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
        <span style={{ color: colors.textMuted, fontSize: 11 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            minWidth: 280, maxWidth: 360,
            background: colors.panel, border: `1px solid ${colors.panelBorder}`,
            borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            overflow: "hidden", zIndex: 50,
          }}
        >
          {/* Identity block */}
          <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${colors.panelBorder}`, background: colors.bgL }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`,
                color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>{initialsOf(ctx.userFullName, ctx.userEmail)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: colors.text, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <div style={{ color: colors.textMuted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ctx.userEmail}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4,
                    background: colors.teal + "1F", color: colors.teal,
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                  }}>{roleLabel(ctx.userAppRole)}</span>
                  {ctx.userCompany && (
                    <span style={{
                      padding: "2px 7px", borderRadius: 4,
                      background: colors.panelBorder, color: colors.textMuted,
                      fontSize: 9, fontWeight: 600,
                    }}>{ctx.userCompany}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: 4 }}>
            <a
              href="/app/account"
              onClick={() => setOpen(false)}
              style={menuItemStyle(colors)}
            >
              <span>⚙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Account settings</div>
                <div style={{ fontSize: 10, color: colors.textDim }}>Profile, company, password</div>
              </div>
            </a>
            <a
              href="/app/trust"
              onClick={() => setOpen(false)}
              style={menuItemStyle(colors)}
            >
              <span>🛡️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Security & Trust</div>
                <div style={{ fontSize: 10, color: colors.textDim }}>Sub-processors, encryption, compliance</div>
              </div>
            </a>
          </div>

          {/* Sign Out — POST form so it works without JS too */}
          <form action="/auth/signout" method="post" style={{ margin: 0, padding: 4, borderTop: `1px solid ${colors.panelBorder}` }}>
            <button
              type="submit"
              style={{
                ...menuItemStyle(colors),
                color: colors.red,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.red + "1A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span>→</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>Sign out</div>
                <div style={{ fontSize: 10, color: colors.textDim }}>End your session and return to /login</div>
              </div>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function menuItemStyle(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 6,
    color: colors.text, textDecoration: "none",
    fontFamily: "Figtree, sans-serif",
    cursor: "pointer",
  };
}

function rowBtn(colors: ReturnType<typeof useColors>, active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px 12px",
    background: active ? colors.teal + "15" : "transparent",
    border: 0,
    borderBottom: `1px solid ${colors.panelBorder}`,
    color: colors.text,
    cursor: active ? "default" : "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  };
}
