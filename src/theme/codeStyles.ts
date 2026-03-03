import type { CSSProperties } from 'react';

import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { solarizedDarkAtom } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';

type StyleMap = { [key: string]: CSSProperties };

// Custom midnight theme based on the current palette
const midnight: StyleMap = {
  'code[class*="language-"]': {
    color: '#cbd5e1',
    fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
    background: 'none',
  },
  'pre[class*="language-"]': {
    color: '#cbd5e1',
    background: 'transparent',
  },
  comment: { color: '#64748b', fontStyle: 'italic' },
  prolog: { color: '#64748b' },
  doctype: { color: '#64748b' },
  cdata: { color: '#64748b' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#22d3ee' },
  tag: { color: '#22d3ee' },
  boolean: { color: '#fbbf24' },
  number: { color: '#fbbf24' },
  constant: { color: '#fbbf24' },
  symbol: { color: '#fbbf24' },
  deleted: { color: '#fb7185' },
  selector: { color: '#34d399' },
  'attr-name': { color: '#34d399' },
  string: { color: '#34d399' },
  char: { color: '#34d399' },
  builtin: { color: '#22d3ee' },
  inserted: { color: '#34d399' },
  operator: { color: '#94a3b8' },
  entity: { color: '#fbbf24' },
  url: { color: '#22d3ee' },
  atrule: { color: '#c084fc' },
  'attr-value': { color: '#34d399' },
  keyword: { color: '#c084fc', fontWeight: 500 },
  function: { color: '#60a5fa' },
  'class-name': { color: '#60a5fa' },
  regex: { color: '#fbbf24' },
  important: { color: '#fbbf24', fontWeight: 'bold' },
  variable: { color: '#cbd5e1' },
  decorator: { color: '#f472b6' },
};

const codeStyleMap: Record<string, StyleMap> = {
  midnight,
  monokai: okaidia,
  dracula,
  'solarized-dark': solarizedDarkAtom,
  'solarized-light': solarizedlight,
  'github-light': ghcolors,
};

// Background colors per theme for the code container
export const codeBgMap: Record<string, string> = {
  midnight: 'transparent',
  monokai: 'transparent',
  dracula: 'transparent',
  'solarized-dark': 'transparent',
  'solarized-light': 'transparent',
  'github-light': 'transparent',
};

/**
 * Patch any built-in theme to have transparent backgrounds (we handle bg at container level via CSS vars).
 */
function patchTransparent(style: StyleMap): StyleMap {
  const patched = { ...style };
  for (const key of ['code[class*="language-"]', 'pre[class*="language-"]']) {
    if (patched[key]) {
      patched[key] = { ...patched[key], background: 'transparent' };
    }
  }
  return patched;
}

export function getCodeStyle(themeId: string): StyleMap {
  return patchTransparent(codeStyleMap[themeId] ?? midnight);
}

// One-dark is used as a fallback reference
export { oneDark };
