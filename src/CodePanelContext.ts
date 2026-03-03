import { createContext, useContext, useEffect } from 'react';

type LineRange = [number, number];

export interface CodePanelConfig {
  pyHighlight: LineRange[];
  jsHighlight: LineRange[];
  title: string;
  blogExcerpt: string;
}

export interface CodePanelContextValue {
  config: CodePanelConfig;
  setConfig: (config: CodePanelConfig) => void;
}

export const CodePanelContext = createContext<CodePanelContextValue | null>(null);

/** Call from chapter components to configure the right-side CodePanel */
export function useCodePanel(config: CodePanelConfig) {
  const ctx = useContext(CodePanelContext);
  useEffect(() => {
    ctx?.setConfig(config);
  // Stringify to avoid re-firing on every render when arrays are recreated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);
}
