import { useMemo } from 'react';

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
  let i = 0;
  const lines = code.split('\n');

  for (const line of lines) {
    i = 0;
    while (i < line.length) {
      // Comments
      if (line[i] === '#') {
        result += `<span class="chc">${escapeHtml(line.slice(i))}</span>`;
        i = line.length;
        continue;
      }
      // Strings
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
      // Numbers
      if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]:]/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.e_xXabcdefABCDEF+-]/.test(line[j])) j++;
        result += `<span class="chn">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      // Decorators
      if (line[i] === '@') {
        let j = i + 1;
        while (j < line.length && /\w/.test(line[j])) j++;
        result += `<span class="chd">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      // Words (keywords, builtins, functions)
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
      // Operators
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface CodePanelProps {
  code: string;
  title?: string;
  highlightLines?: number[];
  blogExcerpt?: string;
}

export default function CodePanel({ code, title, highlightLines = [], blogExcerpt }: CodePanelProps) {
  const highlighted = useMemo(() => highlightPython(code), [code]);
  const lines = highlighted.split('\n');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
        </div>
      )}

      {blogExcerpt && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 flex-shrink-0">
          <div className="text-xs uppercase tracking-wider text-amber-400/70 mb-2 font-semibold">From the blog post</div>
          <div className="text-sm text-slate-300 leading-relaxed italic">
            "{blogExcerpt}"
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-[13px] leading-[1.7] font-mono">
          <code>
            {lines.map((line, i) => (
              <div
                key={i}
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
