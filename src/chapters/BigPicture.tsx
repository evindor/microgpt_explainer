import Layout from "../components/Layout";
import CodePanel from "../components/CodePanel";

const chapters = [
  {
    num: 0,
    name: "Big Picture",
    desc: "The full GPT pipeline at a glance",
    color: "border-slate-400",
  },
  {
    num: 1,
    name: "The Dataset",
    desc: "The fuel of language models",
    color: "border-lime-400",
  },
  {
    num: 2,
    name: "Tokenization",
    desc: "Converting text into numbers",
    color: "border-cyan-400",
  },
  {
    num: 3,
    name: "Autograd Engine",
    desc: "Automatic differentiation from scratch",
    color: "border-violet-400",
  },
  {
    num: 4,
    name: "Hyperparameters",
    desc: "The settings that define the model",
    color: "border-fuchsia-400",
  },
  {
    num: 5,
    name: "Vectors & Matrices",
    desc: "The math building blocks",
    color: "border-blue-400",
  },
  {
    num: 6,
    name: "State Dict",
    desc: "Where the model stores its knowledge",
    color: "border-fuchsia-400",
  },
  {
    num: 7,
    name: "Softmax & RMSNorm",
    desc: "Functions that tame numbers",
    color: "border-amber-400",
  },
  {
    num: 8,
    name: "Embeddings",
    desc: "Giving meaning to token IDs",
    color: "border-amber-400",
  },
  {
    num: 9,
    name: "Attention",
    desc: "How tokens talk to each other",
    color: "border-rose-400",
  },
  {
    num: 10,
    name: "MLP & Norms",
    desc: "The thinking stage of the transformer",
    color: "border-pink-400",
  },
  {
    num: 11,
    name: "Full Forward Pass",
    desc: "Stacking it all together",
    color: "border-teal-400",
  },
  {
    num: 12,
    name: "Training",
    desc: "Forward, loss, backward, update",
    color: "border-indigo-400",
  },
  {
    num: 13,
    name: "Inference",
    desc: "Generating text token by token",
    color: "border-orange-400",
  },
  {
    num: 14,
    name: "From microgpt to ChatGPT",
    desc: "The same algorithm, at scale",
    color: "border-sky-400",
  },
];

