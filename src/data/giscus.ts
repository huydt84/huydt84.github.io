/// Giscus comment system configuration.
///
/// Configured via:
/// 1. GitHub Discussions enabled on repo (API PATCH has_discussions=true)
/// 2. repoId obtained from GitHub REST API (GET /repos/:owner/:name → node_id)
/// 3. categoryId obtained from GitHub GraphQL API (discussionCategories query)
///
/// To change the comment category, update `category` and `categoryId` below.

export interface GiscusConfig {
  /** GitHub repo in "owner/name" format */
  repo: string;
  /** Numeric repo ID from giscus.app */
  repoId: string;
  /** Discussion category name */
  category: string;
  /** Numeric category ID from giscus.app */
  categoryId: string;
  /** Mapping strategy (default: pathname) */
  mapping: "pathname" | "url" | "title" | "og:title";
  /** Strict matching (default: 0 = off) */
  strict: "0" | "1";
  /** Enable reactions (default: 1 = on) */
  reactionsEnabled: "1" | "0";
  /** Emit comment metadata (default: 0 = off) */
  emitMetadata: "0" | "1";
  /** Input position (default: bottom) */
  inputPosition: "bottom" | "top";
  /** Giscus theme (default: preferred_color_scheme) */
  theme: string;
  /** Language (default: en) */
  lang: string;
}

export const giscusConfig: GiscusConfig = {
  repo: "huydt84/huydt84.github.io",
  repoId: "R_kgDOO9fMcA",
  category: "Announcements",
  categoryId: "DIC_kwDOO9fMcM4C_mjK",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  theme: "preferred_color_scheme",
  lang: "en",
};

/** Returns true when the Giscus IDs are configured (not TODO placeholders) */
export function isGiscusConfigured(config: GiscusConfig): boolean {
  return (
    config.repoId !== "" &&
    !config.repoId.startsWith("TODO") &&
    config.categoryId !== "" &&
    !config.categoryId.startsWith("TODO")
  );
}
