export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

import { getLocaleContent } from "./i18n";

export const socials: SocialLink[] = getLocaleContent("en").socials;
