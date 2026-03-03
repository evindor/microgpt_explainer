import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import CodePanel from "../components/CodePanel";

const VOCAB = "abcdefghijklmnopqrstuvwxyz";
const BOS_ID = 26;

function charToId(ch: string): number {
  return VOCAB.indexOf(ch);
}

function tokenize(text: string): { char: string; id: number }[] {
  const tokens: { char: string; id: number }[] = [{ char: "BOS", id: BOS_ID }];
  for (const ch of text.toLowerCase()) {
    const id = charToId(ch);
    if (id >= 0) {
      tokens.push({ char: ch, id });
    }
  }
  tokens.push({ char: "BOS", id: BOS_ID });
  return tokens;
}

/** Map a token ID (0-26) to a color along a cyan -> amber -> rose gradient */
function tokenColor(id: number): { bg: string; border: string; text: string } {
  if (id === BOS_ID) {
    return {
      bg: "bg-violet-500/20",
      border: "border-violet-400/60",
      text: "text-violet-300",
    };
  }
  const t = id / 25; // 0..1
  if (t < 0.33) {
    return {
      bg: "bg-cyan-500/20",
      border: "border-cyan-400/60",
      text: "text-cyan-300",
    };
  }
  if (t < 0.66) {
    return {
      bg: "bg-amber-500/20",
      border: "border-amber-400/60",
      text: "text-amber-300",
    };
  }
  return {
    bg: "bg-rose-500/20",
    border: "border-rose-400/60",
    text: "text-rose-300",
  };
}

