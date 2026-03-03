import { createContext } from 'react';

export interface ChapterNav {
  hasPrev: boolean;
  hasNext: boolean;
  prevTitle: string;
  nextTitle: string;
  onPrev: () => void;
  onNext: () => void;
}

export const ChapterNavContext = createContext<ChapterNav | null>(null);
