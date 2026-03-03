import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/** Generate fake training loss data */
const lossData = Array.from({ length: 100 }, (_, i) => ({
  step: i * 10,
  loss: 3.3 * Math.exp(-i * 0.015) + 2.37 * (1 - Math.exp(-i * 0.015)) + (Math.random() - 0.5) * 0.1,
}));

const PIPELINE_STEPS = [
  { num: 1, title: 'Pick a name', detail: 'e.g., "emma"', sub: 'BOS, e, m, m, a, BOS', color: 'violet' },
  { num: 2, title: 'Forward Pass', detail: 'Feed through GPT', sub: 'Get predictions', color: 'cyan' },
  { num: 3, title: 'Compute Loss', detail: 'Cross-entropy', sub: 'How wrong were we?', color: 'amber' },
  { num: 4, title: 'Backward Pass', detail: 'Compute gradients', sub: 'Blame assignment', color: 'rose' },
  { num: 5, title: 'Update Params', detail: 'Adam optimizer', sub: 'Reduce the loss', color: 'emerald' },
] as const;

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  violet: { bg: 'bg-violet-500/15', border: 'border-violet-400/50', text: 'text-violet-300', glow: 'shadow-violet-500/10' },
  cyan: { bg: 'bg-cyan-500/15', border: 'border-cyan-400/50', text: 'text-cyan-300', glow: 'shadow-cyan-500/10' },
  amber: { bg: 'bg-amber-500/15', border: 'border-amber-400/50', text: 'text-amber-300', glow: 'shadow-amber-500/10' },
  rose: { bg: 'bg-rose-500/15', border: 'border-rose-400/50', text: 'text-rose-300', glow: 'shadow-rose-500/10' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/50', text: 'text-emerald-300', glow: 'shadow-emerald-500/10' },
};

const codeString = `# Training hyperparameters
learning_rate = 0.01
beta1, beta2, eps_adam = 0.85, 0.99, 1e-8
m = [0.0] * len(params)  # momentum buffer
v = [0.0] * len(params)  # velocity buffer
num_steps = 1000

for step in range(num_steps):

    # 1. Pick a document, tokenize it
    doc = docs[step % len(docs)]
    tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS]

    # 2. Forward pass: predict each next token
    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]
    losses = []
    for pos_id in range(n):
        token_id = tokens[pos_id]
        target_id = tokens[pos_id + 1]  # what comes next
        logits = gpt(token_id, pos_id, keys, values)
        probs = softmax(logits)
        # 3. Cross-entropy loss
        loss_t = -probs[target_id].log()
        losses.append(loss_t)
    loss = (1/n) * sum(losses)

    # 4. Backward pass: compute all gradients
    loss.backward()

    # 5. Adam optimizer: update parameters
    lr_t = learning_rate * (1 - step/num_steps)
    for i, p in enumerate(params):
        m[i] = beta1*m[i] + (1-beta1)*p.grad
        v[i] = beta2*v[i] + (1-beta2)*p.grad**2
        m_hat = m[i] / (1 - beta1**(step+1))
        v_hat = v[i] / (1 - beta2**(step+1))
        p.data -= lr_t * m_hat / (v_hat**0.5 + eps_adam)
        p.grad = 0  # reset for next step`;

/** Generate bar chart data for 27 tokens (a-z + BOS) */
function generateProbBars(correctIdx: number, pCorrect: number): { label: string; prob: number; isCorrect: boolean }[] {
  const remaining = 1 - pCorrect;
  const bars: { label: string; prob: number; isCorrect: boolean }[] = [];
  // Distribute remaining probability across other 26 tokens with some noise
  const others: number[] = [];
  for (let i = 0; i < 27; i++) {
    if (i === correctIdx) continue;
    others.push(Math.random() + 0.1);
  }
  const othersSum = others.reduce((a, b) => a + b, 0);

  let otherIdx = 0;
  for (let i = 0; i < 27; i++) {
    const label = i < 26 ? String.fromCharCode(97 + i) : 'BOS';
    if (i === correctIdx) {
      bars.push({ label, prob: pCorrect, isCorrect: true });
    } else {
      bars.push({ label, prob: remaining * (others[otherIdx] / othersSum), isCorrect: false });
      otherIdx++;
    }
  }
  return bars;
}

