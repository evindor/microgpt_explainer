import { useState, useMemo, useCallback } from "react";
import { ChapterNavContext } from "./ChapterNavContext";
import type { ChapterNav } from "./ChapterNavContext";
import BigPicture from "./chapters/BigPicture";
import Dataset from "./chapters/Dataset";
import Tokenization from "./chapters/Tokenization";
import VectorsMatrices from "./chapters/VectorsMatrices";
import Embeddings from "./chapters/Embeddings";
import Autograd from "./chapters/Autograd";
import Parameters from "./chapters/Parameters";
import Attention from "./chapters/Attention";
import MLP from "./chapters/MLP";
import FullForwardPass from "./chapters/FullForwardPass";
import Training from "./chapters/Training";
import Inference from "./chapters/Inference";
import RealStuff from "./chapters/RealStuff";

const chapters = [
  {
    id: "big-picture",
    num: 0,
    title: "The Big Picture",
    icon: "🗺️",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500",
    text: "text-cyan-400",
    component: BigPicture,
  },
  {
    id: "dataset",
    num: 1,
    title: "The Dataset",
    icon: "📊",
    color: "from-lime-500/20 to-emerald-500/20",
    border: "border-lime-500",
    text: "text-lime-400",
    component: Dataset,
  },
  {
    id: "tokenization",
    num: 2,
    title: "Tokenization",
    icon: "🔤",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500",
    text: "text-emerald-400",
    component: Tokenization,
  },
  {
    id: "vectors",
    num: 3,
    title: "Vectors & Matrices",
    icon: "📐",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500",
    text: "text-blue-400",
    component: VectorsMatrices,
  },
  {
    id: "embeddings",
    num: 4,
    title: "Embeddings",
    icon: "🎯",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500",
    text: "text-amber-400",
    component: Embeddings,
  },
  {
    id: "autograd",
    num: 5,
    title: "Autograd Engine",
    icon: "⚡",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500",
    text: "text-violet-400",
    component: Autograd,
  },
  {
    id: "parameters",
    num: 6,
    title: "Parameters",
    icon: "🔧",
    color: "from-fuchsia-500/20 to-violet-500/20",
    border: "border-fuchsia-500",
    text: "text-fuchsia-400",
    component: Parameters,
  },
  {
    id: "attention",
    num: 7,
    title: "Attention",
    icon: "👁️",
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500",
    text: "text-rose-400",
    component: Attention,
  },
  {
    id: "mlp",
    num: 8,
    title: "MLP & Norms",
    icon: "🧠",
    color: "from-pink-500/20 to-fuchsia-500/20",
    border: "border-pink-500",
    text: "text-pink-400",
    component: MLP,
  },
  {
    id: "forward-pass",
    num: 9,
    title: "Full Forward Pass",
    icon: "🔄",
    color: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500",
    text: "text-teal-400",
    component: FullForwardPass,
  },
  {
    id: "training",
    num: 10,
    title: "Training",
    icon: "📉",
    color: "from-indigo-500/20 to-violet-500/20",
    border: "border-indigo-500",
    text: "text-indigo-400",
    component: Training,
  },
  {
    id: "inference",
    num: 11,
    title: "Inference",
    icon: "✨",
    color: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500",
    text: "text-orange-400",
    component: Inference,
  },
  {
    id: "real-stuff",
    num: 12,
    title: "From microgpt to ChatGPT",
    icon: "🚀",
    color: "from-sky-500/20 to-cyan-500/20",
    border: "border-sky-500",
    text: "text-sky-400",
    component: RealStuff,
  },
];

function App() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const ActiveComponent = chapters[activeChapter].component;
  const chapter = chapters[activeChapter];

  const goNext = useCallback(() => {
    setActiveChapter((i) => Math.min(chapters.length - 1, i + 1));
  }, []);

  const goPrev = useCallback(() => {
    setActiveChapter((i) => Math.max(0, i - 1));
  }, []);

  const navContext = useMemo<ChapterNav>(
    () => ({
      hasPrev: activeChapter > 0,
      hasNext: activeChapter < chapters.length - 1,
      prevTitle: activeChapter > 0 ? chapters[activeChapter - 1].title : "",
      nextTitle:
        activeChapter < chapters.length - 1
          ? chapters[activeChapter + 1].title
          : "",
      onPrev: goPrev,
      onNext: goNext,
    }),
    [activeChapter, goPrev, goNext],
  );

  return (
    <ChapterNavContext.Provider value={navContext}>
      <div className="h-screen w-screen flex bg-slate-900 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav
          className={`${sidebarCollapsed ? "w-14" : "w-64"} h-full bg-slate-950 border-r border-slate-800 flex flex-col transition-[width] duration-150 ease-out flex-shrink-0`}
        >
          {/* Header with toggle */}
          <div
            className={`${sidebarCollapsed ? "px-1.5 py-3 justify-center" : "px-4 py-3"} border-b border-slate-800 flex items-center gap-2 transition-[padding] duration-150`}
          >
            {!sidebarCollapsed && (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  μ
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-100">
                    MicroGPT
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Explorer
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`${sidebarCollapsed ? "w-9 h-9" : "w-6 h-6"} flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors duration-100 flex-shrink-0`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                className={`transition-transform duration-150 ${sidebarCollapsed ? "rotate-180" : ""}`}
              >
                <rect
                  x="1"
                  y="1"
                  width="12"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="5"
                  y1="1"
                  x2="5"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M9.5 5.5L7.5 7L9.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Chapter List */}
          <div className="flex-1 overflow-y-auto py-1">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(idx)}
                title={sidebarCollapsed ? `${ch.num}. ${ch.title}` : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"} transition-all duration-100 group relative ${
                  idx === activeChapter
                    ? `bg-gradient-to-r ${ch.color} border-l-2 ${ch.border}`
                    : "border-l-2 border-transparent hover:bg-slate-800/50"
                }`}
              >
                <span
                  className={`text-base flex-shrink-0 ${sidebarCollapsed ? "w-full text-center" : "w-7 text-center"}`}
                >
                  {ch.icon}
                </span>
                {!sidebarCollapsed && (
                  <div className="text-left min-w-0">
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        idx === activeChapter ? ch.text : "text-slate-600"
                      }`}
                    >
                      Chapter {ch.num}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        idx === activeChapter
                          ? "text-slate-200 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {ch.title}
                    </div>
                  </div>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-14 bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-md shadow-lg shadow-black/30 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-100 border border-slate-700/50">
                    <span className="text-slate-500 font-medium">
                      {ch.num}.
                    </span>{" "}
                    {ch.title}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-600 text-center">
                Based on{" "}
                <span className="text-slate-400">
                  <a
                    href="https://karpathy.github.io/2026/02/12/microgpt/"
                    target="_blank"
                  >
                    microgpt.py
                  </a>
                </span>{" "}
                by Karpathy
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-hidden">
          {/* Top bar */}
          <div className="h-11 border-b border-slate-800 flex items-center px-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{chapter.icon}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${chapter.text}`}
              >
                Chapter {chapter.num}
              </span>
              <span className="text-slate-600 text-xs">|</span>
              <span className="text-sm font-medium text-slate-200">
                {chapter.title}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[11px] text-slate-600 tabular-nums">
                {activeChapter + 1}/{chapters.length}
              </span>
            </div>
          </div>

          {/* Chapter Content */}
          <div
            className="h-[calc(100%-2.75rem)] overflow-hidden"
            key={activeChapter}
          >
            <ActiveComponent />
          </div>
        </main>
      </div>
    </ChapterNavContext.Provider>
  );
}

export default App;
