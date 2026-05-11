/**
 * Minimal markdown → HTML renderer scoped to the subset used by Sentry's
 * policy generator: headings, bold/italic/inline-code, GFM tables, ordered
 * and unordered lists, horizontal rules, blockquotes, links, fenced code.
 *
 * Output is sanitized by sanitize-html at the render boundary; this function
 * intentionally only emits a fixed set of HTML constructs.
 */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

function renderInline(s: string): string {
  // Escape first, then apply inline transforms on the escaped string.
  let out = escapeHtml(s);
  // Inline code — wrap with <code>; protects content from further substitution.
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  // Links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = /^(https?:|mailto:|\/)/.test(url) ? url : "#";
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  // Bold **x** before italic *x* (so ** isn't eaten by *).
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<![*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "<em>$1</em>");
  return out;
}

/** Render a GFM-style table from a contiguous block of `| ... |` lines. */
function renderTable(lines: string[]): string {
  if (lines.length < 2) return lines.map((l) => `<p>${renderInline(l)}</p>`).join("");
  const splitRow = (l: string) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const header = splitRow(lines[0]);
  const body = lines.slice(2).map(splitRow);
  const head = "<tr>" + header.map((h) => `<th>${renderInline(h)}</th>`).join("") + "</tr>";
  const rows = body.map((row) => "<tr>" + row.map((c) => `<td>${renderInline(c)}</td>`).join("") + "</tr>").join("");
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      i++; // closing ```
      out.push(`<pre><code>${code.map(escapeHtml).join("\n")}</code></pre>`);
      continue;
    }

    // Headings (# .. ######)
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // Blockquote (single or multi-line)
    if (line.startsWith("> ")) {
      const block: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { block.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote>${renderInline(block.join(" "))}</blockquote>`);
      continue;
    }

    // GFM table — header row + separator row + body
    if (line.startsWith("|") && lines[i + 1] && /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim())) {
      const block: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) { block.push(lines[i]); i++; }
      out.push(renderTable(block));
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blank line — paragraph separator
    if (line.trim() === "") { i++; continue; }

    // Paragraph: collect contiguous non-empty, non-block-starter lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|---|>\s|\||```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) out.push(`<p>${renderInline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}
