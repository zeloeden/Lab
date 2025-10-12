// Lightweight parser for advanced search operators used in Samples page
// Supports: name:"blue white" | name:blue | patch:P-045 | code:BW-34 | sample:#1758883612066 | supplier:givaudan | status:accepted

export interface ParsedQuery {
  textTerms: string[];
  exact: {
    name?: string;
    patch?: string;
    code?: string;
    sample?: string;
    supplier?: string;
    status?: string;
  };
}

export function parseQuery(q: string): ParsedQuery {
  const query = (q || '').trim();
  if (!query) return { textTerms: [], exact: {} };

  const exact: ParsedQuery['exact'] = {};
  const terms: string[] = [];

  // Regex to capture key:"quoted value" or key:value
  const operatorRegex = /(name|patch|code|sample|supplier|status):\s*("[^"]+"|[^\s]+)\b/gi;
  let remaining = query;
  let match: RegExpExecArray | null;
  while ((match = operatorRegex.exec(query)) !== null) {
    const key = match[1].toLowerCase();
    const rawVal = match[2];
    const value = rawVal.startsWith('"') && rawVal.endsWith('"')
      ? rawVal.slice(1, -1)
      : rawVal;
    (exact as any)[key] = value;
    // Remove this occurrence from remaining string
    remaining = remaining.replace(match[0], '').trim();
  }

  // Remaining free text terms (split by whitespace)
  remaining
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)
    .forEach(t => terms.push(t));

  return { textTerms: terms, exact };
}

export function includesCI(haystack?: string, needle?: string) {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}


