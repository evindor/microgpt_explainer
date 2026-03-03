import { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useCodePanel } from '../CodePanelContext';
import Vector3DScene from '../components/Vector3DScene';

function valueToBg(v: number): string {
  if (v > 0) {
    const intensity = Math.min(v / 2, 1);
    const pct = Math.round((0.15 + intensity * 0.45) * 100);
    return `color-mix(in srgb, var(--accent-emerald) ${pct}%, transparent)`;
  }
  if (v < 0) {
    const intensity = Math.min(Math.abs(v) / 2, 1);
    const pct = Math.round((0.15 + intensity * 0.45) * 100);
    return `color-mix(in srgb, var(--accent-blue) ${pct}%, transparent)`;
  }
  return 'color-mix(in srgb, var(--svg-muted) 10%, transparent)';
}

function valueToBorder(v: number): string {
  if (v > 0) return 'border-green-500/30';
  if (v < 0) return 'border-blue-500/30';
  return 'border-slate-600/30';
}

export default function VectorsMatrices() {
  // Dot product interactive state (3D so we can visualize the arrows)
  const [vecA, setVecA] = useState<[number, number, number]>([1, 0.5, -0.3]);
  const [vecB, setVecB] = useState<[number, number, number]>([0.2, -0.7, 0.4]);

  // 2D vector interactive state
  const [vec2d, setVec2d] = useState<[number, number]>([2, 1.5]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  // 3D vector interactive state
  const [vec3d, setVec3d] = useState<[number, number, number]>([1.5, 2, 1]);

  // Matrix multiplication step state
  const [step, setStep] = useState(0);

  const matA = [
    [2, 1, 0],
    [0, 3, 1],
    [1, 0, 2],
  ];
  const vecX = [1, 2, 3];
  const results = [
    2 * 1 + 1 * 2 + 0 * 3, // 4
    0 * 1 + 3 * 2 + 1 * 3, // 9
    1 * 1 + 0 * 2 + 2 * 3, // 7
  ];
  const computations = [
    '',
    '2 \u00d7 1 + 1 \u00d7 2 + 0 \u00d7 3 = 4',
    '0 \u00d7 1 + 3 \u00d7 2 + 1 \u00d7 3 = 9',
    '1 \u00d7 1 + 0 \u00d7 2 + 2 \u00d7 3 = 7',
  ];

  // Dot product calculation
  const products = vecA.map((a, i) => a * vecB[i]);
  const dotProduct = products.reduce((sum, p) => sum + p, 0);

  const updateVecA = (idx: number, val: number) => {
    setVecA((prev) => prev.map((v, i) => (i === idx ? val : v)) as [number, number, number]);
  };
  const updateVecB = (idx: number, val: number) => {
    setVecB((prev) => prev.map((v, i) => (i === idx ? val : v)) as [number, number, number]);
  };

  // Example embedding vector
  const exampleVec = [0.3, -0.1, 0.8, 0.2, -0.5, 0.6, -0.9, 0.1, 0.4, -0.3, 0.7, -0.2, 0.5, 0.0, -0.4, 0.3];
  useCodePanel({
    pyHighlight: [[80, 80], [94, 95]],
    jsHighlight: [[100, 102], [110, 111], [126, 128]],
    title: "Linear Algebra",
    blogExcerpt: "linear: Matrix-vector multiplication—the fundamental building block",
  });


  const leftContent = (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Chapter 5: Vectors &amp; Matrices
        </h1>
        <p className="text-lg text-slate-400 mt-2">
          The language of neural networks
        </p>
      </div>

      {/* What is a Vector? */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-amber-400">What is a Vector?</h2>
        <p className="text-slate-300 leading-relaxed">
          You probably remember coordinates from school &mdash; a point at (3,&nbsp;2) on a grid.
          A vector is that same idea, but thought of as an <span className="text-white font-medium">arrow</span> from
          the origin to that point. The arrow has two properties that matter: its{' '}
          <span className="text-amber-300">direction</span> (where it points) and its{' '}
          <span className="text-amber-300">magnitude</span> (how long it is).
        </p>

        {/* ── 2D Vector ── */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            A 2D Vector &mdash; drag the tip
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Two numbers, x and y, fully define an arrow on a flat grid. That&rsquo;s a 2D vector.
          </p>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center gap-3">
            {(() => {
              const S = 40, cx = 150, cy = 150;
              const tx = (x: number) => cx + x * S;
              const ty = (y: number) => cy - y * S;
              const vecLen = Math.sqrt(vec2d[0] ** 2 + vec2d[1] ** 2);
              const svgDx = vec2d[0] * S;
              const svgDy = -vec2d[1] * S;
              const svgAngle = Math.atan2(svgDy, svgDx);
              const HEAD = 12, HA = Math.PI / 6;

              const handlePointerMove = (e: React.PointerEvent) => {
                if (!dragging || !svgRef.current) return;
                const rect = svgRef.current.getBoundingClientRect();
                const vx = ((e.clientX - rect.left) / rect.width * 300 - cx) / S;
                const vy = -((e.clientY - rect.top) / rect.height * 300 - cy) / S;
                setVec2d([
                  Math.round(Math.max(-3, Math.min(3, vx)) * 10) / 10,
                  Math.round(Math.max(-3, Math.min(3, vy)) * 10) / 10,
                ]);
              };

              return (
                <svg
                  ref={svgRef}
                  viewBox="0 0 300 300"
                  className="w-full max-w-sm aspect-square"
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => setDragging(false)}
                  onPointerLeave={() => setDragging(false)}
                >
                  {/* Grid lines */}
                  {[-3, -2, -1, 1, 2, 3].map(i => (
                    <g key={i}>
                      <line x1={tx(i)} y1={ty(-3)} x2={tx(i)} y2={ty(3)} stroke="#1e293b" strokeWidth="0.5" />
                      <line x1={tx(-3)} y1={ty(i)} x2={tx(3)} y2={ty(i)} stroke="#1e293b" strokeWidth="0.5" />
                    </g>
                  ))}

                  {/* Axes */}
                  <line x1={tx(-3.2)} y1={ty(0)} x2={tx(3.2)} y2={ty(0)} stroke="#475569" strokeWidth="1" />
                  <line x1={tx(0)} y1={ty(-3.2)} x2={tx(0)} y2={ty(3.2)} stroke="#475569" strokeWidth="1" />
                  <polygon points={`${tx(3.3)},${ty(0)} ${tx(3.1)},${ty(0.12)} ${tx(3.1)},${ty(-0.12)}`} fill="#475569" />
                  <polygon points={`${tx(0)},${ty(3.3)} ${tx(-0.12)},${ty(3.1)} ${tx(0.12)},${ty(3.1)}`} fill="#475569" />
                  <text x={tx(3.5)} y={ty(-0.4)} fill="#64748b" fontSize="11" fontFamily="monospace" textAnchor="middle">x</text>
                  <text x={tx(0.4)} y={ty(3.45)} fill="#64748b" fontSize="11" fontFamily="monospace" textAnchor="middle">y</text>

                  {/* Tick labels */}
                  {[-2, -1, 1, 2].map(i => (
                    <g key={`t${i}`}>
                      <text x={tx(i)} y={ty(0) + 14} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">{i}</text>
                      <text x={tx(0) - 8} y={ty(i) + 3} textAnchor="end" fill="#475569" fontSize="8" fontFamily="monospace">{i}</text>
                    </g>
                  ))}

                  {/* Projection lines */}
                  <line x1={tx(vec2d[0])} y1={ty(vec2d[1])} x2={tx(vec2d[0])} y2={ty(0)} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4,3" />
                  <line x1={tx(vec2d[0])} y1={ty(vec2d[1])} x2={tx(0)} y2={ty(vec2d[1])} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4,3" />

                  {/* Vector arrow shaft */}
                  <line x1={tx(0)} y1={ty(0)} x2={tx(vec2d[0])} y2={ty(vec2d[1])} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Arrowhead */}
                  {vecLen > 0.3 && (
                    <polygon
                      points={[
                        [tx(vec2d[0]), ty(vec2d[1])],
                        [tx(vec2d[0]) - HEAD * Math.cos(svgAngle - HA), ty(vec2d[1]) - HEAD * Math.sin(svgAngle - HA)],
                        [tx(vec2d[0]) - HEAD * Math.cos(svgAngle + HA), ty(vec2d[1]) - HEAD * Math.sin(svgAngle + HA)],
                      ].map(p => p.join(',')).join(' ')}
                      fill="#f59e0b"
                    />
                  )}

                  {/* Draggable handle */}
                  <circle
                    cx={tx(vec2d[0])} cy={ty(vec2d[1])} r="8"
                    fill="#f59e0b" stroke="#fbbf24" strokeWidth="2"
                    className="cursor-grab active:cursor-grabbing"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }}
                    onPointerDown={(e) => {
                      setDragging(true);
                      (e.target as Element).setPointerCapture(e.pointerId);
                    }}
                  />

                  {/* Coordinate label */}
                  <text
                    x={tx(vec2d[0]) + (vec2d[0] >= 0 ? 14 : -14)}
                    y={ty(vec2d[1]) - 12}
                    fill="#fbbf24" fontSize="11" fontFamily="monospace"
                    textAnchor={vec2d[0] >= 0 ? 'start' : 'end'}
                  >
                    ({vec2d[0].toFixed(1)}, {vec2d[1].toFixed(1)})
                  </text>
                </svg>
              );
            })()}
            <div className="text-xs text-slate-500 text-center">
              The two numbers [{vec2d[0].toFixed(1)}, {vec2d[1].toFixed(1)}] fully describe this arrow &mdash; its direction and length.
            </div>
          </div>
        </div>

        {/* ── 3D Vector ── */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Adding a Third Dimension
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Add a third number and you get a 3D vector &mdash; an arrow in three-dimensional space.
            Same concept, one more axis.
          </p>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <Vector3DScene vectors={[{ to: vec3d, color: '#f59e0b' }]} />
            <div className="grid grid-cols-3 gap-3">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => {
                const textColors = ['text-red-400', 'text-green-400', 'text-blue-400'];
                const accentColors = ['accent-red-500', 'accent-green-500', 'accent-blue-500'];
                return (
                  <div key={axis} className="space-y-1">
                    <div className={`text-xs font-mono font-semibold text-center ${textColors[i]}`}>
                      {axis} = {vec3d[i].toFixed(1)}
                    </div>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.1}
                      value={vec3d[i]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVec3d(prev => {
                          const next: [number, number, number] = [prev[0], prev[1], prev[2]];
                          next[i] = val;
                          return next;
                        });
                      }}
                      className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${accentColors[i]}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 text-center">
              Drag to rotate the view. Use sliders to move the arrow.
            </div>
          </div>
        </div>

        {/* ── The Leap to 16D ── */}
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            The Leap to 16 Dimensions
          </div>
          <p className="text-slate-300 leading-relaxed">
            Here&rsquo;s the key insight: nothing stops you from having 4 numbers, or 16, or 768.
            You can&rsquo;t draw a 16-dimensional arrow &mdash; nobody can &mdash; but the math works
            identically. Each number is just a coordinate along its own axis.
          </p>
          <p className="text-slate-300 leading-relaxed">
            In microgpt, every token gets mapped to a vector with 16 numbers, called an{' '}
            <span className="text-amber-300 font-medium">embedding</span>. These 16 values are learned
            during training, and they end up encoding what the token &ldquo;means&rdquo;.
          </p>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Example token embedding (16 dimensions)
            </div>
            <div className="flex flex-wrap gap-1">
              {exampleVec.map((v, i) => (
                <div
                  key={i}
                  className={`px-2 py-1.5 rounded text-xs font-mono border ${valueToBorder(v)} transition-all`}
                  style={{ backgroundColor: valueToBg(v) }}
                >
                  {v.toFixed(1)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 50%, transparent)' }} />
                Negative
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--svg-muted) 15%, transparent)' }} />
                Zero
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-emerald) 50%, transparent)' }} />
                Positive
              </span>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Tokens with similar meanings end up as arrows pointing in similar directions in this
            16-dimensional space. &ldquo;King&rdquo; and &ldquo;queen&rdquo; would be nearly parallel arrows.
            The dot product &mdash; which we&rsquo;ll explore next &mdash; is exactly how we measure that
            similarity. It&rsquo;s the core operation in attention.
          </p>
        </div>
      </section>

      {/* Dot Product Interactive */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-400">Dot Product Interactive</h2>
        <p className="text-slate-300 leading-relaxed">
          The dot product measures how similar two vectors are &mdash; specifically, whether
          they point in the same direction. Watch the two arrows below: when they&rsquo;re
          roughly parallel the dot product is large and positive. When they&rsquo;re perpendicular
          it&rsquo;s near zero. When they point in opposite directions it goes negative.
        </p>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-5">
          {/* 3D visualization of both vectors */}
          <Vector3DScene
            vectors={[
              { to: vecA, color: '#a855f7', label: 'A' },
              { to: vecB, color: '#06b6d4', label: 'B' },
            ]}
            autoRotate={false}
          />
          <div className="text-xs text-slate-500 text-center -mt-2">
            Drag to rotate. Adjust the sliders to move each arrow.
          </div>

          {/* Vector A sliders */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-purple-400 font-mono">Vector A</div>
            <div className="grid grid-cols-3 gap-3">
              {vecA.map((val, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono text-center">
                    A[{i}] = {val.toFixed(1)}
                  </div>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={val}
                    onChange={(e) => updateVecA(i, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vector B sliders */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-cyan-400 font-mono">Vector B</div>
            <div className="grid grid-cols-3 gap-3">
              {vecB.map((val, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono text-center">
                    B[{i}] = {val.toFixed(1)}
                  </div>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={val}
                    onChange={(e) => updateVecB(i, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-step computation */}
          <div className="border-t border-slate-700/50 pt-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Step-by-step dot product
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
              {products.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-500 mx-1">+</span>}
                  <span
                    className="px-2 py-1 rounded border transition-all"
                    style={{
                      backgroundColor: valueToBg(p),
                      borderColor: p >= 0 ? 'color-mix(in srgb, var(--accent-emerald) 30%, transparent)' : 'color-mix(in srgb, var(--accent-blue) 30%, transparent)',
                    }}
                  >
                    <span className="text-purple-300">{vecA[i].toFixed(1)}</span>
                    <span className="text-slate-500">&times;</span>
                    <span className="text-cyan-300">{vecB[i].toFixed(1)}</span>
                    <span className="text-slate-400"> = </span>
                    <span className="text-white font-semibold">{p.toFixed(2)}</span>
                  </span>
                </span>
              ))}
            </div>

            {/* Result */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-slate-400">Result:</span>
              <span
                className={`text-2xl font-bold font-mono px-4 py-2 rounded-lg border ${
                  dotProduct >= 0
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                } transition-all`}
              >
                {dotProduct.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                {dotProduct > 1
                  ? 'Very similar!'
                  : dotProduct > 0
                  ? 'Somewhat similar'
                  : dotProduct > -1
                  ? 'Somewhat different'
                  : 'Very different!'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Formula: A &middot; B = A[0]&times;B[0] + A[1]&times;B[1] + A[2]&times;B[2]
          </p>
        </div>
      </section>

      {/* Matrix Multiplication Step-by-Step */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-400">Matrix Multiplication Step-by-Step</h2>
        <p className="text-slate-300 leading-relaxed">
          This is exactly how <code className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded text-sm">linear(x, w)</code> works
          in microgpt!
        </p>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-5">
          <div className="flex items-start gap-6 justify-center">
            {/* Matrix A */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-center">
                Matrix A
              </div>
              <div className="grid grid-rows-3 gap-1">
                {matA.map((row, ri) => (
                  <div key={ri} className="flex gap-1">
                    {/* Left bracket */}
                    {ri === 0 && (
                      <div className="flex items-center text-slate-500 text-2xl font-thin mr-1 -mt-1"
                        style={{ gridRow: '1 / 4' }}>
                        [
                      </div>
                    )}
                    {ri === 1 && <div className="w-3" />}
                    {ri === 2 && <div className="w-3" />}
                    {row.map((val, ci) => {
                      const isHighlighted = step > 0 && step - 1 === ri;
                      return (
                        <div
                          key={ci}
                          className={`w-12 h-12 flex items-center justify-center rounded font-mono text-sm font-semibold border-2 transition-all duration-300 ${
                            isHighlighted
                              ? 'border-amber-400 bg-amber-400/20 text-amber-200 shadow-lg shadow-amber-400/20 scale-105'
                              : 'border-slate-600/50 bg-slate-700/30 text-slate-300'
                          }`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Multiplication sign */}
            <div className="flex items-center self-center text-2xl text-slate-500 font-thin pt-5">
              &times;
            </div>

            {/* Vector x */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-center">
                Vector x
              </div>
              <div className="grid grid-rows-3 gap-1">
                {vecX.map((val, i) => {
                  const isHighlighted = step > 0;
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 flex items-center justify-center rounded font-mono text-sm font-semibold border-2 transition-all duration-300 ${
                        isHighlighted
                          ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-lg shadow-cyan-400/20 scale-105'
                          : 'border-slate-600/50 bg-slate-700/30 text-slate-300'
                      }`}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equals sign */}
            <div className="flex items-center self-center text-2xl text-slate-500 font-thin pt-5">
              =
            </div>

            {/* Result vector */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-center">
                Result
              </div>
              <div className="grid grid-rows-3 gap-1">
                {results.map((val, i) => {
                  const isFilled = step > i;
                  const isActive = step - 1 === i;
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 flex items-center justify-center rounded font-mono text-sm font-semibold border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-amber-400 bg-amber-400/30 text-amber-200 shadow-lg shadow-amber-400/20 scale-110'
                          : isFilled
                          ? 'border-green-500/50 bg-green-500/15 text-green-300'
                          : 'border-slate-600/50 bg-slate-700/30 text-slate-600'
                      }`}
                    >
                      {isFilled ? val : '?'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Arrow indicators showing which row maps to which result */}
          {step > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400/80 font-mono">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-pulse">
                <path d="M8 2L8 14M8 14L3 9M8 14L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Row {step - 1} of A dot-products with x
            </div>
          )}

          {/* Computation display */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-center min-h-[3rem] flex items-center justify-center">
            {step === 0 ? (
              <span className="text-slate-400 text-sm">Click &ldquo;Next Step&rdquo; to begin!</span>
            ) : (
              <div className="space-y-1">
                <div className="font-mono text-sm">
                  {matA[step - 1].map((val, ci) => (
                    <span key={ci}>
                      {ci > 0 && <span className="text-slate-500"> + </span>}
                      <span className="text-amber-300">{val}</span>
                      <span className="text-slate-500">&times;</span>
                      <span className="text-cyan-300">{vecX[ci]}</span>
                    </span>
                  ))}
                  <span className="text-slate-500"> = </span>
                  <span className="text-white font-bold text-lg">{results[step - 1]}</span>
                </div>
                <div className="text-xs text-slate-500">
                  result[{step - 1}] = {results[step - 1]}
                </div>
              </div>
            )}
          </div>

          {/* Full computation summary (visible at step 3) */}
          {step === 3 && (
            <div className="text-xs text-slate-500 font-mono text-center border-t border-slate-700/50 pt-3">
              {computations[1]} &nbsp;|&nbsp; {computations[2]} &nbsp;|&nbsp; {computations[3]}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep((s) => Math.min(s + 1, 3))}
              disabled={step >= 3}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                step >= 3
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400/60 active:scale-95'
              }`}
            >
              Next Step
            </button>
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700/30 text-slate-400 border border-slate-600/40 hover:bg-slate-700/50 hover:text-slate-300 transition-all active:scale-95"
            >
              Reset
            </button>
            <span className="text-xs text-slate-500 ml-auto">
              Step {step} of 3
            </span>
          </div>
        </div>
      </section>

      {/* Key Insight */}
      <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Key Insight</h3>
        </div>
        <p className="text-slate-300 leading-relaxed text-sm">
          The <code className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded">linear(x, w)</code> function
          in microgpt is literally just matrix-vector multiplication. Every layer of the neural network relies on this
          one operation. When we multiply a weight matrix W by input x, each row of W computes a different
          &ldquo;feature&rdquo; from the input.
        </p>
      </section>
    </div>
  );

  return <Layout left={leftContent} />;
}
