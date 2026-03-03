import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useCodePanel } from '../CodePanelContext';
import InferenceViz from '../components/InferenceViz';

/* ── softmax ──────────────────────────────────────────────── */
function softmax(logits: number[]): number[] {
  const maxVal = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/* ── constants ────────────────────────────────────────────── */
const CHARS = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['BOS']);
const VOCAB_SIZE = 27;

/* Fixed base logits for temperature demo — a few tokens have higher logits */
const BASE_LOGITS: number[] = (() => {
  const logits = new Array(VOCAB_SIZE).fill(0);
  // a=0, b=1, ... z=25, BOS=26
  logits[0] = 2.1;   // a
  logits[4] = 1.5;   // e
  logits[8] = 0.9;   // i
  logits[10] = 0.7;  // k
  logits[12] = 1.8;  // m
  logits[13] = 1.0;  // n
  logits[14] = 0.6;  // o
  logits[17] = 0.5;  // r
  logits[18] = 0.4;  // s
  logits[19] = 0.3;  // t
  logits[24] = 0.2;  // y
  logits[26] = -0.5; // BOS
  // rest stay at 0 (low probability)
  for (let i = 0; i < VOCAB_SIZE; i++) {
    if (logits[i] === 0) logits[i] = -1.0 + Math.sin(i * 0.7) * 0.3;
  }
  return logits;
})();


