import { useState, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fakeSoftmax(logits: number[]): number[] {
  const maxVal = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/** Deterministic seed-able pseudo-random (mulberry32) */
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateAttentionWeights(tokens: string[]): number[][] {
  const n = tokens.length;
  const weights: number[][] = [];
  let seed = 0;
  for (const ch of tokens.join('')) seed += ch.charCodeAt(0);
  const rng = seededRandom(seed);

  for (let q = 0; q < n; q++) {
    const logits: number[] = [];
    for (let k = 0; k <= q; k++) {
      // Base score: slightly positive
      let score = 0.3;
      // Recency bonus: tokens closer to query get higher scores
      score += (k / (q + 1)) * 1.5;
      // Self-attention bonus
      if (k === q) score += 0.8;
      // BOS gets moderate attention
      if (k === 0) score += 0.4;
      // Small random noise
      score += (rng() - 0.5) * 0.6;
      logits.push(score);
    }
    const softmaxed = fakeSoftmax(logits);
    // Pad with -1 for masked positions
    const row = [...softmaxed, ...Array(n - q - 1).fill(-1)];
    weights.push(row);
  }
  return weights;
}

/* ------------------------------------------------------------------ */
/*  Attention Heatmap Component                                       */
/* ------------------------------------------------------------------ */

function AttentionHeatmap() {
  const [word, setWord] = useState('emma');
  const [hoveredCell, setHoveredCell] = useState<{ q: number; k: number } | null>(null);

  const tokens = useMemo(() => {
    const chars = word.split('');
    return ['BOS', ...chars];
  }, [word]);

  const weights = useMemo(() => generateAttentionWeights(tokens), [tokens]);

  const n = tokens.length;
  const cellSize = 48;

  const handleMouseEnter = useCallback((q: number, k: number) => {
    setHoveredCell({ q, k });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  return (
    <div className="mt-4">
      {/* Input */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-slate-400">Input word:</label>
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8))}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-amber-300 font-mono
                     focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 w-32"
          maxLength={8}
          placeholder="emma"
        />
        <span className="text-xs text-slate-500">
          Tokens: [{tokens.map(t => `"${t}"`).join(', ')}]
        </span>
      </div>

      {/* Hover info */}
      <div className="h-6 mb-2">
        {hoveredCell && weights[hoveredCell.q][hoveredCell.k] >= 0 ? (
          <p className="text-sm text-amber-300">
            <span className="font-semibold">"{tokens[hoveredCell.q]}"</span>
            {' '}is paying{' '}
            <span className="font-mono font-bold text-amber-400">
              {(weights[hoveredCell.q][hoveredCell.k] * 100).toFixed(1)}%
            </span>
            {' '}attention to{' '}
            <span className="font-semibold">"{tokens[hoveredCell.k]}"</span>
          </p>
        ) : hoveredCell && weights[hoveredCell.q][hoveredCell.k] < 0 ? (
          <p className="text-sm text-slate-500 italic">
            Masked: "{tokens[hoveredCell.q]}" cannot attend to future token "{tokens[hoveredCell.k]}"
          </p>
        ) : (
          <p className="text-sm text-slate-600 italic">Hover over a cell to see attention details</p>
        )}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Column labels (Key tokens) */}
          <div className="flex" style={{ marginLeft: cellSize + 8 }}>
            {tokens.map((t, i) => (
              <div
                key={`col-${i}`}
                className={`text-center text-xs font-mono transition-colors duration-150 ${
                  hoveredCell?.k === i ? 'text-amber-300 font-bold' : 'text-slate-500'
                }`}
                style={{ width: cellSize, height: 28 }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Key label */}
          <div className="flex justify-center text-[10px] text-slate-600 uppercase tracking-widest mb-1"
               style={{ marginLeft: cellSize + 8, width: n * cellSize }}>
            Key (being attended to) &rarr;
          </div>

          {/* Rows */}
          {tokens.map((qToken, q) => (
            <div key={`row-${q}`} className="flex items-center">
              {/* Row label (Query token) */}
              <div
                className={`text-right text-xs font-mono pr-2 transition-colors duration-150 ${
                  hoveredCell?.q === q ? 'text-amber-300 font-bold' : 'text-slate-500'
                }`}
                style={{ width: cellSize + 4 }}
              >
                {qToken}
              </div>

              {/* Cells */}
              {tokens.map((_, k) => {
                const val = weights[q][k];
                const isMasked = val < 0;
                const isHighlighted = hoveredCell?.q === q || hoveredCell?.k === k;
                const isHovered = hoveredCell?.q === q && hoveredCell?.k === k;

                return (
                  <div
                    key={`cell-${q}-${k}`}
                    className={`
                      relative flex items-center justify-center border border-slate-700/60
                      transition-all duration-150 cursor-default select-none
                      ${isMasked ? 'masked-cell' : ''}
                      ${isHovered ? 'ring-2 ring-amber-400 z-10' : ''}
                      ${isHighlighted && !isMasked ? 'brightness-110' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isMasked
                        ? 'rgba(15, 23, 42, 0.9)'
                        : `rgba(245, 158, 11, ${val * 0.85 + 0.05})`,
                    }}
                    onMouseEnter={() => handleMouseEnter(q, k)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {isMasked ? (
                      <span className="text-[10px] text-slate-700 font-mono">--</span>
                    ) : (
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          val > 0.45 ? 'text-slate-900' : 'text-slate-200'
                        }`}
                      >
                        {val.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Query axis label */}
          <div className="flex items-center mt-1">
            <div
              className="text-[10px] text-slate-600 uppercase tracking-widest text-right pr-2"
              style={{ width: cellSize + 4 }}
            >
              &uarr; Query
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }} />
          <span>Low attention</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: 'rgba(245, 158, 11, 0.55)' }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: 'rgba(245, 158, 11, 0.9)' }} />
          <span>High attention</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-slate-700 masked-cell" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }} />
          <span>Masked (future)</span>
        </div>
      </div>

      {/* CSS for masked cell diagonal stripes */}
      <style>{`
        .masked-cell {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            rgba(51, 65, 85, 0.4) 3px,
            rgba(51, 65, 85, 0.4) 5px
          ) !important;
          background-color: rgba(15, 23, 42, 0.9) !important;
          background-blend-mode: normal;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step-by-step Attention Flow                                       */
/* ------------------------------------------------------------------ */

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
          {step}
        </span>
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <svg width="20" height="20" viewBox="0 0 20 20" className="text-slate-600">
        <path d="M10 4 L10 14 M6 11 L10 15 L14 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

function AttentionFlowDiagram() {
  return (
    <div className="space-y-1">
      <StepCard step={1} title="Compute Q, K, V">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-700 rounded text-xs text-slate-300 font-mono">x</div>
          <div className="flex flex-col items-center gap-1">
            <svg width="40" height="24" viewBox="0 0 40 24" className="text-slate-500">
              <path d="M0 12 H32 M28 8 L34 12 L28 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-red-900/40 border border-red-700/40 rounded text-xs text-red-300 font-mono font-semibold">Q</div>
            <div className="px-3 py-1.5 bg-blue-900/40 border border-blue-700/40 rounded text-xs text-blue-300 font-mono font-semibold">K</div>
            <div className="px-3 py-1.5 bg-green-900/40 border border-green-700/40 rounded text-xs text-green-300 font-mono font-semibold">V</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Each is a matrix multiply: <span className="font-mono text-slate-400">Q = linear(x, W_q)</span>
        </p>
      </StepCard>

      <FlowArrow />

      <StepCard step={2} title="Attention Scores">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="px-2.5 py-1.5 bg-red-900/40 border border-red-700/40 rounded text-xs text-red-300 font-mono">Q[t]</div>
          <span className="text-slate-500 text-xs font-mono">&middot;</span>
          <div className="flex gap-1">
            {['K[0]', 'K[1]', 'K[2]', 'K[t]'].map((label, i) => (
              <div key={i} className="px-2 py-1.5 bg-blue-900/40 border border-blue-700/40 rounded text-[10px] text-blue-300 font-mono">
                {label}
              </div>
            ))}
          </div>
          <span className="text-slate-500 text-lg font-mono">&rarr;</span>
          <div className="flex gap-1">
            {['2.1', '0.8', '1.5', '3.2'].map((s, i) => (
              <div key={i} className="px-2 py-1.5 bg-slate-700 rounded text-[10px] text-amber-300 font-mono">{s}</div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          <span className="font-mono text-slate-400">Score = Q &middot; K / &radic;d</span> &mdash; how similar is my query to each key?
        </p>
      </StepCard>

      <FlowArrow />

      <StepCard step={3} title="Softmax">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {['2.1', '0.8', '1.5', '3.2'].map((s, i) => (
              <div key={i} className="px-2 py-1.5 bg-slate-700 rounded text-[10px] text-slate-400 font-mono">{s}</div>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">&xrarr; softmax &xrarr;</span>
          <div className="flex gap-1">
            {['0.22', '0.06', '0.12', '0.60'].map((w, i) => (
              <div key={i} className="px-2 py-1.5 rounded text-[10px] font-mono font-semibold"
                   style={{
                     backgroundColor: `rgba(245, 158, 11, ${parseFloat(w) * 0.9 + 0.08})`,
                     color: parseFloat(w) > 0.4 ? '#1e293b' : '#fde68a',
                   }}>
                {w}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Convert scores to probabilities <span className="text-slate-400">(0-1, sum to 1)</span>
        </p>
      </StepCard>

      <FlowArrow />

      <StepCard step={4} title="Weighted Sum of Values">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {[0.22, 0.06, 0.12, 0.60].map((w, i) => (
              <div key={i} className="px-1.5 py-1 rounded text-[10px] font-mono text-amber-300"
                   style={{ backgroundColor: `rgba(245, 158, 11, ${w * 0.9 + 0.08})`, color: w > 0.4 ? '#1e293b' : '#fde68a' }}>
                {w.toFixed(2)}
              </div>
            ))}
          </div>
          <span className="text-slate-500 text-xs font-mono">&times;</span>
          <div className="flex gap-1">
            {['V[0]', 'V[1]', 'V[2]', 'V[t]'].map((label, i) => (
              <div key={i} className="px-2 py-1.5 bg-green-900/40 border border-green-700/40 rounded text-[10px] text-green-300 font-mono">
                {label}
              </div>
            ))}
          </div>
          <span className="text-slate-500 text-lg font-mono">&rarr;</span>
          <div className="px-3 py-1.5 bg-amber-900/40 border border-amber-600/40 rounded text-xs text-amber-300 font-mono font-semibold">
            output
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          <span className="font-mono text-slate-400">Output = weighted average of all Value vectors</span>
        </p>
      </StepCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multi-Head Diagram                                                */
/* ------------------------------------------------------------------ */

function MultiHeadDiagram() {
  const heads = ['Head 1', 'Head 2', 'Head 3', 'Head 4'];
  const focuses = ['vowels?', 'position?', 'repeats?', 'context?'];
  return (
    <div className="mt-3">
      <div className="flex items-end gap-1.5 justify-center">
        {heads.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-600 italic">{focuses[i]}</span>
            <div className="w-16 h-10 bg-amber-500/15 border border-amber-500/30 rounded flex items-center justify-center">
              <span className="text-[10px] text-amber-400 font-mono font-semibold">{h}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Concat arrow */}
      <div className="flex justify-center mt-2">
        <svg width="200" height="24" viewBox="0 0 200 24" className="text-slate-500">
          <path d="M20 4 L20 12 L180 12 L180 4" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M100 12 L100 20 M96 16 L100 21 L104 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
      <div className="flex justify-center">
        <div className="px-4 py-1.5 bg-slate-700/80 border border-slate-600 rounded text-xs text-slate-300 font-mono">
          concat &rarr; [dim 16]
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Code for the Right Panel                                          */
/* ------------------------------------------------------------------ */

const attentionCode = `# Multi-head Attention — the heart of the Transformer
n_head = 4
head_dim = n_embd // n_head  # 16 // 4 = 4

# Inside the GPT function, for each layer:

# 1. Project input to Q, K, V
q = linear(x, state_dict[f'layer{li}.attn_wq'])
k = linear(x, state_dict[f'layer{li}.attn_wk'])
v = linear(x, state_dict[f'layer{li}.attn_wv'])

# Save K, V for future tokens to attend to
keys[li].append(k)
values[li].append(v)

# 2. For each attention head:
x_attn = []
for h in range(n_head):
    hs = h * head_dim  # head start index

    # Slice this head's portion
    q_h = q[hs:hs+head_dim]
    k_h = [ki[hs:hs+head_dim] for ki in keys[li]]
    v_h = [vi[hs:hs+head_dim] for vi in values[li]]

    # Compute attention scores: Q · K / √d
    attn_logits = [
        sum(q_h[j] * k_h[t][j] for j in range(head_dim))
        / head_dim**0.5
        for t in range(len(k_h))
    ]

    # Softmax → attention weights (sum to 1)
    attn_weights = softmax(attn_logits)

    # Weighted sum of values
    head_out = [
        sum(attn_weights[t] * v_h[t][j]
            for t in range(len(v_h)))
        for j in range(head_dim)
    ]
    x_attn.extend(head_out)

# Output projection
x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])
# Residual connection
x = [a + b for a, b in zip(x, x_residual)]`;

/* ------------------------------------------------------------------ */
/*  Main Attention Chapter                                            */
/* ------------------------------------------------------------------ */

export default function Attention() {
  const leftContent = (
    <div className="space-y-8">
      {/* ---- Section Header ---- */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Chapter 5: <span className="text-amber-400">Attention</span>
        </h1>
        <p className="text-slate-400 mt-1 text-lg">How tokens talk to each other</p>
      </div>

      {/* ---- Intuitive Explanation ---- */}
      <section className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Attention is the mechanism that lets each token <em className="text-amber-300 not-italic font-medium">"look at"</em> previous
          tokens to gather context.
        </p>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Think of it like this: when predicting the next letter in{' '}
            <span className="font-mono text-amber-300">"emm_"</span>, the model needs to look back at{' '}
            <span className="font-mono text-amber-300">'e'</span>,{' '}
            <span className="font-mono text-amber-300">'m'</span>,{' '}
            <span className="font-mono text-amber-300">'m'</span> to know what fits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <p className="text-slate-300 text-sm leading-relaxed">
            Each token asks a <span className="font-semibold text-red-400">Question (Q)</span>, offers a{' '}
            <span className="font-semibold text-blue-400">Key (K)</span>, and holds a{' '}
            <span className="font-semibold text-green-400">Value (V)</span>.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-900/20 border border-red-800/30 rounded p-2.5">
              <span className="font-semibold text-red-400">Q</span>
              <span className="text-slate-400"> asks: </span>
              <span className="text-slate-300 italic">"What am I looking for?"</span>
            </div>
            <div className="bg-blue-900/20 border border-blue-800/30 rounded p-2.5">
              <span className="font-semibold text-blue-400">K</span>
              <span className="text-slate-400"> answers: </span>
              <span className="text-slate-300 italic">"Here's what I have."</span>
            </div>
            <div className="col-span-2 bg-green-900/20 border border-green-800/30 rounded p-2.5">
              <span className="font-semibold text-green-400">V</span>
              <span className="text-slate-400"> provides: </span>
              <span className="text-slate-300 italic">"Here's my actual content."</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            <span className="text-amber-400 font-medium">Attention score</span> = how well Q matches K.
            High match &rarr; pay more attention to that token's V.
          </p>
        </div>
      </section>

      {/* ---- Attention Heatmap ---- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-1 flex items-center gap-2">
          <span className="text-amber-400">&#9632;</span> Attention Heatmap
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          Each row shows how a query token distributes its attention across key tokens.
          Upper-triangle cells are masked (causal: can't look at the future).
        </p>
        <AttentionHeatmap />
      </section>

      {/* ---- Step-by-Step Attention Flow ---- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span className="text-amber-400">&#9632;</span> Step-by-Step Attention Flow
        </h2>
        <AttentionFlowDiagram />
      </section>

      {/* ---- Multi-Head Attention ---- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
          <span className="text-amber-400">&#9632;</span> Multi-Head Attention
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          microgpt uses <span className="text-amber-300 font-mono font-semibold">4 attention heads</span>, each with
          dimension <span className="text-amber-300 font-mono font-semibold">4</span>{' '}
          <span className="text-slate-500">(total: 4 &times; 4 = 16)</span>.
        </p>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Each head can learn to pay attention to different things: one might focus on vowels,
          another on position, another on repeated characters, etc.
        </p>
        <MultiHeadDiagram />
      </section>

      {/* ---- Key Insight ---- */}
      <section className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Key Insight</h3>
        <p className="text-slate-200 leading-relaxed text-sm">
          Attention is the <span className="font-bold text-amber-300">ONLY</span> place where tokens communicate with
          each other. Without it, each token would be processed completely independently with no context. Attention is
          what makes GPT understand language &mdash; it's why{' '}
          <span className="font-mono text-amber-300">"bank"</span> means something different in{' '}
          <span className="italic text-slate-300">"river bank"</span> vs{' '}
          <span className="italic text-slate-300">"bank account"</span>.
        </p>
      </section>
    </div>
  );

  const rightContent = (
    <CodePanel
      code={attentionCode}
      title="microgpt.py — Attention"
      blogExcerpt="Attention is the exact and only place where a token at position t gets to 'look' at tokens in the past"
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
