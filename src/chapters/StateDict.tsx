import { useState } from 'react';
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

const colorMap: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', text: 'text-cyan-300', fill: 'bg-cyan-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-400/50', text: 'text-amber-300', fill: 'bg-amber-400' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-400/50', text: 'text-violet-300', fill: 'bg-violet-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/50', text: 'text-emerald-300', fill: 'bg-emerald-400' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-400/50', text: 'text-rose-300', fill: 'bg-rose-400' },
};

export default function StateDict() {
  const [hoveredMatrix, setHoveredMatrix] = useState<number>(0);

  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 6: State Dict
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          Where the model stores its knowledge
        </p>
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
                  style={{ width: `${pct}%`, opacity: !isHovered ? 0.4 : 0.85 }}
                  onMouseEnter={() => setHoveredMatrix(i)}
                />
              );
            })}
          </div>

          {/* Detail box — always visible */}
          <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-600/40 text-sm">
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
      pyHighlight={[[81, 90]]}
      jsHighlight={[[112, 122]]}
      title="State Dict"
      blogExcerpt="Parameters are organized into named matrices stored in a Python dictionary called state_dict. Each matrix has a specific job in the model."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
