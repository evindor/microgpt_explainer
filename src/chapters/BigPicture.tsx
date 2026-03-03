import Layout from "../components/Layout";
import { useCodePanel } from '../CodePanelContext';

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
  useCodePanel({
    pyHighlight: [[1, 7]],
    jsHighlight: [[1, 7]],
    title: "The Complete Algorithm",
    blogExcerpt: "This file contains the full algorithmic content of what is needed: dataset of documents, tokenizer, autograd engine, a GPT-2-like neural network architecture, the Adam optimizer, training loop, and inference loop. Everything else is just efficiency. I cannot simplify this any further.",
  });

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
          What if you could understand how ChatGPT works — really understand it
          — by reading just 200 lines of Python (or JavaScript)?
        </p>
      </div>

      {/* What is microgpt */}
      <div className="viz-card">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
          Meet microgpt
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Andrej Karpathy distilled a decade of research into a single, 200-line
          Python file. No libraries, no frameworks, no dependencies. Just the
          raw algorithm that trains and runs a GPT from scratch.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Andrej modestly calls it an art project — the irreducible core of all
          large language models. Everything ChatGPT, Claude, and Gemini do
          starts here. Everything else is just efficiency.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          For some of us, microgpt is not only an art project, but a brilliant
          learning opportunity. I created this site while studying microgpt to
          make sure I understand every concept in detail. This site assumes you
          can code, but know absolutely nothing about calculus, vectors,
          matrices and ML concepts. The goal of this site is to expand upon
          Andrej's wonderful project and make it even more accessible for people
          of differnt backgrounds to jump in.
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          This is the complete algorithm. If you can understand these 200 lines,
          you understand the foundation of every LLM in the world.
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
          These names don't exist in the training data. The model invented them.
          The same core algorithm, scaled up 1,000,000x, powers ChatGPT.
        </p>
      </div>

      {/* What you'll learn */}
      <div className="viz-card">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
          What you'll learn
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This interactive guide walks you through every line of microgpt, from
          raw text to a model that can generate new names. No math, ML, or CS
          degree required — just curiosity and a willingness to understand. The
          guide tries to follow Andrej's blog post and microgpt.py, but
          sometimes make detours to dive deeper and explain concepts that might
          seem basic to an ML researcher, but could be new or confusing to
          someone who's just getting into AI.
        </p>
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

  return <Layout left={leftContent} />;
}
