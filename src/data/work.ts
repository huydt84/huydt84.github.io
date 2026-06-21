export interface WorkItem {
  name: string;
  description: string;
  tags: string[];
}

import { getLocaleContent } from "./i18n";

export const selectedWork: WorkItem[] = getLocaleContent("en").selectedWork;
