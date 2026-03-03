import { useState, useMemo, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ── seeded PRNG ────────────────────────────────────────────── */
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed / 2147483647) - 0.5;
  };
}

/* ── constants ──────────────────────────────────────────────── */
const VOCAB_SIZE = 27;
const N_EMBD = 16;
const BLOCK_SIZE = 16;
const TOKENS = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['BOS']);
const TOKEN_LABELS = TOKENS.map((t, i) =>
  t === 'BOS' ? `BOS(${i})` : `${t}(${i})`,
);

/* ── generate all embedding tables once ─────────────────────── */
function buildTable(rows: number, cols: number, seed: number): number[][] {
  const rng = seededRandom(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(rng() * 0.2 * 1000) / 1000),
  );
}

/* ── colour helpers (blue ← 0 → red) ───────────────────────── */
function heatColor(v: number): string {
  const t = Math.max(-1, Math.min(1, v / 0.1)); // normalise to -1…1
  if (t < 0) {
    const a = -t;
    return `rgb(${Math.round(59 + (255 - 59) * (1 - a))}, ${Math.round(130 + (255 - 130) * (1 - a))}, 246)`;
  }
  const a = t;
  return `rgb(246, ${Math.round(130 + (255 - 130) * (1 - a))}, ${Math.round(59 + (255 - 59) * (1 - a))})`;
}

