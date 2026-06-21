import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "./locale";

export async function getLocalizedBlogPosts(locale: Locale): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft && data.locale === locale);

  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getBlogSlug(post: CollectionEntry<"blog">): string {
  return post.id.replace(/^(en|vi|ja)\//, "").replace(/-(en|vi|ja)$/, "");
}
