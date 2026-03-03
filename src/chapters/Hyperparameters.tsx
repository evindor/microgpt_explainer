import { useState, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import { useCodePanel } from '../CodePanelContext';

// Simple seeded pseudo-random for gaussian sampling (Box-Muller)
function gaussianSample(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

export default function Hyperparameters() {
  const [gaussianSamples, setGaussianSamples] = useState<number[]>([]);

  // Bin the gaussian samples into a histogram for display
  const gaussianHistogram = useMemo(() => {
    const bins = 40;
    const min = -0.35;
    const max = 0.35;
    const binWidth = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    for (const s of gaussianSamples) {
      const idx = Math.floor((s - min) / binWidth);
      if (idx >= 0 && idx < bins) counts[idx]++;
    }
    const maxCount = Math.max(...counts, 1);
    return { counts, maxCount, min, max, binWidth, bins };
  }, [gaussianSamples]);

  const handleSampleClick = useCallback(() => {
    const newSamples: number[] = [];
    for (let i = 0; i < 10; i++) {
      newSamples.push(gaussianSample(0, 0.08));
    }
    setGaussianSamples((prev) => [...prev, ...newSamples]);
  }, []);

  const handleResetSamples = useCallback(() => {
    setGaussianSamples([]);
  }, []);
  useCodePanel({
    pyHighlight: [[74, 80]],
    jsHighlight: [[104, 111]],
    title: "Hyperparameters",
    blogExcerpt: "Hyperparameters define the model's structure — they are chosen by the programmer, not learned by training.",
  });


  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 4: Hyperparameters
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          The settings that define the model
        </p>
      </div>

      {/* What are parameters? */}
      <div className="space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          The <span className="text-violet-400 font-medium">parameters</span> are the knowledge of the
          model -- a large collection of floating point numbers that start out random and are iteratively
          updated during training to make the model's predictions better. Each parameter is wrapped in a{' '}
          <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Value</code> object
          for autograd (automatic gradient computation).
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Think of parameters as the <span className="text-amber-400 font-medium">knobs on a giant mixing board</span>.
          Each knob controls how the model processes information. At first, they are set randomly.
          Training adjusts them until the model produces good outputs.
        </p>
      </div>

      {/* Hyperparameters */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Hyperparameters</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          Before we can create parameters, we need <span className="text-violet-400 font-medium">hyperparameters</span> --
          the settings that define the model's structure. These are chosen by the programmer, not learned
          by training.
        </p>
        <div className="space-y-2">
          {[
            { name: 'n_embd = 16', desc: 'Embedding dimension -- how rich each token\'s representation is' },
            { name: 'n_head = 4', desc: 'Attention heads -- how many different patterns to look for simultaneously' },
            { name: 'n_layer = 1', desc: 'Depth -- how many times to repeat the attention + MLP processing' },
            { name: 'block_size = 16', desc: 'Max context length -- how far back the model can look' },
            { name: 'head_dim = 4', desc: 'Derived: n_embd // n_head -- dimension of each attention head' },
          ].map((hp) => (
            <div
              key={hp.name}
              className="flex items-start gap-3 rounded-lg px-3 py-2 bg-slate-800/40 border border-slate-700/30"
            >
              <code className="text-violet-400 bg-slate-900/60 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap flex-shrink-0">
                {hp.name}
              </code>
              <span className="text-xs text-slate-400 leading-relaxed">{hp.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The matrix() Function */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">The matrix() Function</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          The code defines a tiny helper: <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">matrix = lambda nout, nin: [[Value(gauss(0, 0.08)) for _ in range(nin)] for _ in range(nout)]</code>
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          This one-liner creates a <span className="text-amber-400 font-medium">2D grid</span> of <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">nout x nin</code> random numbers, each wrapped in a <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Value</code> object for automatic gradient tracking. The random numbers come from a Gaussian (bell curve) distribution.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Why random? If all parameters started at the same value, every neuron would compute the same thing — they'd never <span className="text-violet-400 font-medium">differentiate</span>. Small random values <span className="text-emerald-400 font-medium">break symmetry</span>, giving each neuron a unique starting point so they can learn different features.
        </p>
      </div>

      {/* Gaussian Initialization */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Gaussian Initialization</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          Parameters start as random numbers drawn from a{' '}
          <span className="text-violet-400 font-medium">bell curve</span> (Gaussian distribution) with
          mean <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">0</code> and
          standard deviation <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">0.08</code>.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Small random numbers -- not zeros (that would make everything identical) and not large
          (that would cause instability).
        </p>
      </div>

      {/* Visualization: Gaussian Initialization */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">
          Gaussian Initialization
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Click "Sample" to draw random parameter values. Watch the bell curve emerge.
        </p>

        {/* Histogram */}
        <div className="relative bg-slate-900/60 rounded-lg border border-slate-700/30 p-3">
          {/* Y axis label */}
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-slate-600 tracking-wider">
            COUNT
          </div>

          {/* Bars */}
          <div className="flex justify-center gap-px h-32 ml-3">
            {gaussianHistogram.counts.map((count, i) => {
              const height = gaussianHistogram.maxCount > 0 ? (count / gaussianHistogram.maxCount) * 100 : 0;
              const binCenter = gaussianHistogram.min + (i + 0.5) * gaussianHistogram.binWidth;
              const isCenter = Math.abs(binCenter) < 0.02;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`${binCenter.toFixed(3)}: ${count} samples`}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isCenter ? 'bg-violet-400' : 'bg-violet-400/60'
                    }`}
                    style={{ height: `${Math.max(height, count > 0 ? 2 : 0)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X axis */}
          <div className="flex justify-between ml-3 mt-1 text-[9px] font-mono text-slate-600">
            <span>-0.35</span>
            <span>0</span>
            <span>0.35</span>
          </div>
        </div>

        {/* Controls and info */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleSampleClick}
            className="text-xs px-4 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-300 hover:bg-violet-500/30 transition-all cursor-pointer"
          >
            Sample 10 Parameters
          </button>
          {gaussianSamples.length > 0 && (
            <button
              onClick={handleResetSamples}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              Reset
            </button>
          )}
          <span className="text-xs text-slate-500 ml-auto">
            <span className="text-violet-400 font-mono font-semibold">{gaussianSamples.length}</span> samples
          </span>
        </div>

        {/* Recent samples display */}
        {gaussianSamples.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 max-h-[60px] overflow-hidden">
            {gaussianSamples.slice(-20).map((s, i) => (
              <span
                key={`${i}-${s}`}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-400/20 text-violet-300"
                style={{ animation: `fadeIn 0.3s ease-out ${i * 0.03}s both` }}
              >
                {s.toFixed(4)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return <Layout left={leftContent} />;
}
