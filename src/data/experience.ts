export interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  highlights: string[];
}

import { getLocaleContent } from "./i18n";

export const experiences: Experience[] = getLocaleContent("en").experiences;
