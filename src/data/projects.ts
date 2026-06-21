export interface Project {
  name: string;
  description: string;
  tags: string[];
}

import { getLocaleContent } from "./i18n";

export const projects: Project[] = getLocaleContent("en").technicalWork;
