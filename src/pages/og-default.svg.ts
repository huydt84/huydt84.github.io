import { site } from "../data/site";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <rect x="60" y="60" width="1080" height="4" rx="2" fill="url(#accent)"/>

  <text x="60" y="200" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="700" fill="#ffffff">
    ${escapeXml(site.author)}
  </text>

  <text x="60" y="270" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="#a1a1aa">
    ${escapeXml(site.title)}
  </text>

  <text x="60" y="340" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#6366f1">
    LLM Inference &middot; Production AI &middot; Open Source
  </text>

  <rect x="60" y="540" width="40" height="40" rx="8" fill="url(#accent)" opacity="0.3"/>
  <rect x="110" y="548" width="100" height="24" rx="4" fill="#27272a"/>
</svg>`;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
