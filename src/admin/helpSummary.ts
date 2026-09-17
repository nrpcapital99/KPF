import {
  HELP_CATEGORIES,
  HELP_OPTION_CATEGORY,
  LEGACY_INTEREST_LABEL,
} from "../config";
import type { Volunteer } from "../types";

export interface HelpGroupSummary {
  categoryId: string;
  label: string;
  options: string[];
  specifics: string | null;
}

/**
 * Groups a response's chosen options under their categories, in the same
 * order as the form, with any "What can you specifically help with?" text.
 */
export function summariseHelp(row: Volunteer): HelpGroupSummary[] {
  return HELP_CATEGORIES.map((category) => ({
    categoryId: category.id,
    label: category.label,
    options: category.options
      .filter((option) => row.helpWith.includes(option.id))
      .map((option) => option.label),
    specifics: category.specifics ? row[category.specifics.field] : null,
  })).filter((group) => group.options.length > 0 || group.specifics);
}

/** Labels for responses collected with the first version of the form. */
export const legacyLabels = (row: Volunteer) =>
  row.legacyInterests.map((id) => LEGACY_INTEREST_LABEL[id] ?? id);

/** Category ids a response touches — used by the team page filter. */
export function categoriesOf(row: Volunteer): Set<string> {
  const ids = new Set(row.helpWith.map((id) => HELP_OPTION_CATEGORY[id]).filter(Boolean));
  if (row.digitalSpecifics) ids.add("digital");
  if (row.techSpecifics) ids.add("technology");
  return ids;
}
