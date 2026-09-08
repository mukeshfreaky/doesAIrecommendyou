import { CrawledPage } from "@/types";

/**
 * Extracts structured metadata and clean visible text from raw HTML.
 */
export function parseHtml(url: string, html: string): CrawledPage {
  // 1. Extract Title
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = cleanHtmlEntities(titleMatch[1].trim());
  }
  if (!title) {
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (ogTitleMatch) title = cleanHtmlEntities(ogTitleMatch[1].trim());
  }

  // 2. Extract Meta Description
  let description = "";
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (descMatch) {
    description = cleanHtmlEntities(descMatch[1].trim());
  } else {
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDescMatch) description = cleanHtmlEntities(ogDescMatch[1].trim());
  }

  // 3. Extract Headings (h1, h2, h3)
  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const cleanHeading = stripTags(hMatch[1]).trim();
    if (cleanHeading && cleanHeading.length > 2 && cleanHeading.length < 150) {
      headings.push(cleanHeading);
    }
    if (headings.length >= 25) break; // Bounded count
  }

  // 4. Extract same-origin internal links
  const links: string[] = [];
  try {
    const parsedBase = new URL(url);
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    let lMatch: RegExpExecArray | null;
    const seenLinks = new Set<string>();

    while ((lMatch = linkRegex.exec(html)) !== null) {
      const rawHref = lMatch[1].trim();
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:")) {
        continue;
      }
      try {
        const resolved = new URL(rawHref, parsedBase.origin);
        // Same-origin only
        if (resolved.origin === parsedBase.origin && resolved.pathname !== parsedBase.pathname) {
          const cleanHref = resolved.origin + resolved.pathname.replace(/\/$/, "");
          if (!seenLinks.has(cleanHref)) {
            seenLinks.add(cleanHref);
            links.push(cleanHref);
          }
        }
      } catch {
        // Ignore unparseable hrefs
      }
      if (links.length >= 50) break;
    }
  } catch {
    // If base URL parsing fails
  }

  // 5. Clean and isolate visible body text
  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  }

  // Strip noise: scripts, styles, svg, nav, footer, header, forms
  bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  bodyContent = bodyContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  bodyContent = bodyContent.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");
  bodyContent = bodyContent.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");
  bodyContent = bodyContent.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");
  bodyContent = bodyContent.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");
  bodyContent = bodyContent.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ");

  const rawText = stripTags(bodyContent);
  // Normalize whitespace and limit length to 10,000 characters per page
  const cleanText = rawText.replace(/\s+/g, " ").trim().slice(0, 10_000);

  return {
    url,
    title,
    description,
    headings,
    text: cleanText,
    links,
    fetchedAt: new Date().toISOString(),
  };
}

function stripTags(htmlSnippet: string): string {
  return cleanHtmlEntities(htmlSnippet.replace(/<[^>]+>/g, " "));
}

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
