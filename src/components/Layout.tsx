import type { ReactNode } from 'react';
import { useContext } from 'react';
import { ChapterNavContext } from '../ChapterNavContext';

interface LayoutProps {
  left: ReactNode;
  right?: ReactNode; // kept for compat but ignored — CodePanel is now persistent in App
}

export default function Layout({ left }: LayoutProps) {
  const nav = useContext(ChapterNavContext);

  return (
    <div className="h-full w-full overflow-y-auto border-r border-slate-700/50 p-6 animate-fade-in">
      {left}

      {/* Chapter navigation buttons */}
      {nav && (
        <div className="mt-12 mb-4 flex items-center gap-3">
          {nav.hasPrev ? (
              <button
                onClick={nav.onPrev}
                className="flex-1 group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-left min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">Previous</div>
                  <div className="text-sm text-slate-300 group-hover:text-slate-100 truncate transition-colors">{nav.prevTitle}</div>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nav.hasNext ? (
              <button
                onClick={nav.onNext}
                className="flex-1 group flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-150"
              >
                <div className="text-right min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">Next</div>
                  <div className="text-sm text-slate-300 group-hover:text-slate-100 truncate transition-colors">{nav.nextTitle}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        )}
    </div>
  );
}
