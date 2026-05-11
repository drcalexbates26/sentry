"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { Badge, Button, Card } from "@/components/ui";
import { markdownToHtml } from "@/lib/markdown";
import sanitizeHtml from "sanitize-html";

interface PolicyEditorProps {
  /** Initial markdown content for this version. */
  initialContent: string;
  /** Read-only mode disables editing (used for in_review and published views). */
  readOnly?: boolean;
  /** Optional changelog note shown beneath the toolbar. */
  changesSummary?: string | null;
  /** Header band — version label etc. */
  headerLeft?: React.ReactNode;
  /** Action buttons rendered in the toolbar right side. */
  actions?: React.ReactNode;
  /** Called with the latest content on every keystroke (debounced upstream). */
  onChange?: (content: string) => void;
  /** Called when the user clicks Save (only in editable mode). */
  onSave?: (content: string, changesSummary: string) => Promise<void> | void;
  saving?: boolean;
}

export function PolicyEditor({
  initialContent, readOnly, changesSummary, headerLeft, actions, onChange, onSave, saving,
}: PolicyEditorProps) {
  const colors = useColors();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState(changesSummary ?? "");
  const [dirty, setDirty] = useState(false);

  // Reset when the underlying version changes (e.g. user switched policies).
  useEffect(() => {
    setContent(initialContent);
    setSummary(changesSummary ?? "");
    setDirty(false);
  }, [initialContent, changesSummary]);

  const html = useMemo(
    () => sanitizeHtml(markdownToHtml(content), {
      allowedTags: ["h1","h2","h3","h4","h5","h6","p","strong","em","code","pre","ul","ol","li","blockquote","hr","table","thead","tbody","tr","th","td","a","br"],
      allowedAttributes: { a: ["href", "target", "rel"] },
      allowedSchemes: ["http", "https", "mailto"],
    }),
    [content],
  );

  const update = (v: string) => {
    setContent(v);
    setDirty(true);
    onChange?.(v);
  };

  /** Wrap the current textarea selection with given markers, or insert at cursor. */
  const wrap = useCallback((before: string, after = before, placeholder = "text") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end) || placeholder;
    const next = content.substring(0, start) + before + selected + after + content.substring(end);
    update(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorStart = start + before.length;
      ta.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  }, [content]);

  /** Insert a line-prefix on the current line (or each selected line). */
  const linePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    // Find the start of the current line
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const before = content.substring(0, lineStart);
    const region = content.substring(lineStart, end);
    const prefixed = region.replace(/^/gm, prefix);
    const next = before + prefixed + content.substring(end);
    update(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefixed.length - region.length);
    });
  }, [content]);

  const insert = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const next = content.substring(0, start) + text + content.substring(start);
    update(next);
    requestAnimationFrame(() => {
      ta.focus();
      const after = start + text.length;
      ta.setSelectionRange(after, after);
    });
  }, [content]);

  const tools = [
    { label: "B", title: "Bold (Ctrl+B)", onClick: () => wrap("**", "**", "bold text") },
    { label: "I", title: "Italic (Ctrl+I)", onClick: () => wrap("*", "*", "italic text") },
    { label: "H1", title: "Heading 1", onClick: () => linePrefix("# ") },
    { label: "H2", title: "Heading 2", onClick: () => linePrefix("## ") },
    { label: "H3", title: "Heading 3", onClick: () => linePrefix("### ") },
    { label: "•", title: "Bulleted list", onClick: () => linePrefix("- ") },
    { label: "1.", title: "Numbered list", onClick: () => linePrefix("1. ") },
    { label: "❝", title: "Blockquote", onClick: () => linePrefix("> ") },
    { label: "</>", title: "Inline code", onClick: () => wrap("`", "`", "code") },
    { label: "🔗", title: "Link", onClick: () => wrap("[", "](https://)", "link text") },
    { label: "—", title: "Horizontal rule", onClick: () => insert("\n\n---\n\n") },
    { label: "▦", title: "Table (3×2)", onClick: () => insert("\n\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| cell | cell | cell |\n| cell | cell | cell |\n") },
  ];

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); wrap("**", "**", "bold text"); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") { e.preventDefault(); wrap("*", "*", "italic text"); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void onSave?.(content, summary); setDirty(false); }
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${colors.panelBorder}`,
        background: colors.obsidianM, gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{headerLeft}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
        </div>
      </div>

      {/* Toolbar (hidden in read-only) */}
      {!readOnly && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 3,
          padding: "6px 10px", borderBottom: `1px solid ${colors.panelBorder}`,
          background: colors.panel,
        }}>
          {tools.map((t) => (
            <button
              key={t.label}
              onClick={t.onClick}
              title={t.title}
              type="button"
              style={{
                padding: "5px 9px", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                background: colors.obsidianM, color: colors.text,
                border: `1px solid ${colors.panelBorder}`, borderRadius: 5, cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.teal + "22"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = colors.obsidianM; }}
            >{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {onSave && (
            <Button size="sm" disabled={saving || !dirty} onClick={() => { void onSave(content, summary); setDirty(false); }}>
              {saving ? "Saving…" : dirty ? "Save Draft" : "Saved"}
            </Button>
          )}
        </div>
      )}

      {/* Editor + Preview */}
      <div style={{ display: "grid", gridTemplateColumns: readOnly ? "1fr" : "1fr 1fr", minHeight: 480 }}>
        {!readOnly && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => update(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            style={{
              width: "100%", height: "100%", minHeight: 480,
              padding: 16, border: "none", outline: "none",
              background: colors.panel, color: colors.text,
              fontSize: 12, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              lineHeight: 1.55, resize: "vertical", boxSizing: "border-box",
              borderRight: `1px solid ${colors.panelBorder}`,
            }}
          />
        )}
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            padding: 24,
            background: colors.panel,
            color: colors.text,
            fontSize: 13, lineHeight: 1.65,
            overflowY: "auto", maxHeight: 720,
          }}
          className="sentry-policy-preview"
        />
      </div>

      {/* Changelog */}
      {!readOnly && (
        <div style={{ padding: "8px 14px", borderTop: `1px solid ${colors.panelBorder}`, background: colors.obsidianM }}>
          <label style={{ display: "block", fontSize: 9, color: colors.textDim, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>
            Change summary (visible in Revision History)
          </label>
          <input
            value={summary}
            onChange={(e) => { setSummary(e.target.value); setDirty(true); }}
            placeholder="e.g. Tightened section 4.2 to specify FIDO2 for privileged accounts."
            style={{
              width: "100%", padding: "6px 10px", fontSize: 11,
              background: colors.panel, border: `1px solid ${colors.panelBorder}`,
              borderRadius: 5, color: colors.text, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <style>{`
        .sentry-policy-preview h1 { font-size: 22px; font-weight: 800; margin: 0 0 14px; line-height: 1.2; letter-spacing: -0.01em; }
        .sentry-policy-preview h2 { font-size: 17px; font-weight: 700; margin: 22px 0 10px; }
        .sentry-policy-preview h3 { font-size: 14px; font-weight: 700; margin: 18px 0 8px; }
        .sentry-policy-preview h4, .sentry-policy-preview h5, .sentry-policy-preview h6 { font-size: 13px; font-weight: 700; margin: 14px 0 6px; }
        .sentry-policy-preview p { margin: 0 0 12px; }
        .sentry-policy-preview strong { font-weight: 700; color: ${colors.white}; }
        .sentry-policy-preview em { font-style: italic; }
        .sentry-policy-preview ul, .sentry-policy-preview ol { margin: 0 0 12px 22px; padding: 0; }
        .sentry-policy-preview li { margin: 2px 0; }
        .sentry-policy-preview blockquote { border-left: 3px solid ${colors.teal}; padding: 6px 12px; margin: 12px 0; color: ${colors.textMuted}; background: ${colors.obsidianM}; border-radius: 4px; }
        .sentry-policy-preview hr { border: none; border-top: 1px solid ${colors.panelBorder}; margin: 18px 0; }
        .sentry-policy-preview code { background: ${colors.obsidianM}; padding: 1px 5px; border-radius: 3px; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; }
        .sentry-policy-preview pre { background: ${colors.obsidianM}; padding: 12px; border-radius: 6px; overflow-x: auto; }
        .sentry-policy-preview pre code { background: transparent; padding: 0; font-size: 11px; }
        .sentry-policy-preview a { color: ${colors.teal}; }
        .sentry-policy-preview table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12px; }
        .sentry-policy-preview th, .sentry-policy-preview td { border: 1px solid ${colors.panelBorder}; padding: 6px 10px; text-align: left; vertical-align: top; }
        .sentry-policy-preview th { background: ${colors.obsidianM}; font-weight: 700; color: ${colors.white}; }
      `}</style>
    </Card>
  );
}
