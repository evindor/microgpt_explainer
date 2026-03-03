import { useState } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ------------------------------------------------------------------ */
/*  ReLU Visualization                                                 */
/* ------------------------------------------------------------------ */
function ReLUVisualization() {
  const [xVal, setXVal] = useState(0.5);
  const reluOut = Math.max(0, xVal);
  const gradient = xVal > 0 ? 1 : 0;

  // SVG coordinate system
  const W = 400;
  const H = 250;
  const pad = { top: 20, right: 30, bottom: 30, left: 40 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // data range: x [-3, 3], y [0, 3]
  const xMin = -3, xMax = 3, yMin = -0.5, yMax = 3;
  const toSvgX = (v: number) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (v: number) => pad.top + ((yMax - v) / (yMax - yMin)) * plotH;

  // ReLU curve points
  const negPoints = Array.from({ length: 61 }, (_, i) => {
    const x = -3 + i * 0.05;
    return `${toSvgX(x)},${toSvgY(0)}`;
  }).join(' ');
  const posPoints = Array.from({ length: 61 }, (_, i) => {
    const x = i * 0.05;
    return `${toSvgX(x)},${toSvgY(x)}`;
  }).join(' ');

  // shaded negative region
  const negFill = `M${toSvgX(-3)},${toSvgY(0)} L${toSvgX(0)},${toSvgY(0)} L${toSvgX(0)},${toSvgY(yMin)} L${toSvgX(-3)},${toSvgY(yMin)} Z`;

  // shaded positive region (under curve)
  const posFill = `M${toSvgX(0)},${toSvgY(0)} L${toSvgX(3)},${toSvgY(0)} L${toSvgX(3)},${toSvgY(yMin)} L${toSvgX(0)},${toSvgY(yMin)} Z`;

  const dotX = toSvgX(xVal);
  const dotY = toSvgY(reluOut);

  return (
    <div className="viz-card glow-emerald">
      <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">
        ReLU Interactive Visualization
      </h3>

      <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`}>
        {/* Negative region shading */}
        <path d={negFill} fill="rgba(244, 63, 94, 0.08)" />
        {/* Positive region shading */}
        <path d={posFill} fill="rgba(52, 211, 153, 0.08)" />

        {/* Grid lines */}
        {[-2, -1, 0, 1, 2, 3].map(v => (
          <line key={`gx-${v}`} x1={toSvgX(v)} y1={toSvgY(yMax)} x2={toSvgX(v)} y2={toSvgY(yMin)}
            stroke="#334155" strokeWidth={v === 0 ? 1.5 : 0.5} strokeDasharray={v === 0 ? '' : '4,4'} />
        ))}
        {[0, 1, 2, 3].map(v => (
          <line key={`gy-${v}`} x1={toSvgX(xMin)} y1={toSvgY(v)} x2={toSvgX(xMax)} y2={toSvgY(v)}
            stroke="#334155" strokeWidth={v === 0 ? 1.5 : 0.5} strokeDasharray={v === 0 ? '' : '4,4'} />
        ))}

        {/* Axis labels */}
        {[-3, -2, -1, 0, 1, 2, 3].map(v => (
          <text key={`lx-${v}`} x={toSvgX(v)} y={toSvgY(yMin) + 16} textAnchor="middle"
            className="fill-slate-500 text-[10px]">{v}</text>
        ))}
        {[1, 2, 3].map(v => (
          <text key={`ly-${v}`} x={toSvgX(xMin) - 8} y={toSvgY(v) + 4} textAnchor="end"
            className="fill-slate-500 text-[10px]">{v}</text>
        ))}

        {/* ReLU curve: negative portion (red) */}
        <polyline points={negPoints} fill="none" stroke="#fb7185" strokeWidth={2.5} />
        {/* ReLU curve: positive portion (green) */}
        <polyline points={posPoints} fill="none" stroke="#34d399" strokeWidth={2.5} />

        {/* Dashed line from dot to axes */}
        <line x1={dotX} y1={dotY} x2={dotX} y2={toSvgY(0)}
          stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.5} />
        <line x1={dotX} y1={dotY} x2={toSvgX(0)} y2={dotY}
          stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.5} />

        {/* Interactive dot */}
        <circle cx={dotX} cy={dotY} r={6}
          fill={xVal >= 0 ? '#34d399' : '#fb7185'}
          stroke="#fff" strokeWidth={2} className="drop-shadow-lg" />

        {/* Labels */}
        <text x={toSvgX(-1.5)} y={toSvgY(2.5)} textAnchor="middle"
          className="fill-rose-400/60 text-[10px] font-semibold">DEAD ZONE</text>
        <text x={toSvgX(1.5)} y={toSvgY(2.5)} textAnchor="middle"
          className="fill-emerald-400/60 text-[10px] font-semibold">PASS-THROUGH</text>
      </svg>

      {/* Slider */}
      <div className="mt-3 px-2">
        <label className="text-xs text-slate-400 block mb-1">Input x</label>
        <input type="range" min={-3} max={3} step={0.01} value={xVal}
          onChange={e => setXVal(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-lg" />
      </div>

      {/* Readouts */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/60 rounded-lg px-3 py-2">
          <span className="text-slate-400">Input: </span>
          <span className="text-slate-100 font-mono">x = {xVal.toFixed(2)}</span>
        </div>
        <div className="bg-slate-800/60 rounded-lg px-3 py-2">
          <span className="text-slate-400">Output: </span>
          <span className={`font-mono ${reluOut > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ReLU(x) = {reluOut.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-2 bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
        <span className="text-slate-400">Gradient: </span>
        <span className={`font-mono font-semibold ${gradient === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {gradient}
        </span>
        <span className="text-slate-500 text-xs ml-2">
          ({xVal > 0 ? 'signal passes through' : 'neuron is "dead" here'})
        </span>
      </div>

      <p className="text-slate-400 text-sm mt-4 leading-relaxed">
        ReLU is dead simple: negative numbers become 0, positive numbers pass through unchanged.
        This non-linearity is what gives neural networks their power — without it, stacking layers
        would be useless (a chain of linear transforms is still linear).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Residual Connection Diagram                                        */
/* ------------------------------------------------------------------ */
function ResidualDiagram() {
  const W = 380;
  const H = 220;

  return (
    <div className="viz-card glow-cyan">
      <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">
        Residual (Skip) Connection
      </h3>

      <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`}>
        {/* Input label */}
        <text x={40} y={115} textAnchor="middle" className="fill-slate-300 text-xs font-semibold">
          Input x
        </text>

        {/* Input arrow to split point */}
        <line x1={70} y1={110} x2={110} y2={110} stroke="#94a3b8" strokeWidth={2}
          markerEnd="url(#arrowGray)" />

        {/* Split circle */}
        <circle cx={120} cy={110} r={8} fill="none" stroke="#60a5fa" strokeWidth={2} />

        {/* Upper path: skip connection */}
        <path d="M 128 110 L 128 50 L 280 50 L 280 110"
          fill="none" stroke="#22d3ee" strokeWidth={2} strokeDasharray="6,4" />
        <text x={200} y={40} textAnchor="middle" className="fill-cyan-400 text-[10px] font-semibold">
          SKIP CONNECTION (identity)
        </text>

        {/* Lower path: through block */}
        <line x1={128} y1={110} x2={155} y2={110} stroke="#94a3b8" strokeWidth={2} />

        {/* Block box */}
        <rect x={155} y={85} width={100} height={50} rx={8}
          fill="rgba(139, 92, 246, 0.15)" stroke="#a78bfa" strokeWidth={1.5} />
        <text x={205} y={107} textAnchor="middle" className="fill-violet-400 text-[11px] font-semibold">
          Attention
        </text>
        <text x={205} y={122} textAnchor="middle" className="fill-violet-400 text-[11px] font-semibold">
          or MLP
        </text>

        {/* Block output arrow */}
        <line x1={255} y1={110} x2={272} y2={110} stroke="#94a3b8" strokeWidth={2} />

        {/* Add circle */}
        <circle cx={280} cy={110} r={14} fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth={2} />
        <text x={280} y={115} textAnchor="middle" className="fill-emerald-400 text-sm font-bold">+</text>

        {/* Output arrow */}
        <line x1={294} y1={110} x2={340} y2={110} stroke="#94a3b8" strokeWidth={2}
          markerEnd="url(#arrowGray)" />

        {/* Output label */}
        <text x={350} y={115} textAnchor="start" className="fill-slate-300 text-xs font-semibold">
          Output
        </text>

        {/* Formula */}
        <text x={190} y={185} textAnchor="middle" className="fill-slate-300 text-xs font-mono">
          output = x + block(x)
        </text>
        <text x={190} y={205} textAnchor="middle" className="fill-slate-500 text-[10px]">
          If block learns nothing, output = x (safe!)
        </text>

        {/* Arrow marker */}
        <defs>
          <marker id="arrowGray" viewBox="0 0 10 7" refX={9} refY={3.5}
            markerWidth={8} markerHeight={6} orient="auto-start-auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>

      <p className="text-slate-400 text-sm mt-3 leading-relaxed">
        Residual connections are like safety nets. If a layer hasn't learned anything useful yet,
        the input can "skip" straight through. This makes deep networks much easier to train.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Chapter Component                                             */
/* ------------------------------------------------------------------ */
export default function MLP() {
  const leftContent = (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 10: MLP &amp; Norms
        </h2>
        <p className="text-slate-400 text-sm">The thinking stage of the transformer</p>
        <p className="text-slate-300 leading-relaxed text-sm mt-3">
          We introduced RMSNorm and softmax in Chapter 7. Now let's see how the MLP combines with these
          building blocks in the transformer.
        </p>
      </div>

      {/* MLP Explanation */}
      <div className="viz-card glow-amber">
        <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-3">
          The MLP (Feed-Forward) Block
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          After attention gathers context, the MLP processes it. Think of attention as
          "gathering information from friends" and the MLP as "thinking about what you've gathered."
        </p>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          The MLP expands the 16-dim vector to 64 dimensions (4x), applies ReLU, then projects back to 16.
        </p>

        {/* MLP dimension diagram */}
        <div className="flex items-center justify-center gap-1 flex-wrap py-3">
          <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg px-3 py-2 text-center">
            <div className="text-blue-400 font-mono text-sm font-bold">16-dim</div>
            <div className="text-slate-500 text-[10px]">input</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
            <defs>
              <marker id="arrMlp" viewBox="0 0 10 7" refX={9} refY={3.5}
                markerWidth={7} markerHeight={5} orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>
          </svg>
          <div className="bg-amber-500/20 border border-amber-400/40 rounded px-2 py-1.5">
            <div className="text-amber-400 text-[10px] font-semibold">EXPAND</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
          </svg>
          <div className="bg-violet-500/20 border border-violet-400/40 rounded-lg px-3 py-2 text-center">
            <div className="text-violet-400 font-mono text-sm font-bold">64-dim</div>
            <div className="text-slate-500 text-[10px]">hidden</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
          </svg>
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded px-2 py-1.5">
            <div className="text-emerald-400 text-[10px] font-semibold">ReLU</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
          </svg>
          <div className="bg-violet-500/20 border border-violet-400/40 rounded-lg px-3 py-2 text-center">
            <div className="text-violet-400 font-mono text-sm font-bold">64-dim</div>
            <div className="text-slate-500 text-[10px]">activated</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
          </svg>
          <div className="bg-rose-500/20 border border-rose-400/40 rounded px-2 py-1.5">
            <div className="text-rose-400 text-[10px] font-semibold">SHRINK</div>
          </div>
          <svg width="30" height="20" viewBox="0 0 30 20">
            <path d="M2 10 L22 10" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrMlp)" />
          </svg>
          <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg px-3 py-2 text-center">
            <div className="text-blue-400 font-mono text-sm font-bold">16-dim</div>
            <div className="text-slate-500 text-[10px]">output</div>
          </div>
        </div>
      </div>

      {/* ReLU Visualization */}
      <ReLUVisualization />

      {/* Residual Connections Diagram */}
      <ResidualDiagram />

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-400/20 rounded-xl p-5">
        <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-2">
          Key Insight
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          Each transformer layer does:{' '}
          <span className="text-violet-400 font-semibold">Normalize</span>{' '}
          <span className="text-slate-500">-&gt;</span>{' '}
          <span className="text-amber-400 font-semibold">Attend</span>{' '}
          <span className="text-slate-500">-&gt;</span>{' '}
          <span className="text-emerald-400 font-semibold">Add residual</span>{' '}
          <span className="text-slate-500">-&gt;</span>{' '}
          <span className="text-violet-400 font-semibold">Normalize</span>{' '}
          <span className="text-slate-500">-&gt;</span>{' '}
          <span className="text-cyan-400 font-semibold">MLP</span>{' '}
          <span className="text-slate-500">-&gt;</span>{' '}
          <span className="text-emerald-400 font-semibold">Add residual</span>.
          {' '}The normalize stabilizes, attention gathers context, MLP processes it,
          and residuals ensure information flows.
        </p>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      pyHighlight={[[135, 141]]}
      jsHighlight={[[172, 178]]}
      title="MLP & Norms"
      blogExcerpt="The MLP block is a feed-forward computation. RMSNorm rescales vectors for stable training. Residual connections enable gradient flow and trainability."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
