import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import pySource from '../../microgpt/microgpt.py?raw';
import jsSource from '../../microgpt/microgpt.js?raw';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightPython(code: string): string {
  const keywords = [
    'import', 'from', 'def', 'class', 'return', 'if', 'else', 'elif',
    'for', 'in', 'while', 'not', 'and', 'or', 'is', 'None', 'True', 'False',
    'with', 'as', 'try', 'except', 'finally', 'raise', 'yield', 'lambda',
    'pass', 'break', 'continue', 'global', 'nonlocal', 'assert', 'del',
  ];
  const builtins = [
    'print', 'len', 'range', 'sum', 'max', 'min', 'abs', 'int', 'float',
    'str', 'list', 'dict', 'set', 'tuple', 'sorted', 'enumerate', 'zip',
    'map', 'filter', 'isinstance', 'type', 'open', 'super', 'property',
    'staticmethod', 'classmethod', 'reversed', 'any', 'all',
  ];

  let result = '';
  let inTripleQuote: string | null = null;
  const lines = code.split('\n');

  for (const line of lines) {
    let i = 0;

    if (inTripleQuote) {
      const end = line.indexOf(inTripleQuote);
      if (end !== -1) {
        result += `<span class="chs">${escapeHtml(line.slice(0, end + 3))}</span>`;
        inTripleQuote = null;
        i = end + 3;
      } else {
        result += `<span class="chs">${escapeHtml(line)}</span>\n`;
        continue;
      }
    }

    while (i < line.length) {
      if (line[i] === '#') {
        result += `<span class="chc">${escapeHtml(line.slice(i))}</span>`;
        i = line.length;
        continue;
      }
      if (line[i] === "'" || line[i] === '"') {
        const quote = line[i];
        const tripleQuote = line.slice(i, i + 3);
        if (tripleQuote === '"""' || tripleQuote === "'''") {
          const end = line.indexOf(tripleQuote, i + 3);
          if (end !== -1) {
            result += `<span class="chs">${escapeHtml(line.slice(i, end + 3))}</span>`;
            i = end + 3;
          } else {
            result += `<span class="chs">${escapeHtml(line.slice(i))}</span>`;
            inTripleQuote = tripleQuote;
            i = line.length;
          }
        } else {
          let j = i + 1;
          while (j < line.length && line[j] !== quote) {
            if (line[j] === '\\') j++;
            j++;
          }
          result += `<span class="chs">${escapeHtml(line.slice(i, j + 1))}</span>`;
          i = j + 1;
        }
        continue;
      }
      if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]:]/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.e_xXabcdefABCDEF+-]/.test(line[j])) j++;
        result += `<span class="chn">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (line[i] === '@') {
        let j = i + 1;
        while (j < line.length && /\w/.test(line[j])) j++;
        result += `<span class="chd">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /\w/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (keywords.includes(word)) {
          result += `<span class="chk">${word}</span>`;
        } else if (builtins.includes(word)) {
          result += `<span class="chb">${word}</span>`;
        } else if (j < line.length && line[j] === '(') {
          result += `<span class="chf">${word}</span>`;
        } else if (word === 'self') {
          result += `<span class="chk">${word}</span>`;
        } else {
          result += escapeHtml(word);
        }
        i = j;
        continue;
      }
      if ('+-*/%=<>!&|^~'.includes(line[i])) {
        result += `<span class="cho">${escapeHtml(line[i])}</span>`;
        i++;
        continue;
      }
      result += escapeHtml(line[i]);
      i++;
    }
    result += '\n';
  }
  return result;
}

