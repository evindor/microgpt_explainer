import { useState } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ------------------------------------------------------------------ */
/*  Node positions for the computation graph                          */
/* ------------------------------------------------------------------ */
const NODES = {
  a:     { x: 80,  y: 80,  label: 'a', type: 'value' as const },
  b:     { x: 80,  y: 220, label: 'b', type: 'value' as const },
  c:     { x: 80,  y: 360, label: 'c', type: 'value' as const },
  mul:   { x: 250, y: 150, label: '\u00d7', type: 'op' as const },
  add:   { x: 400, y: 250, label: '+', type: 'op' as const },
  sq:    { x: 530, y: 250, label: 'x\u00b2', type: 'op' as const },
  loss:  { x: 620, y: 250, label: 'loss', type: 'value' as const },
};

const EDGES: [keyof typeof NODES, keyof typeof NODES][] = [
  ['a', 'mul'],
  ['b', 'mul'],
  ['mul', 'add'],
  ['c', 'add'],
  ['add', 'sq'],
  ['sq', 'loss'],
];

/* ------------------------------------------------------------------ */
/*  Step descriptions                                                 */
/* ------------------------------------------------------------------ */
const FORWARD_STEPS = [
  { desc: 'Inputs ready: a = 2, b = 3, c = 1', active: ['a', 'b', 'c'], values: {} as Record<string, string> },
  { desc: 'a \u00d7 b = 2 \u00d7 3 = 6', active: ['a', 'b', 'mul'], values: { mul: '6' } },
  { desc: '(a\u00d7b) + c = 6 + 1 = 7', active: ['mul', 'c', 'add'], values: { mul: '6', add: '7' } },
  { desc: '(a\u00d7b + c)\u00b2 = 7\u00b2 = 49', active: ['add', 'sq', 'loss'], values: { mul: '6', add: '7', sq: '49', loss: '49' } },
];

const BACKWARD_STEPS = [
  { desc: 'Seed: \u2202loss/\u2202loss = 1', grads: { loss: '1' } as Record<string, string>, active: ['loss'] },
  { desc: 'd(x\u00b2)/dx = 2x = 2\u00d77 = 14  \u2192  grad flows to + node', grads: { loss: '1', sq: '14', add: '14' }, active: ['loss', 'sq', 'add'] },
  { desc: '+ distributes grad equally: mul gets 14, c gets 14', grads: { loss: '1', sq: '14', add: '14', mul: '14', c: '14' }, active: ['add', 'mul', 'c'] },
  { desc: '\u00d7 node: \u2202/\u2202a = b\u00d714 = 42,  \u2202/\u2202b = a\u00d714 = 28', grads: { loss: '1', sq: '14', add: '14', mul: '14', c: '14', a: '42', b: '28' }, active: ['mul', 'a', 'b'] },
];

