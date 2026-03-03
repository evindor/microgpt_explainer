import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { useCodePanel } from '../CodePanelContext';

// Real names from the dataset (a representative sample)
const REAL_NAMES = [
  "emma",
  "olivia",
  "ava",
  "isabella",
  "sophia",
  "charlotte",
  "mia",
  "amelia",
  "harper",
  "evelyn",
  "abigail",
  "emily",
  "ella",
  "elizabeth",
  "camila",
  "luna",
  "sofia",
  "avery",
  "mila",
  "aria",
  "scarlett",
  "penelope",
  "layla",
  "chloe",
  "victoria",
  "madison",
  "eleanor",
  "grace",
  "nora",
  "riley",
  "zoey",
  "hannah",
  "hazel",
  "lily",
  "ellie",
  "violet",
  "lillian",
  "zoe",
  "stella",
  "aurora",
  "natalie",
  "emilia",
  "everly",
  "leah",
  "aubrey",
  "willow",
  "addison",
  "lucy",
  "audrey",
  "bella",
];

// Generated names from the trained model
const GENERATED_NAMES = [
  "kamon",
  "karai",
  "jaire",
  "vialan",
  "karia",
  "yeran",
  "areli",
  "kaina",
  "keylen",
  "liole",
  "alerin",
  "lenne",
  "kana",
  "lara",
  "tavian",
  "nelora",
  "brisa",
  "caelen",
  "jorin",
  "maliah",
];

// Pattern categories for the document explorer
const PATTERNS: {
  label: string;
  test: (name: string) => boolean;
  color: string;
}[] = [
  { label: 'Ends in "a"', test: (n) => n.endsWith("a"), color: "cyan" },
  { label: 'Ends in "y"', test: (n) => n.endsWith("y"), color: "amber" },
  {
    label: "Starts with vowel",
    test: (n) => "aeiou".includes(n[0]),
    color: "emerald",
  },
  { label: "5+ letters", test: (n) => n.length >= 5, color: "violet" },
  { label: "3-4 letters", test: (n) => n.length <= 4, color: "rose" },
];

// Quiz names: mix of real and generated, with answers
const QUIZ_ITEMS: { name: string; isReal: boolean }[] = [
  { name: "emma", isReal: true },
  { name: "kamon", isReal: false },
  { name: "sophia", isReal: true },
  { name: "vialan", isReal: false },
  { name: "harper", isReal: true },
  { name: "liole", isReal: false },
  { name: "luna", isReal: true },
  { name: "alerin", isReal: false },
  { name: "grace", isReal: true },
  { name: "nelora", isReal: false },
];

