import { useState } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

function valueToBg(v: number): string {
  if (v > 0) {
    const intensity = Math.min(v / 2, 1);
    return `rgba(34, 197, 94, ${0.15 + intensity * 0.45})`;
  }
  if (v < 0) {
    const intensity = Math.min(Math.abs(v) / 2, 1);
    return `rgba(59, 130, 246, ${0.15 + intensity * 0.45})`;
  }
  return 'rgba(148, 163, 184, 0.1)';
}

function valueToBorder(v: number): string {
  if (v > 0) return 'border-green-500/30';
  if (v < 0) return 'border-blue-500/30';
  return 'border-slate-600/30';
}

export default function VectorsMatrices() {
  // Dot product interactive state
  const [vecA, setVecA] = useState([1, 0.5, -0.3, 0.8]);
  const [vecB, setVecB] = useState([0.2, -0.7, 0.4, 1.1]);

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
    setVecA((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };
  const updateVecB = (idx: number, val: number) => {
    setVecB((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  // Example embedding vector
  const exampleVec = [0.3, -0.1, 0.8, 0.2, -0.5, 0.6, -0.9, 0.1, 0.4, -0.3, 0.7, -0.2, 0.5, 0.0, -0.4, 0.3];

  const leftContent = (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Chapter 3: Vectors &amp; Matrices
        </h1>
        <p className="text-lg text-slate-400 mt-2">
          The language of neural networks
        </p>
      </div>

      {/* What is a Vector? */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-400">What is a Vector?</h2>
        <p className="text-slate-300 leading-relaxed">
          A vector is just a list of numbers. In microgpt, each token is represented as a
          vector of 16 numbers (called the &ldquo;embedding dimension&rdquo;).
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
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }} />
              Negative
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)' }} />
              Zero
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }} />
              Positive
            </span>
          </div>
        </div>
      </section>

      {/* Dot Product Interactive */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-400">Dot Product Interactive</h2>
        <p className="text-slate-300 leading-relaxed">
          The dot product measures how similar two vectors are. It&rsquo;s the core operation
          in attention!
        </p>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-5">
          {/* Vector A sliders */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-purple-400 font-mono">Vector A</div>
            <div className="grid grid-cols-4 gap-3">
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
            <div className="grid grid-cols-4 gap-3">
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
                      borderColor: p >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
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
            Formula: A &middot; B = A[0]&times;B[0] + A[1]&times;B[1] + A[2]&times;B[2] + A[3]&times;B[3]
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

  const rightContent = (
    <CodePanel
      pyHighlight={[[80, 80], [94, 95]]}
      jsHighlight={[[100, 102], [110, 111], [126, 128]]}
      title="Linear Algebra"
      blogExcerpt="linear: Matrix-vector multiplication—the fundamental building block"
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
