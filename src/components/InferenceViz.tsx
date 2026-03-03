import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useModel } from '../contexts/ModelContext.tsx';
import { generateName } from '../lib/inference.ts';
import { UCHARS, VOCAB_SIZE } from '../lib/microgpt-types.ts';
import type { InferenceStepData } from '../lib/microgpt-types.ts';
import type { ChapterNav } from '../ChapterNavContext.ts';
import { ChapterNavContext } from '../ChapterNavContext.ts';
import { useContext } from 'react';

type Mode = 'auto' | 'manual';

export default function InferenceViz() {
  const model = useModel();
  const nav = useContext(ChapterNavContext) as ChapterNav;
  const [temperature, setTemperature] = useState(0.5);
  const [mode, setMode] = useState<Mode>('auto');
  const [steps, setSteps] = useState<InferenceStepData[]>([]);
  const [viewIdx, setViewIdx] = useState(-1); // -1 = not started, 0..n = viewing step
  const [isRunning, setIsRunning] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const seedRef = useRef(42);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatorRef = useRef<Generator<InferenceStepData> | null>(null);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startGeneration = useCallback(() => {
    if (!model.weights) return;
    // Reset
    if (timerRef.current) clearTimeout(timerRef.current);
    setSteps([]);
    setViewIdx(0);
    setIsRunning(true);

    seedRef.current = Math.floor(Math.random() * 100000);
    const gen = generateName(model.weights, temperature, seedRef.current);
    generatorRef.current = gen;

    // Collect all steps eagerly (inference is sub-ms per token)
    const allSteps: InferenceStepData[] = [];
    for (const step of gen) {
      allSteps.push(step);
    }
    setSteps(allSteps);

    if (mode === 'auto') {
      // Auto-advance through steps
      let idx = 0;
      const advance = () => {
        if (idx < allSteps.length) {
          setViewIdx(idx);
          idx++;
          timerRef.current = setTimeout(advance, 600);
        } else {
          setIsRunning(false);
          // Build name from steps
          const name = allSteps
            .filter(s => s.sampledChar !== 'BOS')
            .map(s => s.sampledChar)
            .join('');
          if (name) setGeneratedNames(prev => [...prev, name]);
        }
      };
      advance();
    } else {
      // Manual: start at step 0
      setViewIdx(0);
      setIsRunning(false);
    }
  }, [model.weights, temperature, mode]);

  const goToStep = useCallback((dir: 'prev' | 'next') => {
    setViewIdx(prev => {
      const next = dir === 'prev' ? prev - 1 : prev + 1;
      if (next < 0) return 0;
      if (next >= steps.length) {
        // Finished
        const name = steps
          .filter(s => s.sampledChar !== 'BOS')
          .map(s => s.sampledChar)
          .join('');
        if (name && !generatedNames.includes(name)) {
          setGeneratedNames(prev => [...prev, name]);
        }
        return steps.length - 1;
      }
      return next;
    });
  }, [steps, generatedNames]);

  const currentStep = viewIdx >= 0 && viewIdx < steps.length ? steps[viewIdx] : null;

  // Build the token sequence up to current view
  const tokenSequence = useMemo(() => {
    if (!steps.length || viewIdx < 0) return [];
    const seq: string[] = ['BOS'];
    for (let i = 0; i <= Math.min(viewIdx, steps.length - 1); i++) {
      seq.push(steps[i].sampledChar);
    }
    return seq;
  }, [steps, viewIdx]);

  /* ── Not trained yet ───────────────────────────────────── */
  if (!model.isModelReady) {
    return (
      <div className="bg-slate-900/40 rounded-lg p-6 text-center space-y-3">
        <p className="text-sm text-slate-400">
          No trained weights found. Train the model first to run real inference.
        </p>
        <button
          onClick={nav.onPrev}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/20 transition-all"
        >
          Go to Training
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Temperature slider */}
        <label className="text-xs text-slate-400 font-mono whitespace-nowrap">Temp</label>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={temperature}
          onChange={e => setTemperature(parseFloat(e.target.value))}
          className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          style={{
            background: `linear-gradient(to right, var(--accent-cyan-strong), var(--accent-emerald) ${((temperature - 0.1) / 1.9) * 100}%, var(--shell-surface) ${((temperature - 0.1) / 1.9) * 100}%)`,
          }}
        />
        <span className="text-xs font-mono text-emerald-400 font-bold w-8">{temperature.toFixed(1)}</span>

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
          <button
            onClick={() => setMode('auto')}
            className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
              mode === 'auto' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
              mode === 'manual' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            Step
          </button>
        </div>

        <button
          onClick={startGeneration}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isRunning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/20'
          }`}
        >
          {isRunning ? 'Generating...' : 'Generate Name'}
        </button>

        {mode === 'manual' && steps.length > 0 && !isRunning && (
          <div className="flex gap-1">
            <button
              onClick={() => goToStep('prev')}
              disabled={viewIdx <= 0}
              className="px-2 py-1 rounded text-xs font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => goToStep('next')}
              disabled={viewIdx >= steps.length - 1}
              className="px-2 py-1 rounded text-xs font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Token sequence */}
      {tokenSequence.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center min-h-[36px]">
          {tokenSequence.map((tok, i) => {
            const isCurrent = i === viewIdx + 1; // +1 because BOS is at index 0
            const isBos = tok === 'BOS';
            return (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-600 text-xs">&rarr;</span>}
                <span
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
                    isBos
                      ? 'bg-violet-500/20 border border-violet-400/50 text-violet-300'
                      : isCurrent
                        ? 'bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 ring-1 ring-emerald-400/50'
                        : 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  }`}
                  style={{ animation: isCurrent ? 'fadeIn 0.3s ease-out' : undefined }}
                >
                  {isBos ? '[BOS]' : tok}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step detail panel */}
      {currentStep && (
        <div className="bg-slate-900/60 rounded-lg p-4 space-y-4" style={{ animation: 'fadeIn 0.25s ease-out' }}>
          <div className="text-xs text-slate-500 font-mono">
            Step {viewIdx + 1}/{steps.length}: input &lsquo;
            <span className="text-cyan-400">{currentStep.inputChar}</span>&rsquo; &rarr; predicted &lsquo;
            <span className="text-emerald-400">{currentStep.sampledChar}</span>&rsquo;
          </div>

          {/* Attention heatmaps */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
              Attention (4 heads)
            </h4>
            <div className="flex gap-2 flex-wrap">
              {currentStep.attentionWeights.map((headWeights, h) => (
                <AttentionHead key={h} headIdx={h} weights={headWeights} tokens={tokenSequence.slice(0, viewIdx + 2)} />
              ))}
            </div>
          </div>

          {/* MLP activations */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
              MLP Activations (64 neurons)
            </h4>
            <MLPBar activations={currentStep.mlpActivation} />
          </div>

          {/* Probability distribution */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
              Output Probabilities (27 tokens)
            </h4>
            <ProbBars probs={currentStep.probs} sampledIdx={currentStep.sampledToken} />
          </div>
        </div>
      )}

      {/* Generated names list */}
      {generatedNames.length > 0 && (
        <div className="text-xs text-slate-400">
          Generated: {generatedNames.map((name, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <span className="text-emerald-400 font-mono font-bold">{name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function AttentionHead({ headIdx, weights, tokens }: { headIdx: number; weights: number[]; tokens: string[] }) {
  const cellSize = 16;
  const labelW = 28;
  const seqLen = weights.length;
  const w = labelW + seqLen * cellSize;
  const h = cellSize + 14; // one row for current token attending to all previous

  return (
    <div className="bg-slate-800/50 rounded p-1.5">
      <div className="text-[9px] text-slate-500 font-mono mb-1 text-center">H{headIdx + 1}</div>
      <svg width={w} height={h} className="block">
        {/* Column labels (tokens attended to) */}
        {tokens.slice(0, seqLen).map((tok, j) => (
          <text
            key={`col-${j}`}
            x={labelW + j * cellSize + cellSize / 2}
            y={10}
            textAnchor="middle"
            fill="var(--svg-label)"
            fontSize={7}
            fontFamily="monospace"
          >
            {tok === 'BOS' || tok === '[BOS]' ? '\u2205' : tok}
          </text>
        ))}
        {/* Attention weight cells */}
        {weights.map((w, j) => {
          const intensity = Math.min(1, w * 2); // scale for visibility
          const r = Math.round(6 + intensity * 94);
          const g = Math.round(182 + intensity * 73);
          const b = Math.round(212 + intensity * 43);
          return (
            <rect
              key={j}
              x={labelW + j * cellSize + 1}
              y={14}
              width={cellSize - 2}
              height={cellSize - 2}
              rx={2}
              fill={`rgb(${r}, ${g}, ${b})`}
              opacity={0.3 + intensity * 0.7}
            />
          );
        })}
      </svg>
    </div>
  );
}

function MLPBar({ activations }: { activations: number[] }) {
  const maxAbs = Math.max(...activations.map(Math.abs), 0.01);
  return (
    <div className="flex gap-[1px] items-end h-8">
      {activations.map((val, i) => {
        const relu = Math.max(0, val);
        const height = (relu / maxAbs) * 100;
        const fired = relu > 0;
        return (
          <div
            key={i}
            className="flex-1 min-w-[2px] rounded-t-sm transition-all duration-150"
            style={{
              height: `${Math.max(height, 2)}%`,
              backgroundColor: fired
                ? `rgba(52, 211, 153, ${0.3 + (relu / maxAbs) * 0.7})`
                : 'rgba(100, 116, 139, 0.2)',
            }}
          />
        );
      })}
    </div>
  );
}

function ProbBars({ probs, sampledIdx }: { probs: number[]; sampledIdx: number }) {
  const maxProb = Math.max(...probs);
  const chartW = 460;
  const chartH = 80;
  const barW = chartW / VOCAB_SIZE;
  const labelH = 14;
  const plotH = chartH - labelH - 4;

  return (
    <svg width={chartW} height={chartH} className="bg-slate-900/40 rounded block">
      {probs.map((p, i) => {
        const barHeight = maxProb > 0 ? (p / maxProb) * plotH : 0;
        const x = i * barW + 1;
        const y = plotH - barHeight;
        const isSampled = i === sampledIdx;
        const intensity = maxProb > 0 ? p / maxProb : 0;
        const r = isSampled ? Math.round(52 + intensity * 100) : Math.round(6 + intensity * 40);
        const g = isSampled ? Math.round(211 + intensity * 44) : Math.round(78 + intensity * 133);
        const b = isSampled ? Math.round(153 + intensity * 50) : Math.round(100 + intensity * 112);

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={Math.max(barW - 2, 1)}
              height={Math.max(barHeight, 0.5)}
              fill={`rgb(${r}, ${g}, ${b})`}
              rx={1}
              strokeWidth={isSampled ? 1 : 0}
              stroke={isSampled ? 'var(--accent-emerald)' : 'none'}
            />
            {/* Probability on top of tall bars */}
            {p > 0.08 && (
              <text
                x={x + (barW - 2) / 2}
                y={y - 2}
                textAnchor="middle"
                fill="var(--svg-muted)"
                fontSize={7}
                fontFamily="monospace"
              >
                {(p * 100).toFixed(0)}%
              </text>
            )}
            {/* Char label */}
            <text
              x={x + (barW - 2) / 2}
              y={chartH - 2}
              textAnchor="middle"
              fill={isSampled ? 'var(--accent-emerald)' : i === 26 ? 'var(--accent-violet)' : 'var(--svg-label)'}
              fontSize={7}
              fontWeight={isSampled ? 700 : 400}
              fontFamily="monospace"
            >
              {i === 26 ? '\u2205' : UCHARS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
