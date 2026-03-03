import { useState, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

// Parameter matrix definitions for the breakdown visualization
const PARAM_MATRICES: { name: string; label: string; rows: number; cols: number; color: string }[] = [
  { name: 'wte', label: 'Token Embeddings', rows: 27, cols: 16, color: 'cyan' },
  { name: 'wpe', label: 'Position Embeddings', rows: 16, cols: 16, color: 'amber' },
  { name: 'layer0.attn_wq', label: 'Query Projection', rows: 16, cols: 16, color: 'violet' },
  { name: 'layer0.attn_wk', label: 'Key Projection', rows: 16, cols: 16, color: 'violet' },
  { name: 'layer0.attn_wv', label: 'Value Projection', rows: 16, cols: 16, color: 'violet' },
  { name: 'layer0.attn_wo', label: 'Output Projection', rows: 16, cols: 16, color: 'violet' },
  { name: 'layer0.mlp_fc1', label: 'MLP Expand', rows: 64, cols: 16, color: 'emerald' },
  { name: 'layer0.mlp_fc2', label: 'MLP Shrink', rows: 16, cols: 64, color: 'emerald' },
  { name: 'lm_head', label: 'Output Projection', rows: 27, cols: 16, color: 'rose' },
];

const TOTAL_PARAMS = PARAM_MATRICES.reduce((sum, m) => sum + m.rows * m.cols, 0);

// Scale comparison data
const SCALE_MODELS: { name: string; params: number; label: string; color: string }[] = [
  { name: 'microgpt', params: 4192, label: '4,192', color: 'cyan' },
  { name: 'GPT-2', params: 1_600_000_000, label: '1.6B', color: 'amber' },
  { name: 'GPT-3', params: 175_000_000_000, label: '175B', color: 'violet' },
  { name: 'GPT-4', params: 1_800_000_000_000, label: '~1.8T', color: 'rose' },
];

// Simple seeded pseudo-random for gaussian sampling (Box-Muller)
function gaussianSample(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

const colorMap: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', text: 'text-cyan-300', fill: 'bg-cyan-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-400/50', text: 'text-amber-300', fill: 'bg-amber-400' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-400/50', text: 'text-violet-300', fill: 'bg-violet-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/50', text: 'text-emerald-300', fill: 'bg-emerald-400' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-400/50', text: 'text-rose-300', fill: 'bg-rose-400' },
};

const codeString = `# Initialize the parameters, to store the knowledge of the model
n_layer = 1     # depth of the transformer neural network (number of layers)
n_embd = 16     # width of the network (embedding dimension)
block_size = 16 # maximum context length of the attention window
n_head = 4      # number of attention heads
head_dim = n_embd // n_head # derived dimension of each head
matrix = lambda nout, nin, std=0.08: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]
state_dict = {'wte': matrix(vocab_size, n_embd), 'wpe': matrix(block_size, n_embd), 'lm_head': matrix(vocab_size, n_embd)}
for i in range(n_layer):
    state_dict[f'layer{i}.attn_wq'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wk'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wv'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wo'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.mlp_fc1'] = matrix(4 * n_embd, n_embd)
    state_dict[f'layer{i}.mlp_fc2'] = matrix(n_embd, 4 * n_embd)
params = [p for mat in state_dict.values() for row in mat for p in row]
print(f"num params: {len(params)}")`;

export default function Parameters() {
  const [hoveredMatrix, setHoveredMatrix] = useState<number | null>(null);
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

  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 6: Parameters
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          The knowledge of the model
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

      {/* Visualization A: Parameter Breakdown */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">
          Parameter Breakdown
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          How {TOTAL_PARAMS.toLocaleString()} parameters are distributed across the model's matrices. Hover for details.
        </p>

        {/* Stacked horizontal bar */}
        <div className="relative">
          <div className="flex rounded-lg overflow-hidden h-10 border border-slate-700/40">
            {PARAM_MATRICES.map((mat, i) => {
              const count = mat.rows * mat.cols;
              const pct = (count / TOTAL_PARAMS) * 100;
              const colors = colorMap[mat.color];
              const isHovered = hoveredMatrix === i;
              return (
                <div
                  key={mat.name}
                  className={`relative transition-all duration-200 cursor-pointer ${colors.fill} ${
                    isHovered ? 'brightness-125 z-10' : 'brightness-75'
                  }`}
                  style={{ width: `${pct}%`, opacity: hoveredMatrix !== null && !isHovered ? 0.4 : 0.85 }}
                  onMouseEnter={() => setHoveredMatrix(i)}
                  onMouseLeave={() => setHoveredMatrix(null)}
                />
              );
            })}
          </div>

          {/* Hover tooltip */}
          {hoveredMatrix !== null && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-600/40 text-sm animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold font-mono text-xs ${colorMap[PARAM_MATRICES[hoveredMatrix].color].text}`}>
                  {PARAM_MATRICES[hoveredMatrix].name}
                </span>
                <span className="text-slate-400 text-xs">
                  {PARAM_MATRICES[hoveredMatrix].label}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Dimensions:{' '}
                <span className="text-slate-200 font-mono">
                  {PARAM_MATRICES[hoveredMatrix].rows} x {PARAM_MATRICES[hoveredMatrix].cols}
                </span>
                {' = '}
                <span className="text-amber-400 font-mono font-semibold">
                  {(PARAM_MATRICES[hoveredMatrix].rows * PARAM_MATRICES[hoveredMatrix].cols).toLocaleString()}
                </span>
                {' params'}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {PARAM_MATRICES.map((mat, i) => {
            const count = mat.rows * mat.cols;
            const colors = colorMap[mat.color];
            return (
              <div
                key={mat.name}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-all duration-200 cursor-pointer border ${
                  hoveredMatrix === i
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-slate-800/30 border-transparent hover:border-slate-600/30'
                }`}
                onMouseEnter={() => setHoveredMatrix(i)}
                onMouseLeave={() => setHoveredMatrix(null)}
              >
                <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${colors.fill}`} style={{ opacity: 0.85 }} />
                <span className="font-mono text-slate-400 truncate">{mat.name}</span>
                <span className={`ml-auto font-mono ${colors.text} flex-shrink-0`}>{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Total Parameters</span>
          <span className="text-lg font-bold font-mono text-violet-400">{TOTAL_PARAMS.toLocaleString()}</span>
        </div>
      </div>

      {/* The state_dict */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">The state_dict</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          Parameters are organized into named <span className="text-cyan-400 font-medium">matrices</span> (2D
          arrays of numbers), stored in a Python dictionary called{' '}
          <code className="text-violet-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">state_dict</code>.
          Each matrix has a specific job in the model. A{' '}
          <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">matrix(nout, nin)</code>{' '}
          call creates a grid of <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">nout x nin</code>{' '}
          random{' '}
          <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Value</code> objects.
        </p>
      </div>

      {/* Visualization B: Scale Comparison */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">
          Scale Comparison
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          The same transformer architecture at vastly different scales. Note the logarithmic scale.
        </p>

        <div className="space-y-3">
          {SCALE_MODELS.map((model) => {
            // Log scale: map log10(params) to bar width
            const logMin = Math.log10(4192);
            const logMax = Math.log10(1_800_000_000_000);
            const logVal = Math.log10(model.params);
            const pct = ((logVal - logMin) / (logMax - logMin)) * 100;
            const colors = colorMap[model.color];
            return (
              <div key={model.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${colors.text}`}>{model.name}</span>
                  <span className="text-xs font-mono text-slate-400">{model.label}</span>
                </div>
                <div className="h-6 rounded bg-slate-800/60 border border-slate-700/30 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-700 ${colors.fill}`}
                    style={{ width: `${Math.max(pct, 2)}%`, opacity: 0.75 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center italic">
          The architecture is the same. The scale is different.
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

      {/* Visualization C: Gaussian Initialization */}
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
          <div className="flex items-end justify-center gap-px h-32 ml-3">
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

      {/* Key Insight Box */}
      <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
            <span className="text-violet-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-400 mb-1.5">Key Insight</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every "fact" a language model knows, every pattern it recognizes, every grammar rule it
              follows -- all of it is encoded in these floating point numbers. When people say "the model
              learned to code" or "the model knows history", what they really mean is: training found
              parameter values where the math happens to produce those outputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      code={codeString}
      title="microgpt.py -- Parameters"
      blogExcerpt="Parameters are the knowledge of the model — a large collection of floating point numbers that start out random and are iteratively updated during training to make the model's predictions better."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
