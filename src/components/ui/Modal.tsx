"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { colors } from "@/lib/tokens";

// ─── Types ──────────────────────────────────────────────────────────
interface ModalField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select" | "number";
  options?: string[];
  defaultValue?: string;
  required?: boolean;
}

interface ModalConfig {
  title: string;
  message?: string;
  type: "alert" | "confirm" | "prompt";
  fields?: ModalField[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

type ModalResolver = (result: Record<string, string> | boolean | null) => void;

interface ModalContextType {
  showAlert: (title: string, message?: string) => Promise<void>;
  showConfirm: (title: string, message?: string, variant?: "default" | "danger") => Promise<boolean>;
  showPrompt: (title: string, fields: ModalField[], message?: string) => Promise<Record<string, string> | null>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be inside ModalProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ModalConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const resolverRef = useRef<ModalResolver | null>(null);
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (config && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [config]);

  const close = useCallback((result: Record<string, string> | boolean | null) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setConfig(null);
    setValues({});
  }, []);

  const showAlert = useCallback((title: string, message?: string): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = () => resolve();
      setConfig({ title, message, type: "alert", confirmLabel: "OK" });
    });
  }, []);

  const showConfirm = useCallback((title: string, message?: string, variant?: "default" | "danger"): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = (r) => resolve(r === true);
      setConfig({ title, message, type: "confirm", variant: variant || "default" });
    });
  }, []);

  const showPrompt = useCallback((title: string, fields: ModalField[], message?: string): Promise<Record<string, string> | null> => {
    return new Promise((resolve) => {
      resolverRef.current = (r) => resolve(r && typeof r === "object" ? r as Record<string, string> : null);
      const defaults: Record<string, string> = {};
      fields.forEach((f) => { defaults[f.key] = f.defaultValue || ""; });
      setValues(defaults);
      setConfig({ title, message, type: "prompt", fields });
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (config?.type === "alert") { close(true); return; }
    if (config?.type === "confirm") { close(true); return; }
    if (config?.type === "prompt") {
      const required = config.fields?.filter((f) => f.required) || [];
      const missing = required.some((f) => !values[f.key]?.trim());
      if (missing) return;
      close({ ...values });
    }
  }, [config, values, close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && config?.type !== "prompt") handleSubmit();
    if (e.key === "Enter" && config?.type === "prompt" && !config.fields?.some((f) => f.type === "textarea")) handleSubmit();
    if (e.key === "Escape") close(config?.type === "confirm" ? false : null);
  }, [config, handleSubmit, close]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {config && (
        <div
          onKeyDown={handleKeyDown}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) close(config.type === "confirm" ? false : null); }}
        >
          <div style={{
            background: colors.panel, border: `1px solid ${colors.panelBorder}`,
            borderRadius: 10, padding: "20px 24px", width: "100%", maxWidth: 460,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            {/* Title */}
            <h3 style={{ color: colors.white, margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>{config.title}</h3>
            {config.message && <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 14px", lineHeight: 1.5 }}>{config.message}</p>}

            {/* Fields */}
            {config.type === "prompt" && config.fields?.map((field, idx) => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 10, color: colors.textMuted, marginBottom: 3, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {field.label}{field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    ref={idx === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{ width: "100%", padding: "7px 11px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 6, color: colors.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                  />
                ) : field.type === "select" ? (
                  <select
                    ref={idx === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    style={{ width: "100%", padding: "7px 11px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 6, color: colors.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    ref={idx === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                    type={field.type || "text"}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: "100%", padding: "7px 11px", background: colors.obsidianM, border: `1px solid ${colors.panelBorder}`, borderRadius: 6, color: colors.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                )}
              </div>
            ))}

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              {config.type !== "alert" && (
                <button onClick={() => close(config.type === "confirm" ? false : null)} style={{
                  padding: "7px 16px", borderRadius: 7, border: `1px solid ${colors.panelBorder}`,
                  background: colors.panelLight, color: colors.text, fontSize: 12,
                  fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                }}>
                  {config.cancelLabel || "Cancel"}
                </button>
              )}
              <button onClick={handleSubmit} style={{
                padding: "7px 16px", borderRadius: 7, border: "none",
                background: config.variant === "danger" ? colors.red : colors.teal,
                color: config.variant === "danger" ? "#fff" : colors.obsidian,
                fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
              }}>
                {config.confirmLabel || (config.type === "alert" ? "OK" : config.type === "confirm" ? "Confirm" : "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