export default function BigPicture() {
  const leftContent = (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 0: The Big Picture
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          Understanding GPT in 200 lines of Python
        </p>
      </div>

      {/* Hook */}
      <div className="viz-card glow-cyan">
        <p className="text-base text-slate-200 leading-relaxed font-medium">
          What if you could understand how ChatGPT works — really understand
          it — by reading just 200 lines of Python?
        </p>
      </div>

      {/* What is microgpt */}
      <div className="viz-card">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
          Meet microgpt
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Andrej Karpathy — one of the original creators of the technology
          behind ChatGPT — distilled a decade of research into a single,
          200-line Python file. No libraries, no frameworks, no dependencies.
          Just the raw algorithm that trains and runs a GPT from scratch.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          He calls it an{" "}
          <span className="text-slate-100 font-medium italic">"art project"</span>{" "}
          — the irreducible core of all large language models. Everything
          ChatGPT, Claude, and Gemini do starts here. Everything else is
          just efficiency.
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          This is the complete algorithm. If you can understand these 200
          lines, you understand the foundation of every LLM in the world.
        </p>
      </div>

      {/* What it does */}
      <div className="viz-card">
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          What it does
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          microgpt learns from a dataset of 32,000 baby names and figures out
          the patterns — which letters tend to follow which, what sounds
          plausible, what looks like a real name. Then it generates completely
          new names it has never seen before:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["kamon", "vialan", "karia", "keylen", "lenne"].map((name) => (
            <span
              key={name}
              className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-sm font-mono"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          These names don't exist in the training data. The model invented
          them. The same core algorithm, scaled up 1,000,000x, powers
          ChatGPT.
        </p>
      </div>

      {/* What you'll learn */}
      <div className="viz-card">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
          What you'll learn
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This interactive guide walks you through every line of microgpt,
          from raw text to a model that can generate new names. No math, ML,
          or CS degree required — just curiosity and a willingness to tinker.
          Here's the roadmap:
        </p>
      </div>

      {/* SVG Pipeline Diagram */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
          The GPT Pipeline
        </h2>
        <div className="flex justify-center overflow-x-auto">
          <svg
            viewBox="0 0 700 650"
            width="700"
            height="650"
            className="block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="gradViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="gradAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="gradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>

            {/* ===== ROW 1: Text Input -> Tokenizer -> Token IDs ===== */}
            <rect x="20" y="20" width="180" height="54" rx="12" ry="12" fill="url(#gradCyan)" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
            <text x="110" y="42" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="600">Text Input</text>
            <text x="110" y="60" textAnchor="middle" fill="#94a3b8" fontSize="11">"emma"</text>

            <line x1="200" y1="47" x2="238" y2="47" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            <rect x="246" y="20" width="180" height="54" rx="12" ry="12" fill="url(#gradCyan)" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
            <text x="336" y="42" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="600">Tokenizer</text>
            <text x="336" y="60" textAnchor="middle" fill="#94a3b8" fontSize="11">char &lt;-&gt; integer</text>

            <line x1="426" y1="47" x2="464" y2="47" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            <rect x="472" y="20" width="200" height="54" rx="12" ry="12" fill="url(#gradCyan)" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
            <text x="572" y="42" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="600">Token IDs</text>
            <text x="572" y="60" textAnchor="middle" fill="#94a3b8" fontSize="11">[26, 4, 12, 12, 0]</text>

            {/* ===== Arrow down to Embeddings ===== */}
            <line x1="572" y1="74" x2="572" y2="108" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* ===== ROW 2: Embeddings + RMSNorm ===== */}
            <rect x="370" y="116" width="300" height="54" rx="12" ry="12" fill="url(#gradViolet)" fillOpacity="0.2" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="520" y="138" textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="600">Embeddings + RMSNorm</text>
            <text x="520" y="156" textAnchor="middle" fill="#94a3b8" fontSize="11">token + position vectors, normalized</text>

            {/* ===== Arrow down to Transformer ===== */}
            <line x1="520" y1="170" x2="520" y2="206" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* ===== ROW 3: Transformer Layers ===== */}
            <rect x="40" y="214" width="630" height="170" rx="14" ry="14" fill="url(#gradViolet)" fillOpacity="0.1" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 3" />
            <text x="355" y="234" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="700">Transformer Layers (repeat per layer)</text>

            {/* --- Attention sub-row --- */}
            {/* "norm" label */}
            <text x="72" y="279" fill="#94a3b8" fontSize="9" fontWeight="500">norm</text>
            <line x1="93" y1="275" x2="108" y2="275" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* Attention box */}
            <rect x="112" y="257" width="195" height="36" rx="8" ry="8" fill="url(#gradViolet)" fillOpacity="0.25" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="210" y="273" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600">Self-Attention</text>
            <text x="210" y="287" textAnchor="middle" fill="#94a3b8" fontSize="9">{"softmax(QK/\u221Ad) \u00B7 V"}</text>

            <line x1="307" y1="275" x2="326" y2="275" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* + circle (residual add) */}
            <circle cx="340" cy="275" r="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="340" y="280" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="700">+</text>

            {/* Residual skip connection (dashed arc above) */}
            <path d="M 62 268 C 62 244, 340 244, 340 264" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
            <text x="200" y="250" textAnchor="middle" fill="#fbbf24" fontSize="8" opacity="0.7">residual</text>

            {/* Arrow out from + to right */}
            <line x1="351" y1="275" x2="630" y2="275" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />

            {/* Vertical connector from attention row to MLP row */}
            <line x1="355" y1="286" x2="355" y2="325" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* --- MLP sub-row --- */}
            {/* "norm" label */}
            <text x="72" y="347" fill="#94a3b8" fontSize="9" fontWeight="500">norm</text>
            <line x1="93" y1="343" x2="108" y2="343" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* MLP box */}
            <rect x="112" y="325" width="195" height="36" rx="8" ry="8" fill="url(#gradViolet)" fillOpacity="0.25" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="210" y="341" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600">MLP (Feed-Forward)</text>
            <text x="210" y="355" textAnchor="middle" fill="#94a3b8" fontSize="9">{"linear \u2192 ReLU \u2192 linear"}</text>

            <line x1="307" y1="343" x2="326" y2="343" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />

            {/* + circle (residual add) */}
            <circle cx="340" cy="343" r="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="340" y="348" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="700">+</text>

            {/* Residual skip connection (dashed arc above) */}
            <path d="M 62 336 C 62 312, 340 312, 340 332" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
            <text x="200" y="318" textAnchor="middle" fill="#fbbf24" fontSize="8" opacity="0.7">residual</text>

            {/* Arrow out from + to right */}
            <line x1="351" y1="343" x2="630" y2="343" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />

            {/* ===== Arrow down from Transformer to lm_head ===== */}
            <line x1="355" y1="384" x2="355" y2="406" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* ===== ROW 3.5: lm_head linear projection ===== */}
            <rect x="245" y="412" width="220" height="38" rx="10" ry="10" fill="url(#gradViolet)" fillOpacity="0.2" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="355" y="430" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="600">lm_head (Linear)</text>
            <text x="355" y="444" textAnchor="middle" fill="#94a3b8" fontSize="9">16-dim hidden state → 27 logits</text>

            {/* ===== Arrow down to Softmax row ===== */}
            <line x1="355" y1="450" x2="355" y2="472" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* ===== ROW 4: Softmax -> Probabilities ===== */}
            <rect x="120" y="478" width="180" height="48" rx="12" ry="12" fill="url(#gradAmber)" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="210" y="498" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="600">Softmax</text>
            <text x="210" y="514" textAnchor="middle" fill="#94a3b8" fontSize="10">exp(x) / sum(exp)</text>

            <line x1="300" y1="502" x2="338" y2="502" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            <rect x="346" y="478" width="220" height="48" rx="12" ry="12" fill="url(#gradAmber)" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="456" y="498" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="600">Probabilities</text>
            <text x="456" y="514" textAnchor="middle" fill="#94a3b8" fontSize="10">[0.01, 0.72, 0.03, ...]</text>

            {/* ===== Arrow down to sampling ===== */}
            <line x1="456" y1="526" x2="456" y2="548" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* ===== ROW 5: Sampled Token -> Generated Name ===== */}
            <rect x="200" y="554" width="200" height="48" rx="12" ry="12" fill="url(#gradEmerald)" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.5" filter="url(#glow)" />
            <text x="300" y="574" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="600">Sample Token</text>
            <text x="300" y="590" textAnchor="middle" fill="#94a3b8" fontSize="10">pick from distribution</text>

            <line x1="400" y1="578" x2="438" y2="578" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            <rect x="446" y="554" width="180" height="48" rx="12" ry="12" fill="url(#gradEmerald)" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.5" filter="url(#glow)" />
            <text x="536" y="574" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="600">Generated Name</text>
            <text x="536" y="590" textAnchor="middle" fill="#94a3b8" fontSize="10">"kamon"</text>

            {/* ===== Category Legend ===== */}
            <rect x="20" y="610" width="10" height="10" rx="2" fill="#22d3ee" fillOpacity="0.7" />
            <text x="35" y="619" fill="#94a3b8" fontSize="9">Data Transforms</text>

            <rect x="20" y="624" width="10" height="10" rx="2" fill="#a78bfa" fillOpacity="0.7" />
            <text x="35" y="633" fill="#94a3b8" fontSize="9">Neural Network</text>

            <rect x="150" y="610" width="10" height="10" rx="2" fill="#fbbf24" fillOpacity="0.7" />
            <text x="165" y="619" fill="#94a3b8" fontSize="9">Math Operations</text>

            <rect x="150" y="624" width="10" height="10" rx="2" fill="#34d399" fillOpacity="0.7" />
            <text x="165" y="633" fill="#94a3b8" fontSize="9">Output</text>
          </svg>
        </div>
      </div>

      {/* Chapter Roadmap Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Chapter Roadmap
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {chapters.map((ch) => (
            <div
              key={ch.num}
              className={`bg-slate-800/60 rounded-lg border-l-[3px] ${ch.color} px-3 py-2.5 hover:bg-slate-800/90 transition-colors`}
            >
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Chapter {ch.num}
              </div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">
                {ch.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                {ch.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      pyHighlight={[[1, 7]]}
      jsHighlight={[[1, 7]]}
      title="The Complete Algorithm"
      blogExcerpt="This file contains the full algorithmic content of what is needed: dataset of documents, tokenizer, autograd engine, a GPT-2-like neural network architecture, the Adam optimizer, training loop, and inference loop. Everything else is just efficiency. I cannot simplify this any further."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
