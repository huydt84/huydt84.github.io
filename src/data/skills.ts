import { getLocaleContent, type SkillGroup } from "./i18n";

export type { SkillGroup };

export const skills: SkillGroup[] = getLocaleContent("en").skills;
