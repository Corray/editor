import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
});

/**
 * Markdown → safe HTML.
 *
 * Pipeline: markdown-it (html:false) → DOMPurify.sanitize
 * Double-defense per ADR-001 / ADR-002 / consensus §4.2.
 */
export function render(markdown: string): string {
  if (markdown === '') return '';
  const raw = md.render(markdown);
  return DOMPurify.sanitize(raw);
}
