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
    name: "Tokenization",
    desc: "Converting text into numbers",
    color: "border-cyan-400",
  },
  {
    num: 2,
    name: "Autograd Engine",
    desc: "Automatic differentiation from scratch",
    color: "border-violet-400",
  },
  {
    num: 3,
    name: "Embeddings",
    desc: "Giving meaning to token IDs",
    color: "border-blue-400",
  },
  {
    num: 4,
    name: "Attention",
    desc: "How tokens talk to each other",
    color: "border-amber-400",
  },
  {
    num: 5,
    name: "MLP Layers",
    desc: "Adding nonlinear computation",
    color: "border-orange-400",
  },
  {
    num: 6,
    name: "Transformer",
    desc: "Stacking attention + MLP blocks",
    color: "border-rose-400",
  },
  {
    num: 7,
    name: "Training",
    desc: "Forward, loss, backward, update",
    color: "border-emerald-400",
  },
  {
    num: 8,
    name: "Inference",
    desc: "Generating text token by token",
    color: "border-pink-400",
  },
];

const codeString = `# microgpt.py - A GPT in 200 lines of pure Python
# by Andrej Karpathy

# 1. Dataset: load & prepare training data
# 2. Tokenizer: text <-> numbers
# 3. Autograd: automatic differentiation engine
# 4. Parameters: initialize model weights
# 5. Architecture: the GPT model (embeddings + attention + MLP)
# 6. Training: forward -> loss -> backward -> update
# 7. Inference: generate new text

import os, math, random

# --- Dataset ---
docs = [line.strip() for line in open('input.txt')]

# --- Tokenizer ---
uchars = sorted(set(''.join(docs)))
BOS = len(uchars)
vocab_size = len(uchars) + 1

# --- Autograd Engine ---
class Value:
    def __init__(self, data, children=(), local_grads=()):
        self.data = data
        self.grad = 0
        self._children = children
        self._local_grads = local_grads
    # ... operations: +, *, **, log, exp, relu ...
    def backward(self): ...

# --- Model Parameters ---
n_layer, n_embd, block_size, n_head = 1, 16, 16, 4
state_dict = { 'wte': ..., 'wpe': ..., 'lm_head': ..., ... }

# --- Architecture ---
def linear(x, w): ...    # matrix-vector multiply
def softmax(logits): ...  # convert to probabilities
def rmsnorm(x): ...       # normalize vectors
def gpt(token_id, pos_id, keys, values): ...  # THE model

# --- Training Loop ---
for step in range(1000):
    # forward pass -> loss -> backward -> Adam update
    ...

# --- Inference ---
for sample in range(20):
    # generate token by token
    ...`;