export default function Training() {
  const [pCorrect, setPCorrect] = useState(0.3);
  const [ballPos, setBallPos] = useState(0);

  // Adam optimizer ball animation
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.008;
      if (t > 1) t = 0;
      setBallPos(t);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const lossValue = -Math.log(pCorrect);
  const correctTokenIdx = 12; // 'm' is the correct next token after 'e'

  const probBars = useMemo(
    () => generateProbBars(correctTokenIdx, pCorrect),
    [pCorrect]
  );

  // SVG cross-entropy curve points
  const curvePath = useMemo(() => {
    const points: string[] = [];
    for (let px = 1; px <= 500; px++) {
      const prob = px / 500;
      const loss = -Math.log(prob);
      const y = 200 - (loss / 5) * 180;
      points.push(`${px},${Math.max(10, y)}`);
    }
    return `M${points.join(' L')}`;
  }, []);

  // Ball position on Adam loss landscape
  const ballX = 50 + ballPos * 400;
  const ballY = 180 - 140 * (1 - (ballPos - 0.8) * (ballPos - 0.8) / 0.64);
  // Parabola path for loss landscape
  const parabolaPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = 50 + t * 400;
      const y = 180 - 140 * (1 - (t - 0.8) * (t - 0.8) / 0.64);
      pts.push(`${x},${y}`);
    }
    return `M${pts.join(' L')}`;
  }, []);

  const leftContent = (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 7: Training
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          Teaching the model through repetition
        </p>
      </div>

      {/* Training Loop Overview */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Training Loop Pipeline
        </h2>
        <div className="flex flex-wrap items-center gap-1">
          {PIPELINE_STEPS.map((step, i) => {
            const c = COLOR_MAP[step.color];
            return (
              <div key={step.num} className="flex items-center">
                <div
                  className={`rounded-lg border ${c.bg} ${c.border} px-3 py-2.5 min-w-[110px] shadow-sm ${c.glow} transition-all duration-300`}
                  style={{ animation: `fadeIn 0.4s ease-out ${i * 0.1}s both` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold ${c.text} bg-slate-900/50 rounded-full w-5 h-5 flex items-center justify-center`}>
                      {step.num}
                    </span>
                    <span className={`text-xs font-semibold ${c.text}`}>{step.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{step.detail}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{step.sub}</p>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="text-slate-500 mx-1 text-lg font-light select-none">&rarr;</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-slate-500 font-mono bg-slate-900/40 rounded px-3 py-1.5">
          Repeat 1000 times &mdash; the model learns by adjusting weights each step
        </div>
      </div>

      {/* Cross-Entropy Loss */}
      <div className="viz-card glow-amber">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
          Cross-Entropy Loss Explained
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          The model outputs a probability for each possible next token. We want the probability
          of the <span className="text-amber-400 font-medium">correct</span> next token to be high.
          For example, after <code className="text-cyan-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">e</code>,
          the correct next character in &quot;emma&quot; is <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">m</code>.
        </p>

        {/* Probability bar chart */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-2">
            Predicted probabilities (27 tokens) &mdash; correct token: <span className="text-amber-400">m</span>
          </h3>
          <div className="flex items-end gap-[2px] h-24 bg-slate-900/60 rounded-lg p-2 overflow-hidden">
            {probBars.map((bar) => (
              <div key={bar.label} className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    bar.isCorrect
                      ? 'bg-amber-400'
                      : 'bg-slate-600/60'
                  }`}
                  style={{ height: `${bar.prob * 100 * 2}%`, minHeight: '1px' }}
                />
                <span
                  className={`text-[7px] mt-0.5 font-mono ${
                    bar.isCorrect ? 'text-amber-400 font-bold' : 'text-slate-600'
                  }`}
                >
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive slider */}
        <div className="bg-slate-900/60 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">
              P(correct) = <span className="text-amber-400 font-mono font-bold">{pCorrect.toFixed(2)}</span>
            </label>
            <span className="text-xs text-slate-400">
              loss = -log({pCorrect.toFixed(2)}) ={' '}
              <span className="text-rose-400 font-mono font-bold">{lossValue.toFixed(2)}</span>
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.99"
            step="0.01"
            value={pCorrect}
            onChange={(e) => setPCorrect(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.01 (very wrong)</span>
            <span>0.99 (very right)</span>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5">
              <p className="text-[10px] text-rose-400 font-semibold mb-0.5">High loss (bad)</p>
              <p className="text-xs text-slate-300 font-mono">
                P = 0.01 &rarr; loss = <span className="text-rose-400 font-bold">4.61</span>
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-2.5">
              <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Low loss (good)</p>
              <p className="text-xs text-slate-300 font-mono">
                P = 0.70 &rarr; loss = <span className="text-emerald-400 font-bold">0.36</span>
              </p>
            </div>
          </div>
        </div>

        {/* SVG loss curve */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-2">
            Loss = -log(P) curve
          </h3>
          <svg viewBox="0 0 540 230" className="w-full max-w-[500px]" style={{ height: 200 }}>
            {/* Grid */}
            <line x1="40" y1="10" x2="40" y2="200" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="200" x2="520" y2="200" stroke="#334155" strokeWidth="1" />
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
              <g key={v}>
                <line
                  x1={40 + v * 480}
                  y1="10"
                  x2={40 + v * 480}
                  y2="200"
                  stroke="#1e293b"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                />
                <text x={40 + v * 480} y="215" fill="#64748b" fontSize="9" textAnchor="middle">
                  {v.toFixed(1)}
                </text>
              </g>
            ))}
            {[1, 2, 3, 4].map((v) => (
              <g key={v}>
                <line
                  x1="40"
                  y1={200 - (v / 5) * 180}
                  x2="520"
                  y2={200 - (v / 5) * 180}
                  stroke="#1e293b"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                />
                <text x="32" y={200 - (v / 5) * 180 + 3} fill="#64748b" fontSize="9" textAnchor="end">
                  {v}
                </text>
              </g>
            ))}
            {/* Axis labels */}
            <text x="280" y="228" fill="#94a3b8" fontSize="10" textAnchor="middle">
              Probability
            </text>
            <text x="12" y="110" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90, 12, 110)">
              Loss
            </text>
            {/* Curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              transform="translate(40, 0)"
              opacity="0.8"
            />
            {/* Current point */}
            <circle
              cx={40 + pCorrect * 480}
              cy={Math.max(10, 200 - (lossValue / 5) * 180)}
              r="5"
              fill="#fbbf24"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Dashed lines to axes */}
            <line
              x1={40 + pCorrect * 480}
              y1={Math.max(10, 200 - (lossValue / 5) * 180)}
              x2={40 + pCorrect * 480}
              y2="200"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <line
              x1="40"
              y1={Math.max(10, 200 - (lossValue / 5) * 180)}
              x2={40 + pCorrect * 480}
              y2={Math.max(10, 200 - (lossValue / 5) * 180)}
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Training Loss Curve (Recharts) */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
          Training Loss Curve
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Over 1000 training steps, the loss decreases from random guessing to a model that
          predicts plausible next characters.
        </p>
        <div className="bg-slate-900/60 rounded-lg p-4 relative">
          {/* Annotations */}
          <div className="absolute top-6 left-16 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50 z-10">
            Random guessing: ~3.3
          </div>
          <div className="absolute bottom-10 right-8 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50 z-10">
            After training: ~2.37
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lossData} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="step"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                label={{ value: 'Step', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                domain={[2.0, 3.6]}
                label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                }}
                labelFormatter={(val) => `Step ${val}`}
                formatter={(val: number | undefined) => [(val ?? 0).toFixed(3), 'Loss']}
              />
              <Line
                type="monotone"
                dataKey="loss"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Adam Optimizer */}
      <div className="viz-card glow-emerald">
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          Adam Optimizer Simplified
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Adam is a smart way to update parameters. Instead of taking the same step size every
          time, it:
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2.5 bg-slate-900/40 rounded-lg px-3 py-2">
            <span className="text-emerald-400 font-bold text-xs mt-0.5 bg-emerald-500/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-medium">Keeps a running average of gradients</span> (momentum)
                &mdash; like rolling a ball downhill
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-900/40 rounded-lg px-3 py-2">
            <span className="text-emerald-400 font-bold text-xs mt-0.5 bg-emerald-500/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-medium">Adapts step size per parameter</span> &mdash; parameters
                with big gradients get smaller steps
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-900/40 rounded-lg px-3 py-2">
            <span className="text-emerald-400 font-bold text-xs mt-0.5 bg-emerald-500/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-medium">Learning rate decays over time</span> &mdash; take big
                steps early, small steps later
              </p>
            </div>
          </div>
        </div>

        {/* Loss landscape SVG with animated ball */}
        <div className="bg-slate-900/60 rounded-lg p-3">
          <h3 className="text-xs text-slate-500 mb-2 font-medium">Loss landscape (ball rolling to minimum)</h3>
          <svg viewBox="0 0 500 210" className="w-full" style={{ height: 160 }}>
            {/* Axes */}
            <line x1="40" y1="190" x2="460" y2="190" stroke="#334155" strokeWidth="1" />
            <text x="250" y="207" fill="#64748b" fontSize="9" textAnchor="middle">Parameters</text>
            <text x="18" y="100" fill="#64748b" fontSize="9" textAnchor="middle" transform="rotate(-90, 18, 100)">Loss</text>
            {/* Parabola */}
            <path d={parabolaPath} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.6" />
            {/* Shaded area under curve */}
            <path
              d={`${parabolaPath} L450,190 L50,190 Z`}
              fill="url(#lossGradient)"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Minimum marker */}
            <line x1={50 + 0.8 * 400} y1="40" x2={50 + 0.8 * 400} y2="190" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={50 + 0.8 * 400} y="35" fill="#64748b" fontSize="8" textAnchor="middle">minimum</text>
            {/* Animated ball */}
            <circle
              cx={ballX}
              cy={ballY}
              r="6"
              fill="#fbbf24"
              stroke="#1e293b"
              strokeWidth="2"
            >
              <animate attributeName="opacity" values="1;0.8;1" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Trail dots */}
            {[0, 0.15, 0.3, 0.45, 0.6].map((t, idx) => {
              if (t >= ballPos) return null;
              const tx = 50 + t * 400;
              const ty = 180 - 140 * (1 - (t - 0.8) * (t - 0.8) / 0.64);
              return (
                <circle
                  key={idx}
                  cx={tx}
                  cy={ty}
                  r="2"
                  fill="#fbbf24"
                  opacity={0.2 + idx * 0.1}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Key Insight */}
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-1.5">Key Insight</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Training is just: <span className="text-cyan-400 font-medium">predict</span> &rarr;{' '}
              <span className="text-amber-400 font-medium">measure error</span> &rarr;{' '}
              <span className="text-rose-400 font-medium">figure out blame</span> &rarr;{' '}
              <span className="text-emerald-400 font-medium">adjust</span>. Repeat 1000 times.
              The model goes from random guessing (every letter equally likely) to generating
              plausible names. The loss dropping from{' '}
              <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">3.3</code> to{' '}
              <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">2.37</code> means
              the model is getting exponentially better at predicting the next character.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      code={codeString}
      title="microgpt.py — Training Loop"
      blogExcerpt="Loss decreases from approximately 3.3 (random guessing) to 2.37 during training."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