function highlightJavaScript(code: string): string {
  const keywords = [
    'const', 'let', 'var', 'function', 'class', 'return', 'if', 'else',
    'for', 'while', 'do', 'new', 'of', 'in', 'import', 'from', 'export',
    'throw', 'typeof', 'instanceof', 'this', 'break', 'continue',
    'switch', 'case', 'default', 'try', 'catch', 'finally',
    'void', 'delete', 'yield', 'async', 'await', 'extends', 'static',
    'true', 'false', 'null', 'undefined',
  ];
  const builtins = [
    'console', 'Math', 'Array', 'Object', 'Set', 'String', 'Number',
    'process', 'Error', 'Map', 'Promise', 'Symbol', 'JSON', 'Date',
    'parseInt', 'parseFloat', 'Infinity', 'NaN', 'readFileSync', 'existsSync',
  ];

  let result = '';
  let inBlockComment = false;
  const lines = code.split('\n');

  for (const line of lines) {
    let i = 0;

    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end !== -1) {
        result += `<span class="chc">${escapeHtml(line.slice(0, end + 2))}</span>`;
        inBlockComment = false;
        i = end + 2;
      } else {
        result += `<span class="chc">${escapeHtml(line)}</span>\n`;
        continue;
      }
    }

    while (i < line.length) {
      if (line[i] === '/' && line[i + 1] === '/') {
        result += `<span class="chc">${escapeHtml(line.slice(i))}</span>`;
        i = line.length;
        continue;
      }
      if (line[i] === '/' && line[i + 1] === '*') {
        const end = line.indexOf('*/', i + 2);
        if (end !== -1) {
          result += `<span class="chc">${escapeHtml(line.slice(i, end + 2))}</span>`;
          i = end + 2;
        } else {
          result += `<span class="chc">${escapeHtml(line.slice(i))}</span>`;
          inBlockComment = true;
          i = line.length;
        }
        continue;
      }
      if (line[i] === "'" || line[i] === '"' || line[i] === '`') {
        const quote = line[i];
        let j = i + 1;
        while (j < line.length && line[j] !== quote) {
          if (line[j] === '\\') j++;
          j++;
        }
        result += `<span class="chs">${escapeHtml(line.slice(i, j + 1))}</span>`;
        i = j + 1;
        continue;
      }
      if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]:!&|^~?;{}]/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.e_xXabcdefABCDEF+-n]/.test(line[j])) j++;
        result += `<span class="chn">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (/[a-zA-Z_$]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\w$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (keywords.includes(word)) {
          result += `<span class="chk">${word}</span>`;
        } else if (builtins.includes(word)) {
          result += `<span class="chb">${word}</span>`;
        } else if (j < line.length && line[j] === '(') {
          result += `<span class="chf">${word}</span>`;
        } else {
          result += escapeHtml(word);
        }
        i = j;
        continue;
      }
      if ('+-*/%=<>!&|^~?'.includes(line[i])) {
        result += `<span class="cho">${escapeHtml(line[i])}</span>`;
        i++;
        continue;
      }
      result += escapeHtml(line[i]);
      i++;
    }
    result += '\n';
  }
  return result;
}

type Lang = 'py' | 'js';
type LineRange = [number, number]; // inclusive [start, end]

function expandRanges(ranges: LineRange[]): number[] {
  return ranges.flatMap(([start, end]) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)
  );
}

const STORAGE_KEY = 'microgpt-code-lang';

interface CodePanelProps {
  pyHighlight?: LineRange[];
  jsHighlight?: LineRange[];
  title?: string;
  blogExcerpt?: string;
}

export default function CodePanel({ pyHighlight = [], jsHighlight = [], title, blogExcerpt }: CodePanelProps) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'js' ? 'js' : 'py';
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const pyHighlighted = useMemo(() => highlightPython(pySource), []);
  const jsHighlighted = useMemo(() => highlightJavaScript(jsSource), []);

  const pyLines = useMemo(() => pyHighlighted.split('\n'), [pyHighlighted]);
  const jsLines = useMemo(() => jsHighlighted.split('\n'), [jsHighlighted]);

  const lines = lang === 'py' ? pyLines : jsLines;
  const highlightLines = useMemo(
    () => expandRanges(lang === 'py' ? pyHighlight : jsHighlight),
    [lang, pyHighlight, jsHighlight]
  );

  const setLanguage = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  // Auto-scroll to first highlighted line
  useEffect(() => {
    if (!scrollRef.current || !highlightLines.length) return;
    const firstLine = Math.min(...highlightLines);
    const lineEl = scrollRef.current.querySelector(`[data-line="${firstLine}"]`);
    if (lineEl) {
      requestAnimationFrame(() => {
        lineEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [highlightLines, lang]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header: title + language toggle */}
      <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-slate-500 flex-shrink-0">
            {lang === 'py' ? 'microgpt.py' : 'microgpt.js'}
          </span>
          {title && (
            <>
              <span className="text-slate-700 flex-shrink-0">&mdash;</span>
              <h3 className="text-sm font-semibold text-slate-300 truncate">{title}</h3>
            </>
          )}
        </div>
        <div className="flex rounded-md overflow-hidden border border-slate-700 flex-shrink-0 ml-2">
          <button
            onClick={() => setLanguage('py')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors duration-100 ${
              lang === 'py'
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Python
          </button>
          <button
            onClick={() => setLanguage('js')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors duration-100 ${
              lang === 'js'
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            JavaScript
          </button>
        </div>
      </div>

      {blogExcerpt && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 flex-shrink-0">
          <div className="text-xs uppercase tracking-wider text-amber-400/70 mb-2 font-semibold">From the blog post</div>
          <div className="text-sm text-slate-300 leading-relaxed italic">
            &ldquo;{blogExcerpt}&rdquo;
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <pre className="p-4 text-[13px] leading-[1.7] font-mono">
          <code>
            {lines.map((line, i) => (
              <div
                key={i}
                data-line={i + 1}
                className={`flex ${highlightLines.includes(i + 1) ? 'bg-amber-400/10 -mx-4 px-4 border-l-2 border-amber-400' : ''}`}
              >
                <span className="inline-block w-8 text-right mr-4 text-slate-600 select-none flex-shrink-0 text-xs leading-[1.85]">
                  {i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: line }} />
              </div>
            ))}
          </code>
        </pre>
      </div>

      <style>{`
        .chk { color: #c084fc; font-weight: 500; }
        .chs { color: #34d399; }
        .chc { color: #64748b; font-style: italic; }
        .chn { color: #fbbf24; }
        .chf { color: #60a5fa; }
        .chd { color: #f472b6; }
        .chb { color: #22d3ee; }
        .cho { color: #94a3b8; }
      `}</style>
    </div>
  );
}
