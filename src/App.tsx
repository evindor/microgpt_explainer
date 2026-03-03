import { useState } from 'react'
import BigPicture from './chapters/BigPicture'
import Tokenization from './chapters/Tokenization'
import VectorsMatrices from './chapters/VectorsMatrices'
import Autograd from './chapters/Autograd'
import Embeddings from './chapters/Embeddings'
import Attention from './chapters/Attention'
import MLP from './chapters/MLP'
import FullForwardPass from './chapters/FullForwardPass'
import Training from './chapters/Training'
import Inference from './chapters/Inference'

const chapters = [
  { id: 'big-picture', num: 0, title: 'The Big Picture', icon: '🗺️', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500', text: 'text-cyan-400', component: BigPicture },
  { id: 'tokenization', num: 1, title: 'Tokenization', icon: '🔤', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500', text: 'text-emerald-400', component: Tokenization },
  { id: 'vectors', num: 2, title: 'Vectors & Matrices', icon: '📐', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500', text: 'text-blue-400', component: VectorsMatrices },
  { id: 'autograd', num: 3, title: 'Autograd Engine', icon: '⚡', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500', text: 'text-violet-400', component: Autograd },
  { id: 'embeddings', num: 4, title: 'Embeddings', icon: '🎯', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500', text: 'text-amber-400', component: Embeddings },
  { id: 'attention', num: 5, title: 'Attention', icon: '👁️', color: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500', text: 'text-rose-400', component: Attention },
  { id: 'mlp', num: 6, title: 'MLP & Norms', icon: '🧠', color: 'from-pink-500/20 to-fuchsia-500/20', border: 'border-pink-500', text: 'text-pink-400', component: MLP },
  { id: 'forward-pass', num: 7, title: 'Full Forward Pass', icon: '🔄', color: 'from-teal-500/20 to-cyan-500/20', border: 'border-teal-500', text: 'text-teal-400', component: FullForwardPass },
  { id: 'training', num: 8, title: 'Training', icon: '📉', color: 'from-indigo-500/20 to-violet-500/20', border: 'border-indigo-500', text: 'text-indigo-400', component: Training },
  { id: 'inference', num: 9, title: 'Inference', icon: '✨', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500', text: 'text-orange-400', component: Inference },
]

function App() {
  const [activeChapter, setActiveChapter] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const ActiveComponent = chapters[activeChapter].component
  const chapter = chapters[activeChapter]

  return (
    <div className="h-screen w-screen flex bg-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} h-full bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              μ
            </div>
            {!sidebarCollapsed && (
              <div className="text-left">
                <div className="text-sm font-bold text-slate-100">MicroGPT</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Explorer</div>
              </div>
            )}
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto py-2">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setActiveChapter(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative ${
                idx === activeChapter
                  ? `bg-gradient-to-r ${ch.color} border-l-2 ${ch.border}`
                  : 'border-l-2 border-transparent hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base flex-shrink-0 w-7 text-center">{ch.icon}</span>
              {!sidebarCollapsed && (
                <div className="text-left min-w-0">
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${
                    idx === activeChapter ? ch.text : 'text-slate-600'
                  }`}>
                    Chapter {ch.num}
                  </div>
                  <div className={`text-xs truncate ${
                    idx === activeChapter ? 'text-slate-200 font-medium' : 'text-slate-400'
                  }`}>
                    {ch.title}
                  </div>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-16 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
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
              Based on <span className="text-slate-400">microgpt.py</span> by Karpathy
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden">
        {/* Top bar */}
        <div className={`h-11 border-b border-slate-800 flex items-center px-4 bg-slate-900/80 backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{chapter.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${chapter.text}`}>
              Chapter {chapter.num}
            </span>
            <span className="text-slate-600 text-xs">|</span>
            <span className="text-sm font-medium text-slate-200">{chapter.title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))}
              disabled={activeChapter === 0}
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-600">{activeChapter + 1} / {chapters.length}</span>
            <button
              onClick={() => setActiveChapter(Math.min(chapters.length - 1, activeChapter + 1))}
              disabled={activeChapter === chapters.length - 1}
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="h-[calc(100%-2.75rem)] overflow-hidden" key={activeChapter}>
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}

export default App
