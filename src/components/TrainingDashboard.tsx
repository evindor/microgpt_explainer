import { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useModel } from '../contexts/ModelContext.tsx';
import type { WorkerMessage } from '../lib/microgpt-types.ts';

interface LossPoint {
  step: number;
  loss: number;
}

const NUM_STEPS = 1000;
const RANDOM_BASELINE = Math.log(27); // ~3.30

type TrainState = 'idle' | 'loading' | 'training' | 'paused' | 'done';

export default function TrainingDashboard() {
  const model = useModel();
  const [state, setState] = useState<TrainState>(model.isModelReady ? 'done' : 'idle');
  const [lossData, setLossData] = useState<LossPoint[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [currentLr, setCurrentLr] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const docsRef = useRef<string[] | null>(null);

  // Persist latest loss for 'done' message
  const lastLossRef = useRef(0);

  const getWorker = useCallback((): Worker | null => {
    return model.workerRef.current;
  }, [model.workerRef]);

  const createWorker = useCallback((): Worker => {
    if (model.workerRef.current) {
      model.workerRef.current.terminate();
    }
    const w = new Worker(
      new URL('../workers/microgpt-worker.ts', import.meta.url),
      { type: 'module' }
    );
    model.workerRef.current = w;
    return w;
  }, [model.workerRef]);

  // Handle worker messages
  const attachListener = useCallback((worker: Worker) => {
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'init-done':
          // Start training after init
          worker.postMessage({ type: 'start', numSteps: NUM_STEPS });
          setState('training');
          break;
        case 'progress': {
          setCurrentStep(msg.step);
          setCurrentLoss(msg.loss);
          setCurrentLr(msg.lr);
          setElapsedMs(msg.elapsedMs);
          lastLossRef.current = msg.loss;
          // Append to chart data (thin out to every 5 steps for perf)
          if (msg.step % 5 === 0 || msg.step === msg.totalSteps) {
            setLossData(prev => [...prev, { step: msg.step, loss: parseFloat(msg.loss.toFixed(4)) }]);
          }
          break;
        }
        case 'done':
          setState('done');
          model.storeWeights(msg.weights, {
            finalLoss: lastLossRef.current,
            steps: msg.totalSteps,
            date: new Date().toISOString(),
            elapsedMs: msg.elapsedMs,
          });
          break;
        case 'stopped':
          setState('idle');
          break;
        case 'error':
          setError(msg.message);
          setState('idle');
          break;
      }
    };
  }, [model]);

  // If worker already exists and is training (survived chapter navigation), re-attach listener
  useEffect(() => {
    const existing = getWorker();
    if (existing && (state === 'idle' && !model.isModelReady)) {
      // Check if there's already an active worker by trying to listen
      // We can't truly know if it's active, so we just set up the listener
    }
  }, [getWorker, state, model.isModelReady]);

  const startTraining = useCallback(async () => {
    setError(null);
    setLossData([]);
    setCurrentStep(0);
    setCurrentLoss(0);
    setState('loading');

    try {
      // Fetch names.txt
      if (!docsRef.current) {
        const resp = await fetch('/names.txt');
        const text = await resp.text();
        docsRef.current = text.split('\n').filter(l => l.trim());
      }

      const worker = createWorker();
      attachListener(worker);
      worker.postMessage({ type: 'init', docs: docsRef.current });
    } catch (err) {
      setError(String(err));
      setState('idle');
    }
  }, [createWorker, attachListener]);

  const pause = useCallback(() => {
    getWorker()?.postMessage({ type: 'pause' });
    setState('paused');
  }, [getWorker]);

  const resume = useCallback(() => {
    getWorker()?.postMessage({ type: 'resume' });
    setState('training');
  }, [getWorker]);

  const stop = useCallback(() => {
    getWorker()?.postMessage({ type: 'stop' });
  }, [getWorker]);

  const retrain = useCallback(() => {
    model.clearModel();
    setState('idle');
    setLossData([]);
    setCurrentStep(0);
  }, [model]);

  // Progress percentage
  const pct = NUM_STEPS > 0 ? (currentStep / NUM_STEPS) * 100 : 0;

  // ETA
  const eta = currentStep > 0 && state === 'training'
    ? ((elapsedMs / currentStep) * (NUM_STEPS - currentStep)) / 1000
    : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {state === 'idle' && (
          <button
            onClick={startTraining}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-cyan-400 hover:to-indigo-400 shadow-lg shadow-cyan-500/20 transition-all"
          >
            Start Training
          </button>
        )}
        {state === 'loading' && (
          <span className="text-sm text-slate-400 animate-pulse">Loading dataset...</span>
        )}
        {state === 'training' && (
          <>
            <button
              onClick={pause}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition-all"
            >
              Pause
            </button>
            <button
              onClick={stop}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition-all"
            >
              Stop
            </button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button
              onClick={resume}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 transition-all"
            >
              Resume
            </button>
            <button
              onClick={stop}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition-all"
            >
              Stop
            </button>
            <span className="text-xs text-amber-400 font-mono">PAUSED</span>
          </>
        )}
        {state === 'done' && (
          <button
            onClick={retrain}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-600/50 transition-all"
          >
            Retrain
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Progress bar & stats */}
      {(state === 'training' || state === 'paused') && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Step <span className="text-cyan-400 font-bold">{currentStep}</span>/{NUM_STEPS}</span>
            <span>Loss <span className="text-amber-400 font-bold">{currentLoss.toFixed(4)}</span></span>
            <span>LR <span className="text-slate-300">{currentLr.toFixed(5)}</span></span>
            <span>{(elapsedMs / 1000).toFixed(1)}s</span>
            {eta > 0 && <span className="text-slate-500">ETA ~{eta.toFixed(0)}s</span>}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Done banner */}
      {state === 'done' && model.meta && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2 text-xs">
          <span className="text-emerald-400 font-bold">Training complete!</span>
          <span className="text-slate-400">
            Loss: <span className="text-emerald-300 font-mono">{model.meta.finalLoss.toFixed(4)}</span>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            {model.meta.steps} steps in {(model.meta.elapsedMs / 1000).toFixed(1)}s
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-500 text-[10px]">Weights saved for inference</span>
        </div>
      )}

      {/* Loss chart */}
      {lossData.length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-4 relative">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lossData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--svg-grid)" />
              <XAxis
                dataKey="step"
                stroke="var(--svg-label)"
                fontSize={10}
                tickLine={false}
                label={{ value: 'Step', position: 'insideBottomRight', offset: -5, fill: 'var(--svg-label)', fontSize: 10 }}
              />
              <YAxis
                stroke="var(--svg-label)"
                fontSize={10}
                tickLine={false}
                domain={[2.0, 4.0]}
                label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: 'var(--svg-label)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--shell-bg)',
                  border: '1px solid var(--svg-grid)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--shell-text-bright)',
                }}
                labelFormatter={(val) => `Step ${val}`}
                formatter={(val: number | undefined) => [(val ?? 0).toFixed(4), 'Loss']}
              />
              <ReferenceLine
                y={RANDOM_BASELINE}
                stroke="var(--accent-amber)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Random baseline: ${RANDOM_BASELINE.toFixed(2)}`,
                  position: 'insideTopRight',
                  fill: 'var(--accent-amber)',
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="loss"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent-cyan)', stroke: 'var(--shell-bg)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Idle state with no data: show what training will do */}
      {state === 'idle' && lossData.length === 0 && !model.isModelReady && (
        <div className="bg-slate-900/40 rounded-lg p-4 text-center space-y-2">
          <p className="text-sm text-slate-400">
            Click <span className="text-cyan-400 font-semibold">Start Training</span> to train the 4,192-parameter model live in your browser.
          </p>
          <p className="text-xs text-slate-500">
            Training runs in a Web Worker and won&apos;t freeze the page. ~1-5 steps/second depending on your device.
          </p>
        </div>
      )}
    </div>
  );
}
