"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/store";
import { darkColors, lightColors } from "@/lib/theme";
import { loadTenantState, saveTenantState } from "@/app/app/_actions";

// Slices that get persisted. UI prefs (page, sidebarOpen) and transient
// data (threatIntelItems, threatIntelLoading) are intentionally excluded.
const PERSISTED_KEYS = [
  "onboardDone", "org", "tech", "comp",
  "team",
  "assessments",
  "irData",
  "activeIncident", "incidentLog",
  "tickets", "tasks", "cases",
  "stakeholders",
  "forensicLogs", "lessons",
  "tabletopExercises", "penTestRequests",
  "notificationLog",
  "policiesGen",
  "metrics",
  "themeMode",
] as const;

function pickSlice(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of PERSISTED_KEYS) {
    if (k in state) out[k] = state[k as string];
  }
  return out;
}

const DEBOUNCE_MS = 1500;

export function TenantStateProvider({
  tenantContext,
  children,
}: {
  tenantContext: { tenantId: string; tenantName: string; isDemoTenant: boolean };
  children: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSerializedRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Hydrate on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadTenantState();
        if (cancelled) return;
        if (data) {
          // Merge into store. Functions stay; persisted fields overwrite defaults.
          useStore.setState(data as Partial<ReturnType<typeof useStore.getState>>);
        }
        // Capture initial slice so we don't immediately save on hydration
        lastSerializedRef.current = JSON.stringify(pickSlice(useStore.getState() as unknown as Record<string, unknown>));
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? "Failed to load");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantContext.tenantId]);

  // Subscribe + debounce-save on changes
  useEffect(() => {
    if (!hydrated) return;
    const unsub = useStore.subscribe((state) => {
      const slice = pickSlice(state as unknown as Record<string, unknown>);
      const serialized = JSON.stringify(slice);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSavingState("saving");
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveTenantState(slice);
          setSavingState("saved");
          setTimeout(() => setSavingState((s) => (s === "saved" ? "idle" : s)), 1800);
        } catch {
          setSavingState("error");
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hydrated]);

  // Pull themeMode straight from the store — the ThemeContext provider lives
  // inside Shell, so we can't use useColors() up here at the loading screen.
  const themeMode = useStore((s) => s.themeMode);
  const palette = themeMode === "light" ? lightColors : darkColors;

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", color: palette.textMuted, fontFamily: "Source Sans 3, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${palette.teal}33`, borderTopColor: palette.teal, margin: "0 auto", animation: "tenant-spin 0.9s linear infinite" }} />
          <div style={{ marginTop: 14, fontSize: 13, color: palette.text }}>Loading {tenantContext.tenantName}…</div>
          {error && <div style={{ color: palette.red, marginTop: 10, fontSize: 12 }}>{error}</div>}
        </div>
        <style>{`@keyframes tenant-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {tenantContext.isDemoTenant && <DemoBanner tenantName={tenantContext.tenantName} />}
      <SaveIndicator state={savingState} />
      {children}
    </>
  );
}

function DemoBanner({ tenantName }: { tenantName: string }) {
  return (
    <div
      style={{
        padding: "8px 18px",
        background: "linear-gradient(90deg, rgba(247, 144, 9, 0.18), rgba(247, 144, 9, 0.06))",
        borderBottom: "1px solid rgba(247, 144, 9, 0.32)",
        color: "#FCD34D",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textAlign: "center",
        fontFamily: "Figtree, sans-serif",
      }}
    >
      DEMO ENVIRONMENT · {tenantName.toUpperCase()} · Changes here do not affect production tenants.
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const themeMode = useStore((s) => s.themeMode);
  const palette = themeMode === "light" ? lightColors : darkColors;
  if (state === "idle") return null;
  const { color, label } =
    state === "saving" ? { color: palette.textMuted, label: "Saving…" } :
    state === "saved" ? { color: palette.green, label: "✓ Saved" } :
    { color: palette.red, label: "Save failed" };
  const surfaceBg = themeMode === "light" ? "rgba(255,255,255,0.96)" : "rgba(15, 22, 35, 0.92)";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        right: 18,
        zIndex: 200,
        padding: "6px 12px",
        borderRadius: 6,
        background: surfaceBg,
        border: `1px solid ${color}55`,
        color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        fontFamily: "JetBrains Mono, monospace",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {label.toUpperCase()}
    </div>
  );
}
