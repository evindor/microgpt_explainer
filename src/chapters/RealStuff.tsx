import { useState } from 'react';
import Layout from '../components/Layout';
import CodePanel from '../components/CodePanel';

/* ------------------------------------------------------------------ */
/*  Scaling table data                                                 */
/* ------------------------------------------------------------------ */
const SCALING_ROWS: { label: string; micro: string; production: string }[] = [
  {
    label: 'Training data',
    micro: '32K baby names',
    production: 'Trillions of tokens (web pages, books, code)',
  },
  {
    label: 'Tokenizer',
    micro: 'Character tokenizer (27 tokens)',
    production: 'BPE subword tokenizer (~100K tokens)',
  },
  {
    label: 'Autograd engine',
    micro: 'Scalar autograd (Value class)',
    production: 'Tensor autograd on GPUs (PyTorch, CUDA, FlashAttention)',
  },
  {
    label: 'Model size',
    micro: '16-dim embeddings, 1 layer, 4 heads',
    production: '10,000+ dim, 100+ layers, 100+ heads',
  },
  {
    label: 'Parameters',
    micro: '4,192 parameters',
    production: 'Hundreds of billions to trillions',
  },
  {
    label: 'Training setup',
    micro: 'SGD/Adam on CPU, 1 doc at a time',
    production: 'Thousands of GPUs, millions of tokens per batch',
  },
  {
    label: 'Training time',
    micro: '1 minute to train',
    production: 'Months of training, millions of dollars',
  },
  {
    label: 'Inference',
    micro: 'Temperature sampling',
    production: 'Batching, KV cache paging, speculative decoding, quantization',
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Does the model "understand" anything?',
    answer:
      'The model is a math function. Parameters are adjusted to make the correct next token more probable. Whether this constitutes "understanding" is a philosophical question, not a technical one. The mechanism is fully contained in the 200 lines you have studied.',
  },
  {
    question: 'Why does it work?',
    answer:
      'Thousands of adjustable parameters, an optimizer that nudges each one every training step. Over many steps the parameters settle into values that capture statistical regularities in the data. The model does not learn explicit rules -- it learns a probability distribution that reflects them.',
  },
  {
    question: 'How is this related to ChatGPT?',
    answer:
      'Same core loop: predict next token, sample, repeat -- scaled up massively, with post-training to make the model conversational. The model is completing a document one token at a time, same as microgpt completing a name.',
  },
  {
    question: 'What about hallucinations?',
    answer:
      'The model generates from probability distributions. It has no concept of truth. microgpt "hallucinating" the name "karia" is the same mechanism as ChatGPT stating a false fact. Both are plausible-sounding completions that happen not to be real.',
  },
];

/* ------------------------------------------------------------------ */
/*  Production additions data                                          */
/* ------------------------------------------------------------------ */
const PRODUCTION_ADDITIONS: { name: string; detail: string }[] = [
  {
    name: 'BPE Tokenizer',
    detail:
      'Common words become single tokens. "running" might be one token instead of 7 characters. This makes the vocabulary larger but the sequences much shorter, so the model is far more efficient.',
  },
  {
    name: 'RoPE (Rotary Position Embeddings)',
    detail:
      'Instead of learning fixed position embeddings, encode relative positions using rotation matrices. This lets the model handle much longer sequences than it was trained on.',
  },
  {
    name: 'GQA (Grouped Query Attention)',
    detail:
      'Share key/value heads across multiple query heads to reduce memory usage. Same attention math, smaller memory footprint.',
  },
  {
    name: 'Mixture of Experts (MoE)',
    detail:
      'Only activate a subset of parameters for each token. A 1-trillion parameter model might only use 100 billion parameters per token, making inference faster without shrinking the model.',
  },
  {
    name: 'FlashAttention',
    detail:
      'Fuse all the attention operations (Q*K, softmax, multiply by V) into a single GPU kernel. The math is identical to what you learned -- it is purely a speed optimization.',
  },
];

