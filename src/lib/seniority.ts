export type SeniorityComparison = "same-or-lower" | "more-senior";

/**
 * Maps seniority keywords/prefixes to numeric levels.
 * 0 = intern, 9 = C-level executive.
 */
const SENIORITY_LEVELS: [RegExp, number][] = [
  // C-level (9)
  [/\b(ceo|cto|cfo|coo|cmo|cio|cpo|chief)\b/, 9],
  // SVP (8)
  [/\b(svp|senior vice president|executive vice president|evp)\b/, 8],
  // VP (7)
  [/\b(vp|vice president)\b/, 7],
  // Director (6)
  [/\bdirector\b/, 6],
  // Principal (5)
  [/\bprincipal\b/, 5],
  // Staff / Lead (4)
  [/\b(staff|lead)\b/, 4],
  // Senior (3)
  [/\bsenior\b/, 3],
  // Junior / Associate (1)
  [/\b(junior|jr|associate)\b/, 1],
  // Intern (0)
  [/\bintern\b/, 0],
];

const DEFAULT_LEVEL = 2; // mid-level when no prefix detected

/**
 * Parse a role title into a numeric seniority level (0-9).
 * Falls back to 2 (mid-level) when no seniority keyword is found.
 */
export function parseSeniorityLevel(roleTitle: string): number {
  if (!roleTitle) return DEFAULT_LEVEL;

  const normalized = roleTitle.toLowerCase();

  for (const [pattern, level] of SENIORITY_LEVELS) {
    if (pattern.test(normalized)) {
      return level;
    }
  }

  return DEFAULT_LEVEL;
}

/**
 * Compare the seniority of a source role against the searched role.
 * Returns "more-senior" if the source role is higher level,
 * "same-or-lower" otherwise (including when sourceRole is empty/falsy).
 */
export function compareSeniority(
  searchedRole: string,
  sourceRole: string,
): SeniorityComparison {
  if (!sourceRole) return "same-or-lower";

  const searchedLevel = parseSeniorityLevel(searchedRole);
  const sourceLevel = parseSeniorityLevel(sourceRole);

  return sourceLevel > searchedLevel ? "more-senior" : "same-or-lower";
}
