import type { ReactNode } from 'react';

interface LayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export default function Layout({ left, right }: LayoutProps) {
  return (
    <div className="flex h-full w-full animate-fade-in">
      {/* Left panel: explanations + visualizations */}
      <div className="w-1/2 h-full overflow-y-auto border-r border-slate-700/50 p-6">
        {left}
      </div>

      {/* Right panel: code + blog excerpts */}
      <div className="w-1/2 h-full bg-slate-950/50 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
