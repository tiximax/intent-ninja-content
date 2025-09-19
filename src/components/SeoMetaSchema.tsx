import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Info } from "lucide-react";

interface SeoMetaSchemaProps {
  title: string;
  metaDescription: string;
  contentHtml: string;
}

function clamp(str: string, max: number) {
  if (!str) return "";
  const s = str.trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function extractHeadings(html: string): string[] {
  try {
    const matches = Array.from(html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi));
    return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 10);
  } catch {
    return [];
  }
}

function buildJsonLdArticle(title: string, description: string, contentHtml: string) {
  const headings = extractHeadings(contentHtml);
  const data: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: clamp(title, 110),
    description: clamp(description, 160),
    datePublished: new Date().toISOString(),
    inLanguage: "vi",
    articleSection: headings,
  };
  return data;
}

function buildJsonLdFaq(contentHtml: string) {
  try {
    // very simple Q/A extraction: <p><strong>n.</strong> question</p><p>answer</p>
    const qa: { q: string; a: string }[] = [];
    const blocks = contentHtml.split(/<h2[^>]*>\s*FAQ\s*<\/h2>/i);
    if (blocks.length < 2) return null;
    const faqPart = blocks[1];
    const qMatches = Array.from(faqPart.matchAll(/<p>\s*<strong>\d+\.?<\/strong>\s*([^<]+)<\/p>\s*<p>(.*?)<\/p>/gi));
    for (const m of qMatches) {
      const q = (m[1] || '').replace(/<[^>]+>/g, '').trim();
      const a = (m[2] || '').replace(/<[^>]+>/g, '').trim();
      if (q && a) qa.push({ q, a });
    }
    if (qa.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: qa.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    };
  } catch {
    return null;
  }
}

export function generateJsonLd(title: string, description: string, contentHtml: string) {
  const article = buildJsonLdArticle(title, description, contentHtml);
  const faq = buildJsonLdFaq(contentHtml);
  if (faq) return JSON.stringify([article, faq], null, 2);
  return JSON.stringify(article, null, 2);
}

export default function SeoMetaSchema({ title, metaDescription, contentHtml }: SeoMetaSchemaProps) {
  const { toast } = useToast();
  const seoTitle = useMemo(() => clamp(title, 60), [title]);
  const seoDesc = useMemo(() => clamp(metaDescription, 160), [metaDescription]);
  const jsonLd = useMemo(() => generateJsonLd(seoTitle, seoDesc, contentHtml), [seoTitle, seoDesc, contentHtml]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép", description: "Nội dung đã được copy vào clipboard." });
  };

  const metaSnippet = `<title>${seoTitle}</title>\n<meta name=\"description\" content=\"${seoDesc}\">\n<meta property=\"og:title\" content=\"${seoTitle}\">\n<meta property=\"og:description\" content=\"${seoDesc}\">\n<meta name=\"twitter:card\" content=\"summary_large_image\">\n<meta name=\"twitter:title\" content=\"${seoTitle}\">\n<meta name=\"twitter:description\" content=\"${seoDesc}\">`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" /> SEO Meta & Schema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-testid="seo-meta-schema">
        <div>
          <div className="text-sm font-medium">Meta Title ({seoTitle.length}/60)</div>
          <div className="text-sm text-muted-foreground mt-1">{seoTitle}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Meta Description ({seoDesc.length}/160)</div>
          <div className="text-sm text-muted-foreground mt-1">{seoDesc}</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Meta tags snippet</div>
            <Button variant="outline" size="sm" onClick={() => copy(metaSnippet)} data-testid="copy-meta-snippet"><Copy className="w-4 h-4" />Copy</Button>
          </div>
          <Textarea value={metaSnippet} readOnly rows={5} className="font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">JSON-LD</div>
            <Button variant="outline" size="sm" onClick={() => copy(jsonLd)} data-testid="copy-jsonld"><Copy className="w-4 h-4" />Copy</Button>
          </div>
          <Textarea value={jsonLd} readOnly rows={8} className="font-mono text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}