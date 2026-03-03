import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SerializedStateDict, TrainingMeta } from '../lib/microgpt-types.ts';
import { loadWeights, saveWeights, loadMeta, saveMeta, clearModel as clearStorage } from '../lib/modelStorage.ts';

interface ModelContextValue {
  weights: SerializedStateDict | null;
  meta: TrainingMeta | null;
  isModelReady: boolean;
  storeWeights: (w: SerializedStateDict, m: TrainingMeta) => void;
  clearModel: () => void;
  workerRef: React.MutableRefObject<Worker | null>;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [weights, setWeights] = useState<SerializedStateDict | null>(() => loadWeights());
  const [meta, setMeta] = useState<TrainingMeta | null>(() => loadMeta());
  const workerRef = useRef<Worker | null>(null);

  const storeWeights = useCallback((w: SerializedStateDict, m: TrainingMeta) => {
    setWeights(w);
    setMeta(m);
    saveWeights(w);
    saveMeta(m);
  }, []);

  const clearModelCb = useCallback(() => {
    setWeights(null);
    setMeta(null);
    clearStorage();
  }, []);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return (
    <ModelContext.Provider
      value={{
        weights,
        meta,
        isModelReady: weights !== null,
        storeWeights,
        clearModel: clearModelCb,
        workerRef,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}
