import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647 - 0.5) * 0.2;
  };
}

const VOCAB = [
  'BOS','a','b','c','d','e','f','g','h','i','j','k','l',
  'm','n','o','p','q','r','s','t','u','v','w','x','y','z',
];

interface StageInfo {
  name: string;
  description: string;
  borderColor: string; // tailwind border color class
  bgGlow: string;      // tailwind ring/shadow color for active
  category: 'data' | 'neural' | 'math';
}

const stages: StageInfo[] = [
  { name: 'Input',                description: "Token: 'e' (ID: 4), Position: 1",                          borderColor: 'border-cyan-400',   bgGlow: 'shadow-cyan-400/30',   category: 'data' },
  { name: 'Token Embedding',      description: 'wte[4] → 16-dim vector',                                   borderColor: 'border-cyan-400',   bgGlow: 'shadow-cyan-400/30',   category: 'data' },
  { name: 'Position Embedding',   description: 'wpe[1] → 16-dim vector',                                   borderColor: 'border-cyan-400',   bgGlow: 'shadow-cyan-400/30',   category: 'data' },
  { name: 'Add Embeddings',       description: 'x = tok_emb + pos_emb',                                    borderColor: 'border-amber-400',  bgGlow: 'shadow-amber-400/30',  category: 'math' },
  { name: 'RMSNorm',              description: 'Normalize the vector',                                      borderColor: 'border-violet-400', bgGlow: 'shadow-violet-400/30', category: 'neural' },
  { name: 'Attention',            description: 'Q\u00B7K scores, softmax weights, weighted sum of V',       borderColor: 'border-violet-400', bgGlow: 'shadow-violet-400/30', category: 'neural' },
  { name: 'Residual Add',         description: 'x = attention_output + x_before_attention',                  borderColor: 'border-amber-400',  bgGlow: 'shadow-amber-400/30',  category: 'math' },
  { name: 'MLP',                  description: '16 \u2192 expand to 64 \u2192 ReLU \u2192 shrink to 16',    borderColor: 'border-violet-400', bgGlow: 'shadow-violet-400/30', category: 'neural' },
  { name: 'Output Logits',        description: 'linear(x, lm_head) \u2192 27 scores \u2192 softmax',       borderColor: 'border-cyan-400',   bgGlow: 'shadow-cyan-400/30',   category: 'data' },
];

const PY_STEP_HIGHLIGHTS: Record<number, [number, number][]> = {
  0: [[108, 108]],
  1: [[109, 109]],
  2: [[110, 110]],
  3: [[111, 111]],
  4: [[112, 112]],
  5: [[115, 132]],
  6: [[133, 134]],
  7: [[135, 141]],
  8: [[143, 144]],
};

const JS_STEP_HIGHLIGHTS: Record<number, [number, number][]> = {
  0: [[143, 143]],
  1: [[144, 144]],
  2: [[145, 145]],
  3: [[146, 146]],
  4: [[147, 147]],
  5: [[150, 169]],
  6: [[170, 171]],
  7: [[172, 178]],
  8: [[181, 181]],
};

/* ---------- small visualization helper components ---------- */

function VectorCells({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values.map(Math.abs), 0.01);
  return (
    <div className="flex gap-px">
      {values.map((v, i) => {
        const intensity = Math.abs(v) / max;
        const bg = v >= 0
          ? `rgba(${color === 'cyan' ? '34,211,238' : color === 'violet' ? '167,139,250' : '251,191,36'}, ${intensity * 0.9 + 0.1})`
          : `rgba(${color === 'cyan' ? '34,211,238' : color === 'violet' ? '167,139,250' : '251,191,36'}, ${intensity * 0.5 + 0.1})`;
        return (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: bg }}
            title={v.toFixed(4)}
          />
        );
      })}
    </div>
  );
}

function MiniBarChart({ values, color, width = 80, height = 24 }: { values: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...values.map(Math.abs), 0.01);
  const barW = Math.max(1, (width - values.length) / values.length);
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      {values.map((v, i) => {
        const h = (Math.abs(v) / max) * (height / 2);
        const y = v >= 0 ? height / 2 - h : height / 2;
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={y}
            width={barW}
            height={Math.max(1, h)}
            fill={color}
            opacity={0.8}
            rx={0.5}
          />
        );
      })}
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#475569" strokeWidth={0.5} />
    </svg>
  );
}