export default function Tokenization() {
  const [text, setText] = useState("emma");

  const tokens = useMemo(() => tokenize(text), [text]);

  const activeChars = useMemo(() => {
    const s = new Set<string>();
    for (const ch of text.toLowerCase()) {
      if (VOCAB.includes(ch)) s.add(ch);
    }
    return s;
  }, [text]);

  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 2: Tokenization
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          Teaching computers to read
        </p>
      </div>

      {/* Explanation */}
      <div className="space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          A <span className="text-cyan-400 font-medium">tokenizer</span>{" "}
          converts text into a sequence of integers called{" "}
          <span className="text-amber-400 font-medium">"token IDs"</span>.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          In microgpt, each unique character gets its own ID. The 26 letters{" "}
          <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            a-z
          </code>{" "}
          become IDs{" "}
          <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            0-25
          </code>
          , and a special{" "}
          <span className="text-violet-400 font-medium">BOS</span> token is ID{" "}
          <code className="text-violet-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            26
          </code>
          .
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          BOS stands for "Beginning of Sequence," but in microgpt it serves{" "}
          <span className="text-violet-400 font-medium">double duty</span>: it
          marks both the{" "}
          <span className="text-cyan-400 font-medium">beginning</span> and the{" "}
          <span className="text-rose-400 font-medium">end</span> of each name.
          The name "emma" becomes{" "}
          <code className="text-violet-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            [BOS, e, m, m, a, BOS]
          </code>
          .
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Why both ends? When the model sees BOS at the start, it learns{" "}
          <span className="text-cyan-400 font-medium">
            "a new name is starting."
          </span>{" "}
          When it predicts BOS as the next token, it means{" "}
          <span className="text-rose-400 font-medium">
            "I'm done with this name."
          </span>{" "}
          One token, two roles.
        </p>
      </div>

      {/* BOS Wrapping Visual */}
      <div className="viz-card glow-violet">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
          BOS: One Token, Two Roles
        </h2>
        <div className="flex items-center justify-center gap-1">
          {/* Leading BOS */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-violet-400/60 bg-violet-500/20 px-3 py-2 min-w-[48px] text-center">
              <span className="text-sm font-bold font-mono text-violet-300">
                [BOS]
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                26
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold mt-1 uppercase tracking-wide">
              start
            </span>
          </div>
          {/* Arrow */}
          <span className="text-slate-600 text-xs mx-0.5">&mdash;</span>
          {/* Letters */}
          {["e", "m", "m", "a"].map((ch, i) => {
            const id = charToId(ch);
            const color = tokenColor(id);
            return (
              <div key={`bos-demo-${i}`} className="flex flex-col items-center">
                <div
                  className={`rounded-lg border px-3 py-2 min-w-[48px] text-center ${color.bg} ${color.border}`}
                >
                  <span className={`text-sm font-bold font-mono ${color.text}`}>
                    {ch}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {id}
                  </div>
                </div>
                <span className="text-[10px] text-transparent mt-1">
                  &nbsp;
                </span>
              </div>
            );
          })}
          {/* Arrow */}
          <span className="text-slate-600 text-xs mx-0.5">&mdash;</span>
          {/* Trailing BOS */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-violet-400/60 bg-violet-500/20 px-3 py-2 min-w-[48px] text-center">
              <span className="text-sm font-bold font-mono text-violet-300">
                [BOS]
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                26
              </div>
            </div>
            <span className="text-[10px] text-rose-400 font-semibold mt-1 uppercase tracking-wide">
              stop
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">
          "emma" &rarr; [26, 4, 12, 12, 0, 26]
        </p>
      </div>

      {/* Interactive Tokenizer Demo */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Interactive Tokenizer
        </h2>

        {/* Input Field */}
        <input
          type="text"
          value={text}
          onChange={(e) =>
            setText(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))
          }
          placeholder="Type a name like 'emma'..."
          className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
        />

        {/* Token Visualization */}
        <div className="mt-4 flex flex-wrap gap-2 min-h-[60px] items-start">
          {tokens.map((tok, i) => {
            const color = tokenColor(tok.id);
            const isLeadingBOS = tok.char === "BOS" && i === 0;
            const isTrailingBOS = tok.char === "BOS" && i === tokens.length - 1;
            return (
              <div
                key={`${i}-${tok.char}-${tok.id}`}
                className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 min-w-[48px] ${color.bg} ${color.border} transition-all duration-300`}
                style={{
                  animation: `fadeIn 0.35s ease-out ${i * 0.07}s both`,
                }}
              >
                <span className={`text-sm font-bold font-mono ${color.text}`}>
                  {tok.char === "BOS" ? "[BOS]" : tok.char}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {tok.id}
                </span>
                {isLeadingBOS && (
                  <span className="text-[9px] text-cyan-400 font-semibold mt-0.5 uppercase tracking-wide">
                    start
                  </span>
                )}
                {isTrailingBOS && (
                  <span className="text-[9px] text-rose-400 font-semibold mt-0.5 uppercase tracking-wide">
                    stop
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Arrow showing full sequence */}
        {text.length > 0 && (
          <div className="mt-3 text-xs text-slate-400 font-mono bg-slate-900/60 rounded px-3 py-2">
            <span className="text-slate-500">&quot;{text}&quot;</span>
            <span className="text-slate-600 mx-2">&rarr;</span>
            <span className="text-amber-400/80">
              [{tokens.map((t) => t.id).join(", ")}]
            </span>
          </div>
        )}
      </div>

      {/* Vocabulary Table */}
      <div className="viz-card glow-amber">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
          Vocabulary
        </h2>
        <div className="grid grid-cols-9 gap-1.5">
          {VOCAB.split("").map((ch, i) => {
            const isActive = activeChars.has(ch);
            return (
              <div
                key={ch}
                className={`text-center rounded px-1 py-1.5 text-xs font-mono transition-all duration-200 border ${
                  isActive
                    ? "bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/10"
                    : "bg-slate-800/50 border-slate-700/30 text-slate-500"
                }`}
              >
                <span className="font-bold">{ch}</span>
                <span
                  className={isActive ? "text-amber-400/70" : "text-slate-600"}
                >
                  {" "}
                  &rarr;{" "}
                </span>
                <span>{i}</span>
              </div>
            );
          })}
          {/* BOS cell */}
          <div
            className={`text-center rounded px-1 py-1.5 text-xs font-mono transition-all duration-200 border ${
              text.length > 0
                ? "bg-violet-500/25 border-violet-400/50 text-violet-300 shadow-sm shadow-violet-400/10"
                : "bg-slate-800/50 border-slate-700/30 text-slate-500"
            }`}
          >
            <span className="font-bold">BOS</span>
            <span
              className={
                text.length > 0 ? "text-violet-400/70" : "text-slate-600"
              }
            >
              {" "}
              &rarr;{" "}
            </span>
            <span>26</span>
          </div>
        </div>
      </div>

      {/* Key Insight Box */}
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-1.5">
              Key Insight
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real GPT models like ChatGPT use "subword" tokenizers with
              ~100,000 tokens instead of 27. The word{" "}
              <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">
                "unhappiness"
              </code>{" "}
              might become{" "}
              <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">
                ["un", "happiness"]
              </code>{" "}
              or{" "}
              <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">
                ["un", "happ", "iness"]
              </code>
              . But the principle is identical:{" "}
              <span className="text-cyan-400 font-medium">
                text &rarr; numbers
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <CodePanel
      pyHighlight={[[23, 27]]}
      jsHighlight={[[23, 27]]}
      title="Tokenizer"
      blogExcerpt="Since neural networks require numbers, not characters, a tokenizer converts text to integer token IDs. The simplest approach assigns one integer per unique character."
    />
  );

  return <Layout left={leftContent} right={rightContent} />;
}
