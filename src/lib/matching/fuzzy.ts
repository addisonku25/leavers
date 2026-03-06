import Fuse from "fuse.js";
import { ROLE_SYNONYMS } from "./synonyms";

interface RoleEntry {
  title: string;
  synonyms: string[];
}

const roleEntries: RoleEntry[] = Object.entries(ROLE_SYNONYMS).map(([title, synonyms]) => ({
  title,
  synonyms,
}));

const fuse = new Fuse(roleEntries, {
  keys: [
    { name: "title", weight: 2 },
    { name: "synonyms", weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
});

export function matchRole(query: string): string[] {
  const results = fuse.search(query);
  return results.filter((r) => (r.score ?? 1) < 0.5).map((r) => r.item.title);
}
