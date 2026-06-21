import { site } from "@/data/site";
import { getLocaleContent } from "@/data/i18n";
import type { Locale } from "./locale";
import { getBlogSlug, getLocalizedBlogPosts } from "./blog";

export async function renderLocaleRss(locale: Locale): Promise<Response> {
  const copy = getLocaleContent(locale);
  const posts = await getLocalizedBlogPosts(locale);
  const blogPath = locale === "en" ? "/blog" : `/${locale}/blog`;
  const feedPath = locale === "en" ? "/rss.xml" : `/${locale}/rss.xml`;

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.data.title}]]></title>
      <description><![CDATA[${post.data.description}]]></description>
      <link>${site.url}${blogPath}/${getBlogSlug(post)}</link>
      <guid>${site.url}${blogPath}/${getBlogSlug(post)}</guid>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      ${post.data.tags.map((tag) => `<category>${tag}</category>`).join("\n      ")}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${copy.meta.siteTitle}</title>
    <description>${copy.meta.siteDescription}</description>
    <link>${site.url}${blogPath}</link>
    <atom:link href="${site.url}${feedPath}" rel="self" type="application/rss+xml"/>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
