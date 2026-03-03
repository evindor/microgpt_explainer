import { useState } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ------------------------------------------------------------------ */
/*  Softmax Interactive Visualization                                  */
/* ------------------------------------------------------------------ */

function SoftmaxVisualization() {
  const [logits, setLogits] = useState([2.0, 1.0, 0.1, -1.0]);

  // Step 1: find max
  const maxVal = Math.max(...logits);

  // Step 2: subtract max & exponentiate
  const exps = logits.map(x => Math.exp(x - maxVal));

  // Step 3: sum exponentials
  const expSum = exps.reduce((a, b) => a + b, 0);

  // Step 4: divide to normalize
  const probs = exps.map(e => e / expSum);

  // Shared scale for bar charts
  const maxAbs = Math.max(
    ...logits.map(Math.abs),
    ...probs.map(Math.abs),
    0.1
  );

  const barH = 20;
  const barMaxW = 120;

  function BarChart({ data, label, color, symmetric }: { data: number[]; label: string; color: string; symmetric?: boolean }) {
    return (
      <div className="flex-1">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
        <div className="space-y-1.5">
          {data.map((v, i) => {
            const scale = symmetric ? maxAbs : 1;
            const w = (Math.abs(v) / scale) * barMaxW;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono w-5">x{i + 1}</span>
                <div className="relative" style={{ width: barMaxW, height: barH }}>
                  {/* zero line */}
                  {symmetric && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />}
                  {/* bar */}
                  <div
                    className="absolute top-0.5 rounded-sm transition-all duration-300"
                    style={{
                      height: barH - 4,
                      width: symmetric ? w / 2 : w,
                      left: symmetric
                        ? (v >= 0 ? '50%' : `calc(50% - ${w / 2}px)`)
                        : 0,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-12 text-right">{v.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="viz-card glow-amber">
      <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-3">
        Softmax Interactive Visualization
      </h3>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        {logits.map((v, i) => (
          <div key={i}>
            <label className="text-xs text-slate-400">
              x<sub>{i + 1}</sub> = <span className="font-mono text-slate-200">{v.toFixed(2)}</span>
            </label>
            <input type="range" min={-5} max={5} step={0.01} value={v}
              onChange={e => {
                const next = [...logits];
                next[i] = parseFloat(e.target.value);
                setLogits(next);
              }}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg" />
          </div>
        ))}
      </div>

      {/* Step-by-step computation */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-sm font-mono mb-4">
        <div className="text-slate-400">
          <span className="text-amber-400 font-semibold">1.</span>{' '}
          Find max value:{' '}
          <span className="text-slate-200">
            max = <span className="text-amber-400">{maxVal.toFixed(2)}</span>
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-amber-400 font-semibold">2.</span>{' '}
          Subtract max &amp; exponentiate:{' '}
          <span className="text-slate-200">
            exp(x<sub>i</sub> - max) = [{exps.map(e => e.toFixed(4)).join(', ')}]
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-amber-400 font-semibold">3.</span>{' '}
          Sum exponentials:{' '}
          <span className="text-slate-200">
            sum = <span className="text-amber-400">{expSum.toFixed(4)}</span>
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-amber-400 font-semibold">4.</span>{' '}
          Divide to normalize:{' '}
          <span className="text-emerald-400">
            [{probs.map(p => p.toFixed(4)).join(', ')}]
          </span>
          <span className="text-slate-500 text-xs ml-2">(these sum to 1.0)</span>
        </div>
      </div>

      {/* Bar charts side by side */}
      <div className="flex gap-4">
        <BarChart data={logits} label="Before (raw logits)" color="#fbbf24" symmetric />
        <BarChart data={probs} label="After (probabilities)" color="#34d399" />
      </div>

      <p className="text-slate-400 text-sm mt-4 leading-relaxed">
        Softmax converts any list of numbers into a probability distribution — numbers between
        0 and 1 that sum to 1. Subtracting the max first prevents numerical overflow without
        changing the result.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RMSNorm Interactive Visualization                                  */
/* ------------------------------------------------------------------ */

function RMSNormVisualization() {
  const [values, setValues] = useState([1.5, -0.8, 2.1, -1.2]);
  const eps = 1e-5;

  const squares = values.map(v => v * v);
  const meanSq = squares.reduce((a, b) => a + b, 0) / values.length;
  const rms = Math.sqrt(meanSq + eps);
  const scale = 1 / rms;
  const output = values.map(v => v * scale);

  const maxAbs = Math.max(
    ...values.map(Math.abs),
    ...output.map(Math.abs),
    0.1
  );

  const barH = 20;
  const barMaxW = 120;

  function BarChart({ data, label, color }: { data: number[]; label: string; color: string }) {
    return (
      <div className="flex-1">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
        <div className="space-y-1.5">
          {data.map((v, i) => {
            const w = (Math.abs(v) / maxAbs) * barMaxW;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono w-5">x{i + 1}</span>
                <div className="relative" style={{ width: barMaxW, height: barH }}>
                  {/* zero line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                  {/* bar */}
                  <div
                    className="absolute top-0.5 rounded-sm transition-all duration-300"
                    style={{
                      height: barH - 4,
                      width: w / 2,
                      left: v >= 0 ? '50%' : `calc(50% - ${w / 2}px)`,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-12 text-right">{v.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="viz-card glow-violet">
      <h3 className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-3">
        RMSNorm Interactive Visualization
      </h3>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        {values.map((v, i) => (
          <div key={i}>
            <label className="text-xs text-slate-400">
              x<sub>{i + 1}</sub> = <span className="font-mono text-slate-200">{v.toFixed(2)}</span>
            </label>
            <input type="range" min={-3} max={3} step={0.01} value={v}
              onChange={e => {
                const next = [...values];
                next[i] = parseFloat(e.target.value);
                setValues(next);
              }}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow-lg" />
          </div>
        ))}
      </div>

      {/* Step-by-step computation */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-sm font-mono mb-4">
        <div className="text-slate-400">
          <span className="text-violet-400 font-semibold">1.</span>{' '}
          Square each:{' '}
          <span className="text-slate-200">
            [{squares.map(s => s.toFixed(2)).join(', ')}]
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-violet-400 font-semibold">2.</span>{' '}
          Mean of squares:{' '}
          <span className="text-slate-200">
            ({squares.map(s => s.toFixed(2)).join(' + ')}) / 4 ={' '}
            <span className="text-amber-400">{meanSq.toFixed(4)}</span>
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-violet-400 font-semibold">3.</span>{' '}
          RMS = sqrt(mean + eps) ={' '}
          <span className="text-amber-400">{rms.toFixed(4)}</span>
        </div>
        <div className="text-slate-400">
          <span className="text-violet-400 font-semibold">4.</span>{' '}
          Scale = 1 / RMS ={' '}
          <span className="text-amber-400">{scale.toFixed(4)}</span>
        </div>
        <div className="text-slate-400">
          <span className="text-violet-400 font-semibold">5.</span>{' '}
          Output:{' '}
          <span className="text-emerald-400">
            [{output.map(o => o.toFixed(2)).join(', ')}]
          </span>
        </div>
      </div>

      {/* Bar charts side by side */}
      <div className="flex gap-4">
        <BarChart data={values} label="Before (input)" color="#a78bfa" />
        <BarChart data={output} label="After (normalized)" color="#34d399" />
      </div>

      <p className="text-slate-400 text-sm mt-4 leading-relaxed">
        RMSNorm keeps vectors from growing too large or too small. Without it, values would
        explode or vanish as they pass through many layers.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chapter 7: Softmax & RMSNorm                                       */
/* ------------------------------------------------------------------ */

export default function SoftmaxNorm() {
  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 7: Softmax &amp; RMSNorm
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          Functions that tame numbers
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          Neural networks process numbers through many operations, and without careful handling,
          values can <span className="text-rose-400 font-medium">explode to infinity</span> or{' '}
          <span className="text-rose-400 font-medium">vanish to zero</span>. Two small but
          critical functions keep everything under control.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          <span className="text-amber-400 font-medium">Softmax</span> converts raw scores into
          probabilities — it is used in the attention mechanism (to decide how much each token
          should attend to every other token) and at the final prediction step (to pick the
          next token).
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          <span className="text-violet-400 font-medium">RMSNorm</span> keeps vectors at a
          consistent scale — it is applied before both the attention and MLP blocks to prevent
          values from drifting too far from a healthy range during training.
        </p>
      </div>

      {/* Softmax Visualization */}
      <SoftmaxVisualization />

      {/* RMSNorm Visualization */}
      <RMSNormVisualization />
    </div>
  );

  const rightContent = (
    <CodePanel
      pyHighlight={[[97, 106]]}
      jsHighlight={[[130, 141]]}
      title="Softmax & RMSNorm"
      blogExcerpt="Softmax converts logits to probabilities. RMSNorm rescales vectors for stable training. Both are essential for keeping numbers well-behaved."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