/* ── simple SVG bar chart component ─────────────────────────── */
function BarChart({
  values,
  width = 260,
  height = 100,
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  label?: string;
}) {
  const barW = Math.floor((width - 4) / values.length);
  const mid = height / 2;
  const scale = (mid - 6) / 0.12; // leave a little headroom

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-[10px] text-slate-400 mb-1 font-mono">{label}</span>
      )}
      <svg width={width} height={height} className="bg-slate-800/60 rounded">
        {/* zero line */}
        <line x1={0} x2={width} y1={mid} y2={mid} stroke="#475569" strokeWidth={1} />
        {values.map((v, i) => {
          const barH = Math.abs(v) * scale;
          const y = v >= 0 ? mid - barH : mid;
          const fill = v >= 0 ? '#34d399' : '#fb7185';
          return (
            <rect
              key={i}
              x={2 + i * barW}
              y={y}
              width={Math.max(barW - 2, 1)}
              height={Math.max(barH, 0.5)}
              fill={fill}
              rx={1}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function Embeddings() {
  /* ── state ─────────────────────────────────────────────────── */
  const [selectedToken, setSelectedToken] = useState(4); // 'e'
  const [selectedPos, setSelectedPos] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  /* ── deterministic embedding tables ────────────────────────── */
  const tokEmb = useMemo(() => buildTable(VOCAB_SIZE, N_EMBD, 42), []);
  const posEmb = useMemo(() => buildTable(BLOCK_SIZE, N_EMBD, 137), []);

  /* ── derived vectors ───────────────────────────────────────── */
  const tokVec = tokEmb[selectedToken];
  const posVec = posEmb[selectedPos];
  const combined = tokVec.map((t, i) =>
    Math.round((t + posVec[i]) * 1000) / 1000,
  );

  /* ── keep selected row visible ─────────────────────────────── */
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  useEffect(() => {
    rowRefs.current[selectedToken]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [selectedToken]);

  /* ── LEFT CONTENT ──────────────────────────────────────────── */
  const leftContent = (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">
          Chapter 4: Embeddings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Giving meaning to numbers
        </p>
      </div>

      {/* ── Explanation ───────────────────────────────────────── */}
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>
          Token IDs like <span className="text-amber-300 font-mono">4</span>{' '}
          (for &lsquo;e&rsquo;) are just arbitrary numbers. An embedding converts each
          token ID into a rich vector of{' '}
          <span className="text-amber-300 font-mono">16</span> numbers that the
          neural network can actually work with.
        </p>
        <p>
          Think of it as a lookup table:{' '}
          <span className="font-mono text-emerald-400">
            token 4 &rarr; look up row 4 &rarr; get 16 numbers that represent
            &lsquo;e&rsquo;
          </span>
        </p>
        <p>
          Position embeddings work the same way:{' '}
          <span className="font-mono text-emerald-400">
            position 0 &rarr; row 0 &rarr; 16 numbers representing &lsquo;first
            position&rsquo;
          </span>
        </p>
      </div>

      {/* ── Token Buttons ─────────────────────────────────────── */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Token Embedding Lookup
        </h3>
        <div className="flex flex-wrap gap-1">
          {TOKENS.map((tok, i) => (
            <button
              key={i}
              onClick={() => setSelectedToken(i)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                selectedToken === i
                  ? 'bg-amber-400 text-slate-900 font-bold shadow-lg shadow-amber-400/30'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tok}
            </button>
          ))}
        </div>
      </div>

      {/* ── Heatmap Table ─────────────────────────────────────── */}
      <div className="relative">
        {/* column header */}
        <div className="flex mb-1 ml-[60px]">
          {Array.from({ length: N_EMBD }, (_, c) => (
            <div
              key={c}
              className="text-[9px] text-slate-500 text-center font-mono"
              style={{ width: 28 }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* scrollable body */}
        <div className="max-h-[240px] overflow-y-auto rounded border border-slate-700/50 bg-slate-900/40 scrollbar-thin">
          <table className="border-collapse">
            <tbody>
              {tokEmb.map((row, r) => {
                const isSelected = r === selectedToken;
                return (
                  <tr
                    key={r}
                    ref={(el) => {
                      rowRefs.current[r] = el;
                    }}
                    className={`transition-all ${
                      isSelected
                        ? 'ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)] relative z-10'
                        : ''
                    }`}
                  >
                    {/* row label */}
                    <td className="sticky left-0 bg-slate-900 text-[10px] text-slate-400 font-mono pr-1 w-[60px] text-right whitespace-nowrap">
                      {TOKEN_LABELS[r]}
                    </td>

                    {row.map((v, c) => {
                      const isHovered =
                        hoveredCell?.r === r && hoveredCell?.c === c;
                      return (
                        <td
                          key={c}
                          onMouseEnter={() => setHoveredCell({ r, c })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="p-0 relative"
                          style={{ width: 28, height: 22 }}
                        >
                          <div
                            className="w-full h-full transition-colors"
                            style={{ backgroundColor: heatColor(v) }}
                          />
                          {/* tooltip on hover */}
                          {isHovered && (
                            <div className="absolute z-30 -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] text-slate-200 font-mono whitespace-nowrap shadow-lg">
                              {v.toFixed(3)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* selected row readout */}
        <p className="text-[11px] text-slate-400 mt-2 font-mono">
          Selected:{' '}
          <span className="text-amber-300">
            {TOKENS[selectedToken]}({selectedToken})
          </span>{' '}
          &rarr; [{tokVec.map((v) => v.toFixed(3)).join(', ')}]
        </p>
      </div>

      {/* ── Extracted embedding bar chart ─────────────────────── */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Extracted Token Embedding Vector
        </h3>
        <BarChart
          values={tokVec}
          width={460}
          height={80}
          label={`wte[${selectedToken}]  (token "${TOKENS[selectedToken]}")`}
        />
      </div>

      {/* ── Position Embedding Addition ───────────────────────── */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Token + Position = Input Vector
        </h3>

        {/* position selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-400">Position:</span>
          <div className="flex gap-1">
            {Array.from({ length: BLOCK_SIZE }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedPos(i)}
                className={`w-6 h-5 rounded text-[10px] font-mono transition-all ${
                  selectedPos === i
                    ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/30'
                    : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* three bar charts side by side */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <BarChart
            values={tokVec}
            width={180}
            height={80}
            label={`tok_emb  [token ${selectedToken}]`}
          />
          <span className="text-lg text-slate-500 font-bold">+</span>
          <BarChart
            values={posVec}
            width={180}
            height={80}
            label={`pos_emb  [pos ${selectedPos}]`}
          />
          <span className="text-lg text-slate-500 font-bold">=</span>
          <BarChart
            values={combined}
            width={180}
            height={80}
            label="x  (combined)"
          />
        </div>

        {/* formula */}
        <p className="text-[11px] text-slate-400 font-mono mt-2 leading-relaxed">
          x = [t&#x2080;+p&#x2080;, t&#x2081;+p&#x2081;, t&#x2082;+p&#x2082;, &hellip;, t&#x2081;&#x2085;+p&#x2081;&#x2085;]
        </p>
      </div>

      {/* ── Key Insight ───────────────────────────────────────── */}
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4">
        <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
          Key Insight
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          These embedding values start random and get trained! As the model
          learns, tokens with similar meanings end up with similar embedding
          vectors. The position embeddings help the model know{' '}
          <span className="text-amber-300 font-semibold">WHERE</span> each token
          appears in the sequence.
        </p>
      </div>
    </div>
  );

  /* ── RIGHT CONTENT ─────────────────────────────────────────── */
  const rightContent = (
    <CodePanel
      pyHighlight={[[74, 81], [108, 112]]}
      jsHighlight={[[104, 112], [143, 147]]}
      title="Embeddings"
      blogExcerpt="Token and position embeddings combined into input representation"
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
