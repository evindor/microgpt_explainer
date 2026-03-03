/**
 * Numeric-only forward pass for microgpt inference.
 * No autograd, no Value class — pure number[] math.
 * Yields InferenceStepData per token for step-by-step visualization.
 */

import {
  N_EMBD, N_HEAD, HEAD_DIM, BLOCK_SIZE, N_LAYER,
  VOCAB_SIZE, BOS, UCHARS,
} from './microgpt-types.ts';
import type { SerializedStateDict, InferenceStepData } from './microgpt-types.ts';

/* ── Seeded RNG ──────────────────────────────────────────── */
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Math helpers ────────────────────────────────────────── */
function vAdd(a: number[], b: number[]): number[] {
  return a.map((ai, i) => ai + b[i]);
}

function vDot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function linear(x: number[], w: number[][]): number[] {
  return w.map(wo => vDot(wo, x));
}

function softmaxNum(logits: number[]): number[] {
  const maxVal = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function rmsnormNum(x: number[]): number[] {
  const ms = x.reduce((s, xi) => s + xi * xi, 0) / x.length;
  const scale = 1 / Math.sqrt(ms + 1e-5);
  return x.map(xi => xi * scale);
}

function weightedChoice(weights: number[], rand: () => number): number {
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/* ── Forward pass (single token) ─────────────────────────── */
interface ForwardResult {
  logits: number[];
  embedding: number[];
  attentionWeights: number[][];  // [N_HEAD][seqLen]
  mlpActivation: number[];
}

function forwardToken(
  tokenId: number,
  posId: number,
  keys: number[][][],    // [nLayer][seqLen][nEmbd]
  values: number[][][],  // [nLayer][seqLen][nEmbd]
  weights: SerializedStateDict,
): ForwardResult {
  const tokEmb = weights.wte[tokenId];
  const posEmb = weights.wpe[posId];
  let x = vAdd(tokEmb, posEmb);
  const embedding = [...x];
  x = rmsnormNum(x);

  const allAttnWeights: number[][] = [];
  let mlpActivation: number[] = [];

  for (let li = 0; li < N_LAYER; li++) {
    const xResidual1 = x;
    x = rmsnormNum(x);
    const q = linear(x, weights[`layer${li}.attn_wq`]);
    const k = linear(x, weights[`layer${li}.attn_wk`]);
    const v = linear(x, weights[`layer${li}.attn_wv`]);
    keys[li].push(k);
    values[li].push(v);

    const xAttn: number[] = new Array(N_EMBD).fill(0);
    for (let h = 0; h < N_HEAD; h++) {
      const hs = h * HEAD_DIM;
      const qH = q.slice(hs, hs + HEAD_DIM);

      // Compute attention logits for this head
      const attnLogits: number[] = [];
      for (let t = 0; t < keys[li].length; t++) {
        const kH = keys[li][t].slice(hs, hs + HEAD_DIM);
        attnLogits.push(vDot(qH, kH) / Math.sqrt(HEAD_DIM));
      }
      const attnW = softmaxNum(attnLogits);
      allAttnWeights.push([...attnW]);

      // Weighted sum of values
      for (let j = 0; j < HEAD_DIM; j++) {
        let sum = 0;
        for (let t = 0; t < values[li].length; t++) {
          sum += attnW[t] * values[li][t][hs + j];
        }
        xAttn[hs + j] = sum;
      }
    }

    x = linear(xAttn, weights[`layer${li}.attn_wo`]);
    x = vAdd(x, xResidual1);

    // MLP block
    const xResidual2 = x;
    x = rmsnormNum(x);
    x = linear(x, weights[`layer${li}.mlp_fc1`]);
    mlpActivation = [...x]; // capture pre-relu for visualization
    x = x.map(xi => Math.max(0, xi)); // ReLU
    x = linear(x, weights[`layer${li}.mlp_fc2`]);
    x = vAdd(x, xResidual2);
  }

  const logits = linear(x, weights.lm_head);
  return { logits, embedding, attentionWeights: allAttnWeights, mlpActivation };
}

/* ── Generator: yields one InferenceStepData per token ───── */
export function* generateName(
  weights: SerializedStateDict,
  temperature: number,
  seed: number,
): Generator<InferenceStepData> {
  const rand = createRng(seed);
  const keys: number[][][] = Array.from({ length: N_LAYER }, () => []);
  const vals: number[][][] = Array.from({ length: N_LAYER }, () => []);
  let tokenId = BOS;

  for (let posId = 0; posId < BLOCK_SIZE; posId++) {
    const { logits, embedding, attentionWeights, mlpActivation } = forwardToken(
      tokenId, posId, keys, vals, weights,
    );

    const scaledLogits = logits.map(l => l / temperature);
    const probs = softmaxNum(scaledLogits);
    const sampledToken = weightedChoice(probs, rand);

    yield {
      posId,
      inputToken: tokenId,
      inputChar: tokenId === BOS ? 'BOS' : UCHARS[tokenId],
      embedding,
      attentionWeights,
      mlpActivation,
      logits,
      probs,
      sampledToken,
      sampledChar: sampledToken === BOS ? 'BOS' : UCHARS[sampledToken],
    };

    if (sampledToken === BOS) break;
    tokenId = sampledToken;
  }
}
