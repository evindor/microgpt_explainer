import { useState, useMemo, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { getCodeStyle } from '../theme/codeStyles';
import { useTheme } from '../theme/ThemeContext';
import pySource from '../../microgpt/microgpt.py?raw';
import jsSource from '../../microgpt/microgpt.js?raw';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);

type Lang = 'py' | 'js';
type LineRange = [number, number]; // inclusive [start, end]

function expandRanges(ranges: LineRange[]): Set<number> {
  const set = new Set<number>();
  for (const [start, end] of ranges) {
    for (let i = start; i <= end; i++) set.add(i);
  }
  return set;
}

const STORAGE_KEY = 'microgpt-code-lang';

interface CodePanelProps {
  pyHighlight?: LineRange[];
  jsHighlight?: LineRange[];
  title?: string;
  blogExcerpt?: string;
}

export default function CodePanel({ pyHighlight = [], jsHighlight = [], title, blogExcerpt }: CodePanelProps) {
  const { theme } = useTheme();
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'js' ? 'js' : 'py';
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const source = lang === 'py' ? pySource : jsSource;
  const language = lang === 'py' ? 'python' : 'javascript';

  const highlightLines = useMemo(
    () => expandRanges(lang === 'py' ? pyHighlight : jsHighlight),
    [lang, pyHighlight, jsHighlight]
  );

  const codeStyle = useMemo(() => getCodeStyle(theme), [theme]);

  const setLanguage = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  // Auto-scroll to first highlighted line
  useEffect(() => {
    if (!scrollRef.current || !highlightLines.size) return;
    const firstLine = Math.min(...highlightLines);
    const lineEl = scrollRef.current.querySelector(`[data-line-number="${firstLine}"]`);
    if (lineEl) {
      requestAnimationFrame(() => {
        lineEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [highlightLines, lang]);

  const lineProps = useCallback(
    (lineNumber: number): { style: CSSProperties; 'data-line-number': number } => {
      const isHighlighted = highlightLines.has(lineNumber);
      return {
        style: {
          display: 'block',
          backgroundColor: isHighlighted ? 'var(--highlight-line-bg)' : undefined,
          borderLeft: isHighlighted ? '2px solid var(--highlight-line-border)' : '2px solid transparent',
          marginLeft: '-16px',
          marginRight: '-16px',
          paddingLeft: '14px',
          paddingRight: '16px',
        },
        'data-line-number': lineNumber,
      };
    },
    [highlightLines]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--code-bg)' }}>
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
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          showLineNumbers
          wrapLines
          lineProps={lineProps}
          lineNumberStyle={{
            minWidth: '2.5em',
            textAlign: 'right',
            marginRight: '1em',
            color: 'var(--shell-text-dim)',
            userSelect: 'none',
            fontSize: '12px',
          }}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.7',
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            },
          }}
        >
          {source}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
