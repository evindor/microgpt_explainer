import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import themes from './themes';

const swatchColors: Record<string, string> = {
  midnight: '#0f172a',
  monokai: '#272822',
  dracula: '#282a36',
  'solarized-dark': '#002b36',
  'solarized-light': '#fdf6e3',
  'github-light': '#ffffff',
};

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = themes.find(t => t.id === theme) ?? themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
        title="Change theme"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-slate-600"
          style={{ backgroundColor: swatchColors[theme] }}
        />
        <span className="text-[11px] font-medium hidden sm:inline">{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-500">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-slate-700 bg-slate-900 shadow-xl shadow-black/40 py-1 animate-fade-in">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
                t.id === theme
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0"
                style={{ backgroundColor: swatchColors[t.id] }}
              />
              <span className="text-xs font-medium">{t.label}</span>
              {!t.isDark && (
                <span className="ml-auto text-[9px] text-slate-500 uppercase tracking-wider">Light</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