export default function BigPicture() {
  const leftContent = (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 0: The Big Picture
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          A bird's-eye view of the GPT architecture
        </p>
      </div>

      <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-4">
        <p className="text-sm text-slate-200 leading-relaxed">
          Welcome to the{" "}
          <span className="text-cyan-400 font-semibold">MicroGPT Explorer</span>
          ! We'll take you from zero to understanding how GPT works, step by
          step.
        </p>
      </div>

      {/* SVG Pipeline Diagram */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
          The GPT Pipeline
        </h2>
        <div className="flex justify-center overflow-x-auto">
          <svg
            viewBox="0 0 700 520"
            width="700"
            height="520"
            className="block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Cyan gradient - data transforms */}
              <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
              </linearGradient>
              {/* Violet gradient - neural network */}
              <linearGradient
                id="gradViolet"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
              </linearGradient>
              {/* Amber gradient - math ops */}
              <linearGradient
                id="gradAmber"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
              </linearGradient>
              {/* Emerald gradient - output */}
              <linearGradient
                id="gradEmerald"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
              </linearGradient>
              {/* Background glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Arrow marker */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>

            {/* ===== ROW 1: Text Input -> Tokenizer -> Token IDs ===== */}
            {/* Text Input box */}
            <rect
              x="20"
              y="20"
              width="180"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradCyan)"
              fillOpacity="0.2"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            <text
              x="110"
              y="42"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="14"
              fontWeight="600"
            >
              Text Input
            </text>
            <text
              x="110"
              y="60"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              "hello world"
            </text>

            {/* Arrow 1 */}
            <line
              x1="200"
              y1="47"
              x2="238"
              y2="47"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Tokenizer box */}
            <rect
              x="246"
              y="20"
              width="180"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradCyan)"
              fillOpacity="0.2"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            <text
              x="336"
              y="42"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="14"
              fontWeight="600"
            >
              Tokenizer
            </text>
            <text
              x="336"
              y="60"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              text &lt;-&gt; numbers
            </text>

            {/* Arrow 2 */}
            <line
              x1="426"
              y1="47"
              x2="464"
              y2="47"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Token IDs box */}
            <rect
              x="472"
              y="20"
              width="200"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradCyan)"
              fillOpacity="0.2"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            <text
              x="572"
              y="42"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="14"
              fontWeight="600"
            >
              Token IDs
            </text>
            <text
              x="572"
              y="60"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              [26, 7, 4, 11, 11, 14]
            </text>

            {/* ===== Vertical Arrow down from Token IDs ===== */}
            <line
              x1="572"
              y1="74"
              x2="572"
              y2="108"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* ===== ROW 2: Embeddings (centered under Token IDs) ===== */}
            <rect
              x="420"
              y="116"
              width="300"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradViolet)"
              fillOpacity="0.2"
              stroke="#a78bfa"
              strokeWidth="1.5"
            />
            <text
              x="570"
              y="138"
              textAnchor="middle"
              fill="#a78bfa"
              fontSize="14"
              fontWeight="600"
            >
              Embeddings
            </text>
            <text
              x="570"
              y="156"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              token + position vectors
            </text>

            {/* ===== Vertical Arrow down to Transformer ===== */}
            <line
              x1="570"
              y1="170"
              x2="570"
              y2="204"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* ===== ROW 3: Transformer Layers (large block) ===== */}
            <rect
              x="70"
              y="212"
              width="600"
              height="110"
              rx="14"
              ry="14"
              fill="url(#gradViolet)"
              fillOpacity="0.1"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <text
              x="370"
              y="236"
              textAnchor="middle"
              fill="#a78bfa"
              fontSize="13"
              fontWeight="700"
            >
              Transformer Layers
            </text>

            {/* Attention sub-box */}
            <rect
              x="100"
              y="248"
              width="240"
              height="54"
              rx="10"
              ry="10"
              fill="url(#gradViolet)"
              fillOpacity="0.25"
              stroke="#a78bfa"
              strokeWidth="1.5"
            />
            <text
              x="220"
              y="272"
              textAnchor="middle"
              fill="#c4b5fd"
              fontSize="13"
              fontWeight="600"
            >
              Self-Attention
            </text>
            <text
              x="220"
              y="290"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
            >
              Q * K^T / sqrt(d) &gt; V
            </text>

            {/* Arrow between attention and MLP */}
            <line
              x1="340"
              y1="275"
              x2="378"
              y2="275"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* MLP sub-box */}
            <rect
              x="386"
              y="248"
              width="240"
              height="54"
              rx="10"
              ry="10"
              fill="url(#gradViolet)"
              fillOpacity="0.25"
              stroke="#a78bfa"
              strokeWidth="1.5"
            />
            <text
              x="506"
              y="272"
              textAnchor="middle"
              fill="#c4b5fd"
              fontSize="13"
              fontWeight="600"
            >
              MLP (Feed-Forward)
            </text>
            <text
              x="506"
              y="290"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
            >
              linear &gt; ReLU &gt; linear
            </text>

            {/* ===== Vertical Arrow down from Transformer ===== */}
            <line
              x1="370"
              y1="322"
              x2="370"
              y2="356"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* ===== ROW 4: Output Logits -> Softmax -> Probabilities ===== */}
            {/* Output Logits */}
            <rect
              x="20"
              y="364"
              width="190"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradAmber)"
              fillOpacity="0.2"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <text
              x="115"
              y="386"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="600"
            >
              Output Logits
            </text>
            <text
              x="115"
              y="404"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              raw scores per token
            </text>

            {/* Arrow */}
            <line
              x1="210"
              y1="391"
              x2="248"
              y2="391"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Softmax */}
            <rect
              x="256"
              y="364"
              width="160"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradAmber)"
              fillOpacity="0.2"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <text
              x="336"
              y="386"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="600"
            >
              Softmax
            </text>
            <text
              x="336"
              y="404"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              exp(x) / sum(exp)
            </text>

            {/* Arrow */}
            <line
              x1="416"
              y1="391"
              x2="454"
              y2="391"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Probabilities */}
            <rect
              x="462"
              y="364"
              width="210"
              height="54"
              rx="12"
              ry="12"
              fill="url(#gradAmber)"
              fillOpacity="0.2"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <text
              x="567"
              y="386"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="600"
            >
              Probabilities
            </text>
            <text
              x="567"
              y="404"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              [0.01, 0.72, 0.03, ...]
            </text>

            {/* ===== Vertical Arrow down from Probabilities ===== */}
            <line
              x1="567"
              y1="418"
              x2="567"
              y2="452"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* ===== ROW 5: Sampled Token -> Text Output ===== */}
            {/* Sampled Token */}
            <rect
              x="270"
              y="460"
              width="200"
              height="50"
              rx="12"
              ry="12"
              fill="url(#gradEmerald)"
              fillOpacity="0.2"
              stroke="#34d399"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            <text
              x="370"
              y="482"
              textAnchor="middle"
              fill="#34d399"
              fontSize="14"
              fontWeight="600"
            >
              Sampled Token
            </text>
            <text
              x="370"
              y="498"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              pick from distribution
            </text>

            {/* Arrow */}
            <line
              x1="470"
              y1="485"
              x2="508"
              y2="485"
              stroke="#94a3b8"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Text Output */}
            <rect
              x="516"
              y="460"
              width="160"
              height="50"
              rx="12"
              ry="12"
              fill="url(#gradEmerald)"
              fillOpacity="0.2"
              stroke="#34d399"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            <text
              x="596"
              y="482"
              textAnchor="middle"
              fill="#34d399"
              fontSize="14"
              fontWeight="600"
            >
              Text Output
            </text>
            <text
              x="596"
              y="498"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              "hello worl..."
            </text>

            {/* ===== Category Legend ===== */}
            {/* Cyan legend */}
            <rect
              x="20"
              y="470"
              width="10"
              height="10"
              rx="2"
              fill="#22d3ee"
              fillOpacity="0.7"
            />
            <text x="35" y="479" fill="#94a3b8" fontSize="9">
              Data Transforms
            </text>

            {/* Violet legend */}
            <rect
              x="20"
              y="484"
              width="10"
              height="10"
              rx="2"
              fill="#a78bfa"
              fillOpacity="0.7"
            />
            <text x="35" y="493" fill="#94a3b8" fontSize="9">
              Neural Network
            </text>

            {/* Amber legend */}
            <rect
              x="130"
              y="470"
              width="10"
              height="10"
              rx="2"
              fill="#fbbf24"
              fillOpacity="0.7"
            />
            <text x="145" y="479" fill="#94a3b8" fontSize="9">
              Math Operations
            </text>

            {/* Emerald legend */}
            <rect
              x="130"
              y="484"
              width="10"
              height="10"
              rx="2"
              fill="#34d399"
              fillOpacity="0.7"
            />
            <text x="145" y="493" fill="#94a3b8" fontSize="9">
              Output
            </text>
          </svg>
        </div>
      </div>

      {/* What You'll Learn - Chapter Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          What You'll Learn
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
      code={codeString}
      title="microgpt.py — Overview"
      blogExcerpt="from the perspective of a model like ChatGPT, your conversation with it is just a funny looking 'document'"
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
