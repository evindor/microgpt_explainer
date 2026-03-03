/**
 * Shared types and constants for browser-based microgpt training & inference.
 */

/* ── Model hyperparameters (must match microgpt.js) ──────── */
export const N_EMBD = 16;
export const N_HEAD = 4;
export const HEAD_DIM = N_EMBD / N_HEAD; // 4
export const BLOCK_SIZE = 16;
export const N_LAYER = 1;
export const VOCAB_SIZE = 27;
export const BOS = 26;
export const UCHARS = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* ── Serialized weights ──────────────────────────────────── */
/** Plain number arrays — no Value objects, no autograd */
export type SerializedStateDict = Record<string, number[][]>;

export interface TrainingMeta {
  finalLoss: number;
  steps: number;
  date: string;         // ISO string
  elapsedMs: number;
}

/* ── Worker protocol ─────────────────────────────────────── */
export type WorkerCommand =
  | { type: 'init'; docs: string[] }
  | { type: 'start'; numSteps: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' };

export type WorkerMessage =
  | { type: 'init-done'; paramCount: number }
  | { type: 'progress'; step: number; totalSteps: number; loss: number; lr: number; elapsedMs: number }
  | { type: 'done'; weights: SerializedStateDict; finalLoss: number; totalSteps: number; elapsedMs: number }
  | { type: 'stopped'; step: number; weights: SerializedStateDict }
  | { type: 'error'; message: string };

/* ── Inference intermediates ─────────────────────────────── */
export interface InferenceStepData {
  posId: number;
  inputToken: number;          // token fed into model
  inputChar: string;           // human-readable
  embedding: number[];         // [N_EMBD] after tok+pos embedding
  attentionWeights: number[][]; // [N_HEAD][seqLen] — attention pattern for each head
  mlpActivation: number[];     // [4*N_EMBD] after ReLU (shows sparsity)
  logits: number[];            // [VOCAB_SIZE] raw logits
  probs: number[];             // [VOCAB_SIZE] after temperature softmax
  sampledToken: number;        // which token was sampled
  sampledChar: string;         // human-readable (or 'BOS')
}
