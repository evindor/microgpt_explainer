import type { SerializedStateDict, TrainingMeta } from './microgpt-types.ts';

const WEIGHTS_KEY = 'microgpt-trained-weights';
const META_KEY = 'microgpt-training-meta';

export function loadWeights(): SerializedStateDict | null {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    return raw ? (JSON.parse(raw) as SerializedStateDict) : null;
  } catch {
    return null;
  }
}

export function saveWeights(weights: SerializedStateDict): void {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export function loadMeta(): TrainingMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as TrainingMeta) : null;
  } catch {
    return null;
  }
}

export function saveMeta(meta: TrainingMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function clearModel(): void {
  localStorage.removeItem(WEIGHTS_KEY);
  localStorage.removeItem(META_KEY);
}
