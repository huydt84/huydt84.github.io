import { renderLocaleRss } from "../lib/rss";

export async function GET() {
  return renderLocaleRss("en");
}
