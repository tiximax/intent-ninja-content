export function countWordsFromHtml(html: string): number {
  try {
    const text = html.replace(/<[^>]+>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean);
    return words.length;
  } catch {
    return 0;
  }
}

export function mergeHtmlSections(baseHtml: string, extraHtml: string, sectionTitle: string): string {
  try {
    // Remove any H1 in extra to avoid duplicate main titles
    const cleaned = extraHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
    const wrapped = `<section><h2>${sectionTitle}</h2>${cleaned}</section>`;
    return `${baseHtml}\n${wrapped}`;
  } catch {
    return `${baseHtml}\n${extraHtml}`;
  }
}