export default function Dataset() {
  // Document Explorer state
  const [activePattern, setActivePattern] = useState<number | null>(null);

  // Generated names animation state
  const [visibleGenCount, setVisibleGenCount] = useState(0);

  // Quiz state
  const [quizGuesses, setQuizGuesses] = useState<
    Record<number, "real" | "generated">
  >({});
  const [quizRevealed, setQuizRevealed] = useState(false);

  // Animate generated names appearing one at a time
  useEffect(() => {
    if (visibleGenCount < GENERATED_NAMES.length) {
      const timer = setTimeout(() => {
        setVisibleGenCount((c) => c + 1);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [visibleGenCount]);

  const quizScore = useCallback(() => {
    let correct = 0;
    for (const [idx, guess] of Object.entries(quizGuesses)) {
      const item = QUIZ_ITEMS[Number(idx)];
      const expected = item.isReal ? "real" : "generated";
      if (guess === expected) correct++;
    }
    return correct;
  }, [quizGuesses]);

  const handleQuizGuess = (index: number, guess: "real" | "generated") => {
    if (quizRevealed) return;
    setQuizGuesses((prev) => ({ ...prev, [index]: guess }));
  };

  const handleRevealQuiz = () => {
    setQuizRevealed(true);
  };

  const handleResetQuiz = () => {
    setQuizGuesses({});
    setQuizRevealed(false);
  };
  useCodePanel({
    pyHighlight: [[14, 21]],
    jsHighlight: [[10, 21]],
    title: "Dataset",
    blogExcerpt: "The fuel of large language models is a stream of text data, optionally separated into a set of documents. The goal of the model is to learn the patterns in the data and then generate similar new documents that share the statistical patterns within.",
  });


  const leftContent = (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Chapter 1: The Dataset
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          The fuel of language models
        </p>
      </div>

      {/* What is a dataset? */}
      <div className="space-y-3">
        <p className="text-slate-300 leading-relaxed text-sm">
          Every language model needs data to learn from. That data is called a{" "}
          <span className="text-cyan-400 font-medium">dataset</span> -- a
          collection of text documents. In a production system like ChatGPT,
          each "document" is a web page, a book chapter, or a forum post.
          Billions of them.
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          In microgpt, we keep things tiny. Each "document" is just a{" "}
          <span className="text-emerald-400 font-medium">name</span>. The full
          dataset contains{" "}
          <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            32,033
          </code>{" "}
          names like{" "}
          <span className="text-cyan-400 font-mono text-xs">emma</span>,{" "}
          <span className="text-cyan-400 font-mono text-xs">olivia</span>,{" "}
          <span className="text-cyan-400 font-mono text-xs">sophia</span>, and
          thousands more.
        </p>
      </div>

      {/* The Goal */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">The Goal</h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          The model's job is to learn the{" "}
          <span className="text-amber-400 font-medium">
            statistical patterns
          </span>{" "}
          hidden in these names. Which letters tend to follow which? How long
          are names usually? What combinations of letters feel "name-like"?
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Once trained, the model can{" "}
          <span className="text-emerald-400 font-medium">
            generate brand new names
          </span>{" "}
          that were never in the dataset but share those same patterns. It will
          "hallucinate" plausible names that sound real -- even though it
          invented them from scratch.
        </p>
      </div>

      {/* Visualization A: Document Explorer */}
      <div className="viz-card glow-emerald">
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Document Explorer
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Click a pattern to highlight matching names. These are real names from
          the dataset.
        </p>

        {/* Pattern filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PATTERNS.map((pattern, i) => {
            const isActive = activePattern === i;
            const colorMap: Record<string, string> = {
              cyan: isActive
                ? "bg-cyan-500/25 border-cyan-400/60 text-cyan-300"
                : "bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300",
              amber: isActive
                ? "bg-amber-500/25 border-amber-400/60 text-amber-300"
                : "bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-amber-400/40 hover:text-amber-300",
              emerald: isActive
                ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-300"
                : "bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300",
              violet: isActive
                ? "bg-violet-500/25 border-violet-400/60 text-violet-300"
                : "bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-violet-400/40 hover:text-violet-300",
              rose: isActive
                ? "bg-rose-500/25 border-rose-400/60 text-rose-300"
                : "bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-rose-400/40 hover:text-rose-300",
            };
            return (
              <button
                key={i}
                onClick={() => setActivePattern(isActive ? null : i)}
                className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${colorMap[pattern.color]}`}
              >
                {pattern.label}
              </button>
            );
          })}
        </div>

        {/* Names grid */}
        <div className="grid grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto">
          {REAL_NAMES.map((name) => {
            const matches =
              activePattern !== null && PATTERNS[activePattern].test(name);
            const dimmed = activePattern !== null && !matches;
            return (
              <div
                key={name}
                className={`text-center rounded px-1.5 py-1.5 text-xs font-mono transition-all duration-200 border ${
                  matches
                    ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-400/10"
                    : dimmed
                      ? "bg-slate-800/30 border-slate-700/20 text-slate-600"
                      : "bg-slate-800/50 border-slate-700/30 text-slate-300"
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>

        {/* Count and match info */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing 50 of{" "}
            <span className="text-amber-400 font-medium">32,033</span> names in
            the dataset
          </span>
          {activePattern !== null && (
            <span className="text-emerald-400">
              {REAL_NAMES.filter(PATTERNS[activePattern].test).length} matches
              shown
            </span>
          )}
        </div>
      </div>

      {/* The ChatGPT Analogy */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">
          The ChatGPT Connection
        </h2>
        <p className="text-slate-300 leading-relaxed text-sm">
          This might seem like a toy example, but the principle is exactly how
          ChatGPT works. From the perspective of a model like ChatGPT,{" "}
          <span className="text-cyan-400 font-medium">
            your conversation with it is just a funny looking "document"
          </span>
          . When you initialize the document with your prompt, the model's
          response from its perspective is just a{" "}
          <span className="text-amber-400 font-medium">
            statistical document completion
          </span>
          .
        </p>
        <p className="text-slate-300 leading-relaxed text-sm">
          Our tiny model completes "name documents" character by character.
          ChatGPT completes "conversation documents" token by token. Same idea,
          vastly different scale.
        </p>
      </div>

      {/* Visualization B: Real vs Generated + Quiz */}
      <div className="viz-card glow-cyan">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
          Real vs Generated
        </h2>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Real names column */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 text-center">
              Real Names (from dataset)
            </h3>
            <div className="space-y-1">
              {REAL_NAMES.slice(0, 10).map((name) => (
                <div
                  key={name}
                  className="text-center rounded px-2 py-1 text-xs font-mono bg-emerald-500/10 border border-emerald-400/20 text-emerald-300"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* Generated names column */}
          <div>
            <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2 text-center">
              Generated Names (from model)
            </h3>
            <div className="space-y-1">
              {GENERATED_NAMES.slice(0, 10).map((name, i) => (
                <div
                  key={name}
                  className={`text-center rounded px-2 py-1 text-xs font-mono bg-violet-500/10 border border-violet-400/20 text-violet-300 transition-all duration-300 ${
                    i < visibleGenCount
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insight Box */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <span className="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-1.5">
              Key Insight
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              The model has no concept of "names" -- it only sees patterns of
              characters. It does not know what a name is, what a person is, or
              what language is. The same algorithm could learn to generate city
              names, Pokemon names, your next essay or an email you have been
              dreading to write yourself. All it sees is:{" "}
              <span className="text-cyan-400 font-medium">
                which characters tend to follow which other characters
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return <Layout left={leftContent} />;
}