/* ════════════════════════════════════════════════════════════ */
export default function Inference() {
  /* ── Temperature state ───────────────────────────────────── */
  const [temperature, setTemperature] = useState(0.5);

  /* ── Temperature visualization ───────────────────────────── */
  const adjustedLogits = useMemo(
    () => BASE_LOGITS.map(l => l / temperature),
    [temperature],
  );
  const tempProbs = useMemo(() => softmax(adjustedLogits), [adjustedLogits]);
  const maxProb = Math.max(...tempProbs);

  const tempEffect = useMemo(() => {
    if (temperature <= 0.3) return 'Very confident -- always picks the top choice';
    if (temperature <= 0.8) return 'Balanced -- mostly top choices with some variety';
    if (temperature <= 1.2) return 'Moderate -- decent spread across likely tokens';
    return 'Very random -- almost uniform distribution';
  }, [temperature]);

  /* ── SVG Bar Chart dimensions for temperature viz ────────── */
  const chartW = 540;
  const chartH = 180;
  const barPad = 2;
  const barW = (chartW - 20) / VOCAB_SIZE;
  const labelH = 18;
  const plotH = chartH - labelH - 10;

  /* ── LEFT CONTENT ────────────────────────────────────────── */
  useCodePanel({
    pyHighlight: [[186, 201]],
    jsHighlight: [[227, 243]],
    title: "Inference",
    blogExcerpt: "Temperature parameter controls randomness: lower values pick top choices, higher values produce more diverse but less coherent output.",
  });

  const leftContent = (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 13: Inference
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          The model speaks
        </p>
      </div>

      {/* ── Explanation ─────────────────────────────────────── */}
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>
          After training, the model can generate new text! It works one token at a time:
        </p>
        <ol className="list-none space-y-1 ml-1">
          <li><span className="text-orange-400 font-mono font-bold mr-2">1.</span> Start with a <span className="text-violet-400 font-medium">BOS</span> token</li>
          <li><span className="text-orange-400 font-mono font-bold mr-2">2.</span> Feed it through the model &rarr; get probabilities for next token</li>
          <li><span className="text-orange-400 font-mono font-bold mr-2">3.</span> <span className="text-emerald-400 font-medium">Sample</span> a token from those probabilities</li>
          <li><span className="text-orange-400 font-mono font-bold mr-2">4.</span> Feed the sampled token back in &rarr; get next probabilities</li>
          <li><span className="text-orange-400 font-mono font-bold mr-2">5.</span> Repeat until BOS is generated (end of name) or max length</li>
        </ol>
      </div>

      {/* ── BOS as Stop Signal ─────────────────────────────── */}
      <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
            <span className="text-violet-400 text-xs font-bold font-mono">&empty;</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-400 mb-1.5">BOS as the Stop Signal</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Look at step 5 above: generation stops when the model predicts{' '}
              <span className="text-violet-300 font-mono font-bold">BOS</span> as the next token.
              But wait &mdash; isn&apos;t BOS the <em>start</em> token? How can it also mean &ldquo;stop&rdquo;?
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Remember: during training, BOS wraps each name on <span className="text-violet-300 font-semibold">both sides</span>:{' '}
              <span className="font-mono text-xs text-slate-400">[BOS] e m m a [BOS]</span>.
              So the model learned that BOS after a sequence of characters means{' '}
              <span className="text-emerald-400 font-semibold">&ldquo;this name is complete.&rdquo;</span>
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              During inference, predicting BOS is the model&apos;s way of saying{' '}
              <span className="text-amber-400 font-semibold">&ldquo;I&apos;m done.&rdquo;</span>{' '}
              In the code: <span className="font-mono text-xs text-violet-300">if token_id == BOS: break</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Autoregressive Loop Diagram (SVG) ───────────────── */}
      <div className="viz-card glow-amber flex justify-center">
        <svg width={340} height={200} viewBox="0 0 340 200">
          {/* Circle background */}
          <circle cx={170} cy={100} r={75} fill="none" stroke="var(--svg-grid)" strokeWidth={1.5} strokeDasharray="4 3" />

          {/* Step nodes */}
          {[
            { x: 170, y: 25, label: 'BOS', sub: 'start' },
            { x: 255, y: 60, label: 'Forward', sub: 'pass' },
            { x: 270, y: 140, label: 'Probs', sub: 'softmax' },
            { x: 170, y: 175, label: 'Sample', sub: 'token' },
            { x: 70, y: 140, label: 'Append', sub: 'to seq' },
            { x: 85, y: 60, label: 'Done?', sub: 'BOS=stop' },
          ].map((node, i) => (
            <g key={i}>
              <rect
                x={node.x - 36}
                y={node.y - 16}
                width={72}
                height={32}
                rx={8}
                fill={i === 3 ? 'color-mix(in srgb, var(--accent-emerald) 20%, transparent)' : 'var(--shell-surface)'}
                stroke={i === 3 ? 'var(--accent-emerald)' : 'var(--accent-amber-strong)'}
                strokeWidth={1.5}
              />
              <text x={node.x} y={node.y - 2} textAnchor="middle" fill={i === 3 ? 'var(--accent-emerald)' : 'var(--accent-amber)'} fontSize={11} fontWeight={600} fontFamily="monospace">
                {node.label}
              </text>
              <text x={node.x} y={node.y + 10} textAnchor="middle" fill="var(--svg-muted)" fontSize={9} fontFamily="sans-serif">
                {node.sub}
              </text>
            </g>
          ))}

          {/* Arrows connecting steps */}
          <defs>
            <marker id="arrowOrange" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--accent-amber-strong)" />
            </marker>
          </defs>
          {/* BOS -> Forward */}
          <line x1={206} y1={30} x2={225} y2={48} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          {/* Forward -> Probs */}
          <line x1={265} y1={76} x2={270} y2={118} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          {/* Probs -> Sample */}
          <line x1={245} y1={155} x2={210} y2={170} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          {/* Sample -> Append */}
          <line x1={130} y1={170} x2={110} y2={155} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          {/* Append -> Done? */}
          <line x1={75} y1={118} x2={80} y2={76} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          {/* Done? -> Forward (loop) */}
          <line x1={121} y1={52} x2={215} y2={50} stroke="var(--accent-amber-strong)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" strokeDasharray="5 3" />

          {/* Output arrow from Done? */}
          <line x1={60} y1={48} x2={30} y2={25} stroke="var(--accent-emerald)" strokeWidth={1.5} markerEnd="url(#arrowOrange)" />
          <text x={15} y={18} fill="var(--accent-emerald)" fontSize={10} fontWeight={600} fontFamily="monospace">output</text>
        </svg>
      </div>

      {/* ── KV Cache Explanation ────────────────────────────── */}
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
            <span className="text-indigo-400 text-xs font-bold">K</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-400 mb-1.5">Why the KV Cache?</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Look at the code: the model initializes{' '}
              <span className="font-mono text-indigo-300 text-xs">keys, values = [[] for _ in range(n_layer)]</span>{' '}
              before each name. What is this for?
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              During inference, the model processes <span className="text-indigo-300 font-semibold">one token at a time</span>.
              The KV cache stores the <span className="text-cyan-400 font-medium">key</span> and{' '}
              <span className="text-emerald-400 font-medium">value</span> vectors from all previously generated tokens.
              When generating each new token, the model only needs to compute Q, K, V for the{' '}
              <span className="text-amber-400 font-medium">new token</span>, then attend to the cached K and V from all previous positions.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Without the cache, we&apos;d have to <span className="text-rose-400 font-semibold">re-run the entire sequence</span> through
              the model for every single new token. For a 5-character name, that&apos;s fine. For GPT-4 generating thousands of tokens,
              the cache is what makes generation fast enough to be practical.
            </p>
          </div>
        </div>
      </div>

      {/* ── Temperature Visualization (KEY INTERACTIVE) ─────── */}
      <div className="viz-card glow-emerald">
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
          Temperature Visualization
        </h2>

        {/* Slider */}
        <div className="flex items-center gap-4 mb-4">
          <label className="text-xs text-slate-400 font-mono whitespace-nowrap">
            Temperature
          </label>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.1}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            style={{
              background: `linear-gradient(to right, var(--accent-cyan-strong), var(--accent-emerald) ${((temperature - 0.1) / 1.9) * 100}%, var(--shell-surface) ${((temperature - 0.1) / 1.9) * 100}%)`,
            }}
          />
          <span className="text-sm font-mono text-emerald-400 font-bold w-10 text-right">
            {temperature.toFixed(1)}
          </span>
        </div>

        {/* Bar Chart */}
        <div className="overflow-x-auto pb-1">
          <svg width={chartW} height={chartH} className="bg-slate-900/60 rounded-lg mx-auto block">
            {/* Bars */}
            {tempProbs.map((p, i) => {
              const barHeight = maxProb > 0 ? (p / maxProb) * plotH : 0;
              const x = 10 + i * barW + barPad / 2;
              const y = plotH - barHeight;
              // Color: interpolate from dark teal to bright cyan based on height
              const intensity = maxProb > 0 ? p / maxProb : 0;
              const r = Math.round(6 + intensity * 40);
              const g = Math.round(78 + intensity * 133);
              const b = Math.round(100 + intensity * 112);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(barW - barPad, 1)}
                    height={Math.max(barHeight, 1)}
                    fill={`rgb(${r}, ${g}, ${b})`}
                    rx={2}
                    className="transition-all duration-200"
                  />
                  {/* Probability label on top of tall bars */}
                  {p > 0.05 && (
                    <text
                      x={x + (barW - barPad) / 2}
                      y={y - 3}
                      textAnchor="middle"
                      fill="var(--svg-muted)"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      {(p * 100).toFixed(0)}%
                    </text>
                  )}
                  {/* Character label below */}
                  <text
                    x={x + (barW - barPad) / 2}
                    y={chartH - 3}
                    textAnchor="middle"
                    fill={i === 26 ? 'var(--accent-violet)' : 'var(--svg-label)'}
                    fontSize={9}
                    fontWeight={i === 26 ? 700 : 400}
                    fontFamily="monospace"
                  >
                    {i === 26 ? '\u2205' : CHARS[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Temperature info */}
        <div className="mt-3 space-y-1">
          <p className="text-xs text-slate-400 font-mono">
            Temperature: <span className="text-emerald-400 font-bold">{temperature.toFixed(1)}</span>
          </p>
          <p className="text-xs text-slate-400">
            Effect: <span className="text-cyan-400 font-medium">{tempEffect}</span>
          </p>
        </div>

        {/* Temperature math explanation */}
        <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            How Temperature Actually Works
          </h3>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              Before softmax, each logit is <span className="text-emerald-300 font-semibold">divided</span> by temperature T:
            </p>
            <p className="font-mono text-center text-emerald-400 bg-slate-900/60 rounded px-3 py-2">
              probs = softmax(logits / T)
            </p>
            <p>
              When <span className="text-cyan-400 font-mono font-bold">T &lt; 1</span>, dividing makes the logits <span className="text-cyan-300 font-semibold">larger</span>.
              For example, <span className="font-mono text-slate-400">[2, 1, 0] / 0.5 = [4, 2, 0]</span>.
              The gaps between logits grow, so softmax produces a <span className="text-cyan-300 font-semibold">more peaked</span> distribution &mdash; the top choice dominates.
            </p>
            <p>
              When <span className="text-amber-400 font-mono font-bold">T &gt; 1</span>, dividing makes the logits <span className="text-amber-300 font-semibold">smaller</span>.
              For example, <span className="font-mono text-slate-400">[2, 1, 0] / 2 = [1, 0.5, 0]</span>.
              The gaps shrink, so softmax produces a <span className="text-amber-300 font-semibold">flatter, more uniform</span> distribution.
            </p>
            <p>
              <span className="text-emerald-400 font-mono font-bold">T = 1.0</span> gives the model&apos;s raw learned distribution, unchanged.
              As <span className="font-mono text-slate-400">T &rarr; 0</span>, it approaches <span className="text-violet-400 font-medium">greedy decoding</span> &mdash; always picking the single most likely token.
            </p>
          </div>
        </div>
      </div>

      {/* ── Real Inference ──────────────────────────────────── */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Real Inference
        </h2>
        <InferenceViz />
      </div>

      {/* ── Hallucination Note ──────────────────────────────── */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <span className="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-1.5">Hallucination</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Notice: the model generates names that <span className="text-amber-300 font-semibold">LOOK real</span> but{' '}
              <span className="text-rose-400 font-semibold">DON&apos;T EXIST</span>.{' '}
              They follow English name patterns but were likely never in the training data.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              This is exactly how ChatGPT &lsquo;hallucinates&rsquo;: it generates text that is{' '}
              <span className="text-cyan-400 font-medium">statistically plausible</span> but not necessarily true.
              The model has no concept of truth &mdash; only probability.
            </p>
          </div>
        </div>
      </div>

      {/* ── The Complete Picture ─────────────────────────────── */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
          The Complete Picture
        </h2>

        {/* Pipeline flow diagram */}
        <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
          {[
            { label: 'Tokenize', cls: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' },
            { label: 'Embed', cls: 'bg-amber-500/20 border-amber-400/40 text-amber-400' },
            { label: 'Attend', cls: 'bg-rose-500/20 border-rose-400/40 text-rose-400' },
            { label: 'MLP', cls: 'bg-pink-500/20 border-pink-400/40 text-pink-400' },
            { label: 'Predict', cls: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400' },
            { label: 'Train', cls: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-400' },
            { label: 'Generate', cls: 'bg-orange-500/20 border-orange-400/40 text-orange-400' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${step.cls}`}>
                {step.label}
              </span>
              {i < 6 && <span className="text-slate-600 text-xs">&rarr;</span>}
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          You now understand <span className="text-violet-400 font-semibold">every component</span> of a GPT!
          The same algorithm, scaled up 1,000,000x, powers ChatGPT.
        </p>

        {/* Stats comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* microgpt */}
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              microgpt
            </h4>
            <div className="space-y-1 text-xs text-slate-300 font-mono">
              <p><span className="text-slate-500">params:</span> <span className="text-emerald-400">4,192</span></p>
              <p><span className="text-slate-500">tokens:</span> <span className="text-emerald-400">27</span></p>
              <p><span className="text-slate-500">layers:</span> <span className="text-emerald-400">1</span></p>
              <p><span className="text-slate-500">output:</span> <span className="text-emerald-400">names</span></p>
            </div>
          </div>

          {/* GPT-4 */}
          <div className="rounded-lg border border-violet-400/30 bg-violet-500/5 p-3">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
              GPT-4
            </h4>
            <div className="space-y-1 text-xs text-slate-300 font-mono">
              <p><span className="text-slate-500">params:</span> <span className="text-violet-400">~1.8T</span></p>
              <p><span className="text-slate-500">tokens:</span> <span className="text-violet-400">100K</span></p>
              <p><span className="text-slate-500">layers:</span> <span className="text-violet-400">100+</span></p>
              <p><span className="text-slate-500">output:</span> <span className="text-violet-400">everything</span></p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mt-4 text-center">
          The core algorithm is <span className="text-amber-400 font-bold">IDENTICAL</span>. Only the scale differs.
        </p>
      </div>
    </div>
  );

  /* ── RIGHT CONTENT ───────────────────────────────────────── */

  return <Layout left={leftContent} />;
}