function AttentionHeatmap({ weights }: { weights: number[][] }) {
  const labels = ['BOS', 'e'];
  const cellSize = 28;
  const labelW = 30;
  return (
    <svg width={labelW + cellSize * 2 + 4} height={labelW + cellSize * 2 + 4}>
      {/* Column labels */}
      {labels.map((l, i) => (
        <text key={`cl${i}`} x={labelW + i * cellSize + cellSize / 2} y={12} textAnchor="middle" fill="#94a3b8" fontSize={9}>{l}</text>
      ))}
      {/* Row labels + cells */}
      {weights.map((row, ri) => (
        <g key={`r${ri}`}>
          <text x={labelW - 4} y={labelW + ri * cellSize + cellSize / 2 + 3} textAnchor="end" fill="#94a3b8" fontSize={9}>{labels[ri]}</text>
          {row.map((w, ci) => (
            <g key={`c${ci}`}>
              <rect
                x={labelW + ci * cellSize}
                y={labelW + ri * cellSize}
                width={cellSize - 2}
                height={cellSize - 2}
                rx={3}
                fill={`rgba(167,139,250,${w * 0.9 + 0.1})`}
              />
              <text
                x={labelW + ci * cellSize + (cellSize - 2) / 2}
                y={labelW + ri * cellSize + (cellSize - 2) / 2 + 3}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={8}
                fontWeight={600}
              >
                {w.toFixed(2)}
              </text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function MLPDiamond() {
  const w = 180, h = 50;
  return (
    <svg width={w} height={h}>
      {/* Input layer (16 nodes) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={`in${i}`} cx={4 + i * 6} cy={h / 2} r={2} fill="#60a5fa" opacity={0.7} />
      ))}
      {/* Expand lines */}
      <line x1={52} y1={h / 2} x2={65} y2={8} stroke="#475569" strokeWidth={0.5} />
      <line x1={52} y1={h / 2} x2={65} y2={h - 8} stroke="#475569" strokeWidth={0.5} />
      {/* Hidden layer (64 nodes, show 16) */}
      {Array.from({ length: 16 }).map((_, i) => (
        <circle key={`hid${i}`} cx={65 + i * 3.5} cy={8 + i * ((h - 16) / 15)} r={1.5} fill="#a78bfa" opacity={0.6} />
      ))}
      {/* ReLU label */}
      <text x={128} y={h / 2 - 4} textAnchor="middle" fill="#34d399" fontSize={8} fontWeight={600}>ReLU</text>
      {/* Shrink lines */}
      <line x1={125} y1={8} x2={140} y2={h / 2} stroke="#475569" strokeWidth={0.5} />
      <line x1={125} y1={h - 8} x2={140} y2={h / 2} stroke="#475569" strokeWidth={0.5} />
      {/* Output layer (16 nodes) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={`out${i}`} cx={142 + i * 6} cy={h / 2} r={2} fill="#60a5fa" opacity={0.7} />
      ))}
      {/* Labels */}
      <text x={24} y={h - 2} textAnchor="middle" fill="#64748b" fontSize={7}>16</text>
      <text x={95} y={h - 2} textAnchor="middle" fill="#64748b" fontSize={7}>64</text>
      <text x={166} y={h - 2} textAnchor="middle" fill="#64748b" fontSize={7}>16</text>
    </svg>
  );
}

/* ---------- stage visual renderers ---------- */

function StageVisual({ step, data }: { step: number; data: ReturnType<typeof useGeneratedData> }) {
  switch (step) {
    case 0:
      return (
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-mono font-bold border border-cyan-500/30">
            'e'
          </span>
          <span className="text-slate-500 text-xs">ID: 4</span>
          <span className="text-slate-600 text-xs">|</span>
          <span className="text-slate-500 text-xs">Position: 1</span>
        </div>
      );
    case 1:
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 font-mono">wte[4] =</span>
          <VectorCells values={data.tokEmb} color="cyan" />
          <span className="text-[10px] text-slate-600 font-mono">[{data.tokEmb.slice(0, 4).map(v => v.toFixed(3)).join(', ')}, ...]</span>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 font-mono">wpe[1] =</span>
          <VectorCells values={data.posEmb} color="violet" />
          <span className="text-[10px] text-slate-600 font-mono">[{data.posEmb.slice(0, 4).map(v => v.toFixed(3)).join(', ')}, ...]</span>
        </div>
      );
    case 3:
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <MiniBarChart values={data.tokEmb} color="#22d3ee" />
          <span className="text-amber-400 font-bold text-sm">+</span>
          <MiniBarChart values={data.posEmb} color="#a78bfa" />
          <span className="text-amber-400 font-bold text-sm">=</span>
          <MiniBarChart values={data.combined} color="#fbbf24" />
        </div>
      );
    case 4:
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-slate-600">before</span>
            <MiniBarChart values={data.combined} color="#64748b" />
          </div>
          <span className="text-violet-400 font-bold text-lg">{'\u2192'}</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-slate-600">after</span>
            <MiniBarChart values={data.normed} color="#a78bfa" />
          </div>
        </div>
      );
    case 5:
      return (
        <div className="flex items-center gap-4 flex-wrap">
          <AttentionHeatmap weights={data.attnWeights} />
          <div className="flex flex-col gap-1 text-[10px] text-slate-400">
            <span>BOS {'\u2192'} {(data.attnWeights[1][0] * 100).toFixed(0)}%</span>
            <span>e {'\u2192'} {(data.attnWeights[1][1] * 100).toFixed(0)}%</span>
          </div>
        </div>
      );
    case 6:
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <MiniBarChart values={data.attnOut} color="#a78bfa" />
          <span className="text-amber-400 font-bold text-sm">+</span>
          <MiniBarChart values={data.normed} color="#64748b" />
          <span className="text-amber-400 font-bold text-sm">=</span>
          <MiniBarChart values={data.residual1} color="#fbbf24" />
        </div>
      );
    case 7:
      return <MLPDiamond />;
    case 8:
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-px items-end h-8">
            {data.logits.map((v, i) => {
              const max = Math.max(...data.logits);
              const h = ((v - Math.min(...data.logits)) / (max - Math.min(...data.logits) + 0.01)) * 28 + 2;
              const isTop = i === data.topIdx;
              return (
                <div
                  key={i}
                  className={`rounded-t-sm ${isTop ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  style={{ width: 12, height: h }}
                  title={`${VOCAB[i]}: ${v.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Top prediction:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              '{VOCAB[data.topIdx]}' ({(data.probs[data.topIdx] * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/* ---------- data generation ---------- */

function useGeneratedData() {
  return useMemo(() => {
    const rng = seededRandom(42);
    const tokEmb = Array.from({ length: 16 }, () => rng());
    const posEmb = Array.from({ length: 16 }, () => rng());
    const combined = tokEmb.map((t, i) => t + posEmb[i]);

    // RMSNorm
    const rms = Math.sqrt(combined.reduce((s, v) => s + v * v, 0) / combined.length);
    const normed = combined.map(v => v / (rms + 1e-5));

    // Attention weights (2x2 for BOS and e, row=query, col=key)
    const attnWeights = [
      [1.0, 0.0],        // BOS can only attend to itself (causal)
      [0.35, 0.65],      // e attends to BOS (35%) and itself (65%)
    ];

    // Attention output
    const rng2 = seededRandom(123);
    const attnOut = Array.from({ length: 16 }, () => rng2());

    // Residual
    const residual1 = normed.map((v, i) => v + attnOut[i]);

    // Logits for all 27 tokens
    const rng3 = seededRandom(999);
    const rawLogits = Array.from({ length: 27 }, () => rng3() * 10 + 1);
    // Make 'l' (index 12) the top prediction for fun
    rawLogits[12] = 5.5;
    const logits = rawLogits;

    // Softmax
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExps);
    const topIdx = probs.indexOf(Math.max(...probs));

    return { tokEmb, posEmb, combined, normed, attnWeights, attnOut, residual1, logits, probs, topIdx };
  }, []);
}

/* ---------- main component ---------- */

export default function FullForwardPass() {
  const [step, setStep] = useState(0);
  const data = useGeneratedData();

  const leftContent = (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Chapter 11: The Full Forward Pass</h2>
        <p className="text-slate-400 text-sm">Putting all the pieces together</p>
      </div>

      {/* Explanation */}
      <p className="text-slate-300 text-sm leading-relaxed">
        Let's trace data through the <span className="font-semibold text-white">ENTIRE</span> GPT model, step by step.
        We'll follow what happens when the model processes the token{' '}
        <code className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-xs font-mono">'e'</code>{' '}
        at position 1 (after BOS).
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setStep(s => Math.min(8, s + 1))}
          disabled={step === 8}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
        <button
          onClick={() => setStep(0)}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors"
        >
          Reset
        </button>
        <span className="ml-auto text-xs text-slate-500">
          Step <span className="text-white font-bold">{step}</span> of 8
        </span>
      </div>

      {/* Vertical Flow Diagram */}
      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const isActive = idx === step;
          const isPast = idx < step;

          const borderColorClass =
            stage.category === 'data'
              ? 'border-l-cyan-400'
              : stage.category === 'neural'
              ? 'border-l-violet-400'
              : 'border-l-amber-400';

          const activeBorderClass =
            stage.category === 'data'
              ? 'border-cyan-400/60'
              : stage.category === 'neural'
              ? 'border-violet-400/60'
              : 'border-amber-400/60';

          const activeGlowClass = stage.bgGlow;

          const badgeBg =
            stage.category === 'data'
              ? 'bg-cyan-500'
              : stage.category === 'neural'
              ? 'bg-violet-500'
              : 'bg-amber-500';

          return (
            <div
              key={idx}
              onClick={() => setStep(idx)}
              className={`
                relative flex gap-3 rounded-lg border-l-4 p-3 cursor-pointer
                transition-all duration-300 ease-out
                ${borderColorClass}
                ${isActive
                  ? `bg-slate-800/80 border ${activeBorderClass} shadow-lg ${activeGlowClass} ring-1 ${
                      stage.category === 'data'
                        ? 'ring-cyan-400/20'
                        : stage.category === 'neural'
                        ? 'ring-violet-400/20'
                        : 'ring-amber-400/20'
                    }`
                  : isPast
                  ? 'bg-slate-800/30 border border-slate-700/30 opacity-60'
                  : 'bg-slate-900/30 border border-slate-800/20 opacity-30'
                }
              `}
            >
              {/* Step number badge */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                ${isActive
                  ? `${badgeBg} text-white`
                  : isPast
                  ? 'bg-slate-600 text-slate-300'
                  : 'bg-slate-800 text-slate-600'
                }
              `}>
                {idx}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-semibold ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                    {stage.name}
                  </h4>
                </div>
                <p className={`text-xs mb-2 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.description}
                </p>

                {/* Visual - only show for active step */}
                {isActive && (
                  <div className="mt-2 animate-fade-in">
                    <StageVisual step={idx} data={data} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connecting arrows between stages */}
      {/* (visual connection is handled by the continuous vertical layout) */}

      {/* Step counter bar */}
      <div className="flex items-center gap-1 pt-2">
        {stages.map((_, idx) => {
          const isActive = idx === step;
          const isPast = idx < step;
          const color =
            stages[idx].category === 'data'
              ? isActive ? 'bg-cyan-400' : isPast ? 'bg-cyan-400/40' : 'bg-slate-700'
              : stages[idx].category === 'neural'
              ? isActive ? 'bg-violet-400' : isPast ? 'bg-violet-400/40' : 'bg-slate-700'
              : isActive ? 'bg-amber-400' : isPast ? 'bg-amber-400/40' : 'bg-slate-700';
          return (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${color} ${isActive ? 'h-2' : ''}`}
              title={`Step ${idx}: ${stages[idx].name}`}
            />
          );
        })}
      </div>

      {/* Key Insight */}
      <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Key Insight</h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          This entire pipeline — from one token ID to 27 output probabilities — is{' '}
          <span className="font-semibold text-white">ONE</span> call to{' '}
          <code className="px-1.5 py-0.5 bg-slate-700/50 text-cyan-300 rounded text-xs font-mono">
            gpt(token_id, pos_id, keys, values)
          </code>
          . In microgpt, this happens one token at a time. In production GPT, millions of tokens
          are processed in parallel on GPUs.
        </p>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      pyHighlight={PY_STEP_HIGHLIGHTS[step] ?? []}
      jsHighlight={JS_STEP_HIGHLIGHTS[step] ?? []}
      title="Full Forward Pass"
      blogExcerpt="Main GPT function processes: Token and position embeddings, Multi-head attention, MLP block, Residual connections"
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
