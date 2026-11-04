const BLOCK_TAG = /<\/?(?:h[1-6]|ul|ol|li|div|p|figure|blockquote|hr|table|iframe|video|article|section|form)\b/i;
const INLINE_TAGS = ['strong', 'em', 'span', 'a', 'b', 'i', 'u'];

export type ParagraphClass = (inner: string, text: string) => string;

/**
 * Wraps blank-line separated text in paragraphs, as WordPress did when it rendered these pages.
 * The words stay unchanged. If a blank line falls inside an inline element, the page is returned as it was.
 */
export function toParagraphs(html: string, classFor?: ParagraphClass): string {
  const blocks = html
    .replace(/\r\n/g, '\n')
    .replace(/(<\/(?:h[1-6]|ul|ol|div|table|blockquote|figure|article)>)\n+/gi, '$1\n\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const output: string[] = [];
  for (const block of blocks) {
    if (BLOCK_TAG.test(block)) {
      output.push(block);
      continue;
    }
    if (!inlineTagsBalance(block)) return html;
    const text = block.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text && !/<img\b/i.test(block)) continue;
    const className = classFor ? classFor(block, text) : '';
    output.push(className ? `<p class="${className}">${block}</p>` : `<p>${block}</p>`);
  }
  return output.join('\n');
}

function inlineTagsBalance(block: string): boolean {
  return INLINE_TAGS.every((tag) => {
    const opens = block.match(new RegExp(`<${tag}\\b`, 'gi'))?.length ?? 0;
    const closes = block.match(new RegExp(`</${tag}>`, 'gi'))?.length ?? 0;
    return opens === closes;
  });
}
