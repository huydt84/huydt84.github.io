export interface WorkItem {
  name: string;
  description: string;
}

import { getLocaleContent } from "./i18n";

export const selectedWork: WorkItem[] = getLocaleContent("en").selectedWork;