/* ------------------------------------------------------------------ */
/*  Static value mapping for display inside nodes                     */
/* ------------------------------------------------------------------ */
const BASE_VALUES: Record<string, string> = {
  a: '2', b: '3', c: '1',
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function Autograd() {
  const [mode, setMode] = useState<'idle' | 'forward' | 'backward'>('idle');
  const [currentStep, setCurrentStep] = useState(0);

  /* derived state -------------------------------------------------- */
  const steps = mode === 'forward' ? FORWARD_STEPS : mode === 'backward' ? BACKWARD_STEPS : [];
  const step = steps[currentStep] as (typeof FORWARD_STEPS)[number] & (typeof BACKWARD_STEPS)[number] | undefined;
  const activeSet = new Set(step?.active ?? []);
  const displayValues: Record<string, string> = { ...BASE_VALUES, ...(mode === 'forward' ? step?.values ?? {} : {}) };
  // In backward mode, keep all forward values visible
  if (mode === 'backward') {
    Object.assign(displayValues, FORWARD_STEPS[FORWARD_STEPS.length - 1].values);
  }
  const grads: Record<string, string> = (mode === 'backward' ? step?.grads : {}) ?? {};

  const maxStep = steps.length - 1;

  /* handlers ------------------------------------------------------- */
  const startForward = () => { setMode('forward'); setCurrentStep(0); };
  const startBackward = () => { setMode('backward'); setCurrentStep(0); };
  const nextStep = () => { if (currentStep < maxStep) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  /* Which edges should be lit ------------------------------------- */
  const litEdges = new Set<string>();
  if (step) {
    for (const [src, dst] of EDGES) {
      if (mode === 'forward' && activeSet.has(src) && activeSet.has(dst)) litEdges.add(`${src}-${dst}`);
      if (mode === 'backward' && activeSet.has(src) && activeSet.has(dst)) litEdges.add(`${src}-${dst}`);
    }
  }

  /* Visible nodes (in forward mode, only show nodes up to current) */
  const visibleNodes = new Set<string>();
  if (mode === 'idle') {
    Object.keys(NODES).forEach(k => visibleNodes.add(k));
  } else if (mode === 'forward') {
    for (let i = 0; i <= currentStep; i++) {
      FORWARD_STEPS[i].active.forEach(k => visibleNodes.add(k));
    }
  } else {
    Object.keys(NODES).forEach(k => visibleNodes.add(k));
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */
  const renderNode = (key: string) => {
    const node = NODES[key as keyof typeof NODES];
    const isActive = activeSet.has(key);
    const isVisible = visibleNodes.has(key);
    const hasGrad = key in grads;
    const val = displayValues[key];

    const forwardGlow = mode === 'forward' && isActive;
    const backwardGlow = mode === 'backward' && isActive;

    if (node.type === 'op') {
      // Rounded rectangle for operation nodes
      const w = 52, h = 40;
      return (
        <g key={key} style={{ transition: 'opacity 0.4s', opacity: isVisible ? 1 : 0.15 }}>
          {/* glow */}
          {forwardGlow && (
            <rect x={node.x - w / 2 - 4} y={node.y - h / 2 - 4} width={w + 8} height={h + 8} rx={14}
              fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.6}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </rect>
          )}
          {backwardGlow && (
            <rect x={node.x - w / 2 - 4} y={node.y - h / 2 - 4} width={w + 8} height={h + 8} rx={14}
              fill="none" stroke="#fb7185" strokeWidth={2} opacity={0.6}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </rect>
          )}
          <rect
            x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} rx={12}
            fill={forwardGlow ? '#164e63' : backwardGlow ? '#4c1d2e' : '#1e293b'}
            stroke={forwardGlow ? '#22d3ee' : backwardGlow ? '#fb7185' : '#475569'}
            strokeWidth={1.5}
            style={{ transition: 'fill 0.3s, stroke 0.3s' }}
          />
          <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central"
            fill={forwardGlow ? '#22d3ee' : backwardGlow ? '#fb7185' : '#94a3b8'}
            fontSize={16} fontWeight={700} fontFamily="monospace">
            {node.label}
          </text>
          {/* value label below op node */}
          {val && (
            <text x={node.x} y={node.y + h / 2 + 14} textAnchor="middle" fill="#67e8f9" fontSize={11}
              fontFamily="monospace" fontWeight={600} style={{ transition: 'opacity 0.3s' }}>
              = {val}
            </text>
          )}
          {/* gradient label above op node */}
          {hasGrad && (
            <text x={node.x} y={node.y - h / 2 - 8} textAnchor="middle" fill="#fb923c" fontSize={11}
              fontWeight={700} fontFamily="monospace">
              grad={grads[key]}
            </text>
          )}
        </g>
      );
    }

    // Circle for value nodes
    const r = 28;
    return (
      <g key={key} style={{ transition: 'opacity 0.4s', opacity: isVisible ? 1 : 0.15 }}>
        {/* glow */}
        {forwardGlow && (
          <circle cx={node.x} cy={node.y} r={r + 5} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.6}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        {backwardGlow && (
          <circle cx={node.x} cy={node.y} r={r + 5} fill="none" stroke="#fb7185" strokeWidth={2} opacity={0.6}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        <circle
          cx={node.x} cy={node.y} r={r}
          fill={forwardGlow ? '#164e63' : backwardGlow ? '#4c1d2e' : '#0f172a'}
          stroke={forwardGlow ? '#22d3ee' : backwardGlow ? '#fb7185' : '#475569'}
          strokeWidth={1.5}
          style={{ transition: 'fill 0.3s, stroke 0.3s' }}
        />
        {/* label */}
        <text x={node.x} y={node.y - 6} textAnchor="middle" dominantBaseline="central"
          fill={forwardGlow ? '#a5f3fc' : backwardGlow ? '#fda4af' : '#cbd5e1'}
          fontSize={13} fontWeight={700} fontFamily="monospace">
          {node.label}
        </text>
        {/* value inside */}
        {val && (
          <text x={node.x} y={node.y + 12} textAnchor="middle" dominantBaseline="central"
            fill={forwardGlow ? '#22d3ee' : backwardGlow ? '#fb7185' : '#64748b'}
            fontSize={12} fontFamily="monospace" fontWeight={600}>
            {val}
          </text>
        )}
        {/* gradient */}
        {hasGrad && (
          <g>
            <rect x={node.x - 28} y={node.y + r + 4} width={56} height={18} rx={4}
              fill="#7c2d12" opacity={0.8} />
            <text x={node.x} y={node.y + r + 15} textAnchor="middle" fill="#fb923c" fontSize={10}
              fontWeight={700} fontFamily="monospace">
              grad={grads[key]}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderEdge = (src: keyof typeof NODES, dst: keyof typeof NODES, idx: number) => {
    const s = NODES[src];
    const d = NODES[dst];
    const edgeKey = `${src}-${dst}`;
    const isLit = litEdges.has(edgeKey);
    const isForward = mode === 'forward' && isLit;
    const isBackward = mode === 'backward' && isLit;

    // Calculate edge points offset from node centers
    const dx = d.x - s.x;
    const dy = d.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;

    // Offset from source (circle or rect)
    const srcR = s.type === 'op' ? 28 : 28;
    const dstR = d.type === 'op' ? 28 : 28;
    const x1 = s.x + ux * srcR;
    const y1 = s.y + uy * srcR;
    const x2 = d.x - ux * dstR;
    const y2 = d.y - uy * dstR;

    const bothVisible = visibleNodes.has(src) && visibleNodes.has(dst);

    return (
      <g key={idx} style={{ transition: 'opacity 0.4s', opacity: bothVisible ? 1 : 0.1 }}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isForward ? '#22d3ee' : isBackward ? '#fb7185' : '#334155'}
          strokeWidth={isLit ? 2.5 : 1.5}
          markerEnd={isForward ? 'url(#arrowCyan)' : isBackward ? 'url(#arrowRose)' : 'url(#arrowGray)'}
          style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
        />
      </g>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Build the left panel                                             */
  /* ---------------------------------------------------------------- */
  const leftContent = (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Chapter 5: Autograd Engine
        </h2>
        <p className="text-sm text-cyan-400 mt-1 font-medium">
          Teaching the computer to learn from mistakes
        </p>
      </div>

      {/* Explanation paragraphs */}
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          To train a model, we need to know: <span className="text-cyan-300 font-semibold">if I slightly change any parameter,
          how does the final error change?</span> This is called a <em className="text-amber-300">"gradient"</em>.
        </p>
        <p>
          microgpt builds a <span className="text-cyan-300 font-semibold">computation graph</span> &mdash; a chain of
          operations where each node remembers its inputs. We can then "reverse" through this graph to compute all
          gradients automatically.
        </p>
        <p>
          Think of it like a <span className="text-emerald-300 font-semibold">trail of breadcrumbs</span>: as we compute
          forward, we leave a trail. Then we follow it backward to distribute blame for the error.
        </p>
      </div>

      {/* ============================================================ */}
      {/*  What is a Derivative?                                       */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
          Wait &mdash; What is a Derivative?
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            If you have never taken calculus, the word "derivative" might sound intimidating.
            But the idea is simple:{' '}
            <span className="text-cyan-300 font-semibold">
              a derivative tells you: if I nudge this input a tiny bit, how much does the output change?
            </span>
          </p>
          <p>
            <span className="text-emerald-300 font-semibold">Everyday example:</span>{' '}
            Imagine you are driving. Your <em>position</em> changes by 60 miles in 1 hour.
            Your speed &mdash; the derivative of position with respect to time &mdash; is 60 mph.
            The derivative simply measures the <em className="text-amber-300">rate of change</em>.
          </p>
          <p>
            Now apply this to a neural network: our model has thousands of adjustable numbers
            (parameters). For <em>each</em> parameter we need to ask:{' '}
          </p>
          <blockquote className="border-l-2 border-cyan-500/60 pl-3 my-2 text-cyan-200 italic">
            "If I nudge this number up a little, does the loss go up or down, and by how much?"
            <span className="block text-xs text-slate-500 mt-1 not-italic">&mdash; Andrej Karpathy</span>
          </blockquote>
          <p>
            That answer &mdash; for every single parameter &mdash; is what we call the{' '}
            <em className="text-amber-300">gradient</em>. The computation graph below is the
            machine that lets us compute all of those answers efficiently, in one backward sweep.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Interactive Computation Graph SVG                            */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Computation Graph &mdash; <code className="text-cyan-400">loss = (a*b + c)&sup2;</code>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={startForward}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'forward'
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
              }`}
            >
              Forward Pass
            </button>
            <button
              onClick={startBackward}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'backward'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
              }`}
            >
              Backward Pass
            </button>
          </div>
        </div>

        {/* SVG Graph */}
        <svg viewBox="0 0 680 420" width="100%" className="select-none" style={{ maxHeight: 420 }}>
          <defs>
            <marker id="arrowCyan" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
            </marker>
            <marker id="arrowRose" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb7185" />
            </marker>
            <marker id="arrowGray" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
            {/* Glow filters */}
            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#22d3ee" floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowRose" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#fb7185" floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background grid dots */}
          {Array.from({ length: 17 }).map((_, col) =>
            Array.from({ length: 11 }).map((_, row) => (
              <circle key={`${col}-${row}`} cx={col * 42 + 8} cy={row * 40 + 10} r={0.8} fill="#334155" opacity={0.4} />
            ))
          )}

          {/* Edges */}
          {EDGES.map(([src, dst], i) => renderEdge(src, dst, i))}

          {/* Nodes */}
          {Object.keys(NODES).map(k => renderNode(k))}
        </svg>

        {/* Step controls & description */}
        {mode !== 'idle' && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <button onClick={prevStep} disabled={currentStep === 0}
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors">
                &larr; Prev
              </button>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500">
                  Step {currentStep + 1} / {maxStep + 1}
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      mode === 'forward' ? 'bg-cyan-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${((currentStep + 1) / (maxStep + 1)) * 100}%` }}
                  />
                </div>
              </div>
              <button onClick={nextStep} disabled={currentStep >= maxStep}
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors">
                Next &rarr;
              </button>
            </div>
            <p className={`text-sm text-center font-medium ${
              mode === 'forward' ? 'text-cyan-300' : 'text-rose-300'
            }`}>
              {step?.desc}
            </p>
          </div>
        )}
        {mode === 'idle' && (
          <p className="mt-3 text-xs text-slate-500 text-center">
            Click <span className="text-cyan-400">Forward Pass</span> or{' '}
            <span className="text-rose-400">Backward Pass</span> to animate the computation graph.
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Gradient Rules Table                                        */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Chain Rule Reference
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-semibold">Operation</th>
              <th className="text-left py-2 px-3 text-cyan-400 font-semibold">Forward</th>
              <th className="text-left py-2 px-3 text-rose-400 font-semibold">Backward (local gradients)</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <tr className="border-b border-slate-800/50">
              <td className="py-2.5 px-3 text-slate-300">a + b</td>
              <td className="py-2.5 px-3 text-cyan-300">a + b</td>
              <td className="py-2.5 px-3 text-rose-300">&part;/&part;a = 1, &nbsp; &part;/&part;b = 1</td>
            </tr>
            <tr className="border-b border-slate-800/50">
              <td className="py-2.5 px-3 text-slate-300">a &times; b</td>
              <td className="py-2.5 px-3 text-cyan-300">a &times; b</td>
              <td className="py-2.5 px-3 text-rose-300">&part;/&part;a = b, &nbsp; &part;/&part;b = a</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-slate-300">a&sup2;</td>
              <td className="py-2.5 px-3 text-cyan-300">a&sup2;</td>
              <td className="py-2.5 px-3 text-rose-300">&part;/&part;a = 2a</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================================ */}
      {/*  Chain Rule Intuition (car/bicycle/man)                      */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          The Chain Rule in Plain English
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            The "chain rule" in the table above might look like scary math, but it is
            just multiplication along a path. Here is an analogy from Karpathy's blog:
          </p>
          <blockquote className="border-l-2 border-emerald-500/60 pl-3 my-2 text-emerald-200 italic">
            "If a car travels twice as fast as a bicycle and the bicycle is four times as
            fast as a walking man, then the car travels 2 &times; 4 = 8 times as fast as the man."
          </blockquote>
          <p>
            The chain rule works the same way: to find how the loss changes when you
            wiggle an input, <span className="text-cyan-300 font-semibold">multiply the
            rates of change along the path</span> from that input to the loss. That is
            literally all it is &mdash; multiplying numbers together along a chain.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Gradient Accumulation Example                               */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3">
          Why Gradients Accumulate
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            Here is a subtle but crucial detail. Consider this tiny program:
          </p>
          <pre className="bg-slate-800/80 rounded-lg p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
{`a = Value(2.0)
b = Value(3.0)
c = a * b       # c = 6.0
L = c + a       # L = 8.0
L.backward()
print(a.grad)   # 4.0`}
          </pre>
          <p>
            Why is <code className="text-amber-300 bg-slate-800/50 px-1 rounded">a.grad</code> equal
            to <span className="text-amber-300 font-bold">4.0</span>? Because{' '}
            <code className="text-cyan-300">a</code> influences{' '}
            <code className="text-cyan-300">L</code> through{' '}
            <span className="text-cyan-300 font-semibold">two separate paths</span>:
          </p>
          <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">Path 1:</span>
              <span className="text-slate-300">
                a &rarr; c (via multiplication with b=3) &rarr; L (via addition) ={' '}
                <span className="text-amber-300 font-bold">3.0</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">Path 2:</span>
              <span className="text-slate-300">
                a &rarr; L (via direct addition) ={' '}
                <span className="text-amber-300 font-bold">1.0</span>
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">Total:</span>
              <span className="text-slate-200">
                3.0 + 1.0 = <span className="text-amber-300 font-bold">4.0</span>
              </span>
            </div>
          </div>
          <p>
            This is why in the backpropagation code we
            use <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">+=</code> instead
            of <code className="text-slate-400 bg-slate-800/50 px-1 rounded">=</code> when
            computing gradients:{' '}
            <span className="text-emerald-300 font-semibold">
              gradients accumulate from all paths.
            </span>{' '}
            If a parameter contributes to the loss through multiple routes, we add up
            all the contributions.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Key Insight                                                 */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-rose-950/40 rounded-xl border border-cyan-700/30 p-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Key Insight</h3>
        <p className="text-sm text-slate-200 leading-relaxed">
          This is exactly what <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">loss.backward()</code> does
          in microgpt! It walks backward through every operation, applying the chain rule to compute how each parameter
          affects the loss. With <span className="text-amber-300 font-semibold">4,192 parameters</span>, this tells us
          exactly how to adjust each one to reduce the error.
        </p>
        <p className="text-sm text-slate-200 leading-relaxed mt-3">
          <span className="text-amber-300 font-semibold">The wiggle test:</span>{' '}
          In the accumulation example above, <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">a.grad = 4.0</code> means:
          if you increase <code className="text-cyan-300">a</code> by 0.001,{' '}
          <code className="text-cyan-300">L</code> increases by about 0.004.
          The gradient tells you the{' '}
          <span className="text-emerald-300 font-semibold">direction</span>{' '}
          (positive or negative, from the sign) and the{' '}
          <span className="text-emerald-300 font-semibold">steepness</span>{' '}
          (how strongly it pulls, from the magnitude) of each parameter's
          influence on the loss.
        </p>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Right panel: CodePanel                                           */
  /* ---------------------------------------------------------------- */
  const rightContent = (
    <CodePanel
      pyHighlight={[[29, 72]]}
      jsHighlight={[[50, 97]]}
      title="Autograd Engine"
      blogExcerpt="The backward() method traverses the computation graph in reverse topological order, applying the chain rule to compute gradients for all parameters."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