/* ------------------------------------------------------------------ */
/*  Post-training pipeline steps                                       */
/* ------------------------------------------------------------------ */
const PIPELINE_STEPS: { title: string; subtitle: string; description: string; color: string }[] = [
  {
    title: 'Pretraining',
    subtitle: 'Document completion',
    description:
      'Train on trillions of tokens from the internet. The model learns to predict the next token. This is exactly what microgpt does -- just at a much larger scale.',
    color: 'cyan',
  },
  {
    title: 'SFT',
    subtitle: 'Supervised Fine-Tuning',
    description:
      'Replace the dataset with curated conversations between humans and an assistant. Keep training. Algorithmically, nothing changes -- the model still predicts the next token.',
    color: 'amber',
  },
  {
    title: 'RLHF',
    subtitle: 'Human Feedback',
    description:
      'The model generates responses, humans rate them, and the model learns from those ratings. The model is still predicting tokens, but now the training signal comes from human preferences.',
    color: 'emerald',
  },
  {
    title: 'ChatGPT / Claude',
    subtitle: 'Helpful assistant',
    description:
      'The result: a next-token predictor that has been shaped into a helpful, conversational assistant. The core algorithm never changed.',
    color: 'violet',
  },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function RealStuff() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  /* ---- Color helpers ---- */
  const pipelineColor = (color: string) => {
    const map: Record<string, { bg: string; border: string; text: string; glow: string }> = {
      cyan: { bg: 'bg-cyan-500/15', border: 'border-cyan-400/40', text: 'text-cyan-400', glow: 'shadow-cyan-400/10' },
      amber: { bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-400', glow: 'shadow-amber-400/10' },
      emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-400', glow: 'shadow-emerald-400/10' },
      violet: { bg: 'bg-violet-500/15', border: 'border-violet-400/40', text: 'text-violet-400', glow: 'shadow-violet-400/10' },
    };
    return map[color] ?? map.cyan;
  };

  /* ================================================================ */
  /*  Left panel                                                       */
  /* ================================================================ */
  const leftContent = (
    <div className="space-y-6">
      {/* ---- Chapter header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 12: From microgpt to ChatGPT
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          The same algorithm, at scale
        </p>
      </div>

      {/* ---- Section 1: The Core is the Same ---- */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">The Core is the Same</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          If you have read this far, you understand the algorithmic essence of ChatGPT, Claude, and
          every other large language model. Everything between microgpt and production LLMs is{' '}
          <span className="text-cyan-400 font-medium">engineering and scale</span> -- none of it
          changes the core algorithm.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          The model predicts the next token. Training adjusts the parameters so the correct token
          becomes more probable. Sampling picks from the resulting distribution. Repeat. That is it.
          That is the entire algorithm, from a 4,192-parameter toy to a trillion-parameter production
          system.
        </p>
      </div>

      {/* ---- Section 2: Scaling Comparison Table ---- */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Scaling Comparison
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Every concept you learned in microgpt has a direct counterpart in production LLMs.
        </p>

        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-[140px_1fr_24px_1fr] items-center gap-2 pb-2 border-b border-slate-700/40">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Concept</span>
            <span className="text-[10px] text-cyan-400/70 uppercase tracking-wider font-semibold">microgpt</span>
            <span />
            <span className="text-[10px] text-amber-400/70 uppercase tracking-wider font-semibold">Production LLMs</span>
          </div>

          {/* Table rows */}
          {SCALING_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[140px_1fr_24px_1fr] items-center gap-2 py-2 border-b border-slate-800/40"
              style={{ animation: `fadeIn 0.35s ease-out ${i * 0.06}s both` }}
            >
              {/* Label */}
              <span className="text-xs text-slate-400 font-medium">{row.label}</span>

              {/* microgpt value */}
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1.5">
                <span className="text-xs text-cyan-300 font-mono">{row.micro}</span>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-600">
                  <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Production value */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 px-2.5 py-1.5">
                <span className="text-xs text-amber-300 font-mono">{row.production}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Section 3: Key Production Additions ---- */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Key Production Additions</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          Production models include engineering refinements that do not exist in microgpt. None of
          them change the core algorithm -- they make it{' '}
          <span className="text-cyan-400 font-medium">faster</span>,{' '}
          <span className="text-amber-400 font-medium">more memory-efficient</span>, or able to
          handle{' '}
          <span className="text-emerald-400 font-medium">longer sequences</span>.
        </p>

        <div className="space-y-2">
          {PRODUCTION_ADDITIONS.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-700/40 bg-slate-800/30 px-4 py-3"
              style={{ animation: `fadeIn 0.35s ease-out ${i * 0.08}s both` }}
            >
              <h3 className="text-sm font-semibold text-cyan-400 mb-1">{item.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Section 4: Post-Training Pipeline ---- */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Post-Training: How a Document Completer Becomes a Chatbot</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          The pretrained model is just a document completer. It is not a helpful assistant -- it
          will happily continue any text you give it, whether that is a Wikipedia article, a code
          snippet, or gibberish. Turning it into a chatbot requires two additional training stages,
          but the underlying algorithm remains{' '}
          <span className="text-cyan-400 font-medium">exactly the same</span>.
        </p>
      </div>

      {/* Post-Training Pipeline Visualization */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Post-Training Pipeline
        </h2>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, i) => {
            const c = pipelineColor(step.color);
            return (
              <div key={i}>
                {/* Connecting arrow between steps */}
                {i > 0 && (
                  <div className="flex justify-center -mt-1 mb-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-slate-600">
                      <path d="M10 4v12M6 12l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                {/* Step card */}
                <div
                  className={`rounded-lg border ${c.border} ${c.bg} px-4 py-3 shadow-sm ${c.glow}`}
                  style={{ animation: `fadeIn 0.4s ease-out ${i * 0.12}s both` }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>
                      Step {i + 1}
                    </span>
                    <h3 className={`text-sm font-semibold ${c.text}`}>{step.title}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">({step.subtitle})</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Section 5: FAQ Accordion ---- */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className={`rounded-lg border transition-all duration-300 ${
                  isOpen
                    ? 'border-cyan-400/30 bg-cyan-500/5'
                    : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600/50'
                }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
                >
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    isOpen ? 'text-cyan-300' : 'text-slate-300'
                  }`}>
                    {item.question}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-slate-500 transition-transform duration-300 flex-shrink-0 ml-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Section 6: Key Insight Box ---- */}
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <span className="text-cyan-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-1.5">Key Insight</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              You now understand the complete algorithm behind every large language model. The rest
              -- BPE, RoPE, MoE, RLHF -- these are engineering refinements that make the same core
              work at scale. The 200 lines of microgpt contain the{' '}
              <span className="text-cyan-400 font-medium">mathematical soul</span> of it all.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  Right panel                                                      */
  /* ================================================================ */
  const rightContent = (
    <CodePanel
      pyHighlight={[[1, 7]]}
      jsHighlight={[[1, 7]]}
      title="The Complete Algorithm"
      blogExcerpt="All of these are important engineering and research contributions but if you understand microgpt, you understand the algorithmic essence."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
