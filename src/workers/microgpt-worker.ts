/**
 * Browser-adapted microgpt training in a Web Worker.
 * Algorithm copied from microgpt/microgpt.js, with:
 * - Node.js APIs removed
 * - Dataset received via postMessage
 * - Training loop yields progress via postMessage
 * - Supports pause/resume/stop
 */

import type { WorkerCommand, WorkerMessage, SerializedStateDict } from '../lib/microgpt-types.ts';

/* ── Seeded RNG (identical to microgpt.js) ───────────────── */
let _seed = 42;
function random(): number {
  _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss(mean: number, std: number): number {
  const u1 = random(), u2 = random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ── Value class (autograd, identical to microgpt.js) ────── */
class Value {
  data: number;
  grad: number;
  _children: Value[];
  _localGrads: number[];

  constructor(data: number, children: Value[] = [], localGrads: number[] = []) {
    this.data = data;
    this.grad = 0;
    this._children = children;
    this._localGrads = localGrads;
  }
  add(other: Value | number): Value {
    if (!(other instanceof Value)) other = new Value(other);
    return new Value(this.data + other.data, [this, other], [1, 1]);
  }
  mul(other: Value | number): Value {
    if (!(other instanceof Value)) other = new Value(other);
    return new Value(this.data * other.data, [this, other], [other.data, this.data]);
  }
  pow(n: number): Value { return new Value(this.data ** n, [this], [n * this.data ** (n - 1)]); }
  log(): Value { return new Value(Math.log(this.data), [this], [1 / this.data]); }
  exp(): Value { return new Value(Math.exp(this.data), [this], [Math.exp(this.data)]); }
  relu(): Value { return new Value(Math.max(0, this.data), [this], [this.data > 0 ? 1 : 0]); }
  neg(): Value { return this.mul(-1); }
  sub(other: Value | number): Value { return this.add(other instanceof Value ? other.neg() : new Value(-(other as number))); }
  div(other: Value | number): Value {
    if (!(other instanceof Value)) other = new Value(other);
    return this.mul(other.pow(-1));
  }
  backward(): void {
    const topo: Value[] = [], visited = new Set<Value>();
    const buildTopo = (v: Value): void => {
      if (!visited.has(v)) {
        visited.add(v);
        for (const child of v._children) buildTopo(child);
        topo.push(v);
      }
    };
    buildTopo(this);
    this.grad = 1;
    for (const v of topo.reverse()) {
      for (let i = 0; i < v._children.length; i++) {
        v._children[i].grad += v._localGrads[i] * v.grad;
      }
    }
  }
}

/* ── Array-of-Value helpers ──────────────────────────────── */
const vAdd = (a: Value[], b: Value[]): Value[] => a.map((ai, i) => ai.add(b[i]));
const vSum = (arr: Value[]): Value => arr.reduce((a, b) => a.add(b));
const vDot = (a: Value[], b: Value[]): Value => vSum(a.map((ai, i) => ai.mul(b[i])));

/* ── Model functions ─────────────────────────────────────── */
function linear(x: Value[], w: Value[][]): Value[] {
  return w.map(wo => vDot(wo, x));
}

function softmax(logits: Value[]): Value[] {
  const maxVal = Math.max(...logits.map(v => v.data));
  const exps = logits.map(v => v.sub(maxVal).exp());
  const total = vSum(exps);
  return exps.map(e => e.div(total));
}

function rmsnorm(x: Value[]): Value[] {
  const ms = vSum(x.map(xi => xi.mul(xi))).div(x.length);
  const scale = ms.add(1e-5).pow(-0.5);
  return x.map(xi => xi.mul(scale));
}

/* ── State ───────────────────────────────────────────────── */
let docs: string[] = [];
let uchars: string[] = [];
let BOS: number;
let vocabSize: number;

type StateDict = Record<string, Value[][]>;
let stateDict: StateDict = {};
let params: Value[] = [];

// Adam buffers
let m: number[] = [];
let v: number[] = [];

// Training control
let isPaused = false;
let isStopped = false;

/* ── Initialization ──────────────────────────────────────── */
function initModel(inputDocs: string[]): number {
  _seed = 42; // reset RNG for reproducibility
  docs = [...inputDocs];
  shuffle(docs);

  uchars = [...new Set(docs.join(''))].sort();
  BOS = uchars.length;
  vocabSize = uchars.length + 1;

  const nEmbd = 16, blockSize = 16, nLayer = 1;

  const matrix = (nout: number, nin: number, std = 0.08): Value[][] =>
    Array.from({ length: nout }, () => Array.from({ length: nin }, () => new Value(gauss(0, std))));

  stateDict = {
    wte: matrix(vocabSize, nEmbd),
    wpe: matrix(blockSize, nEmbd),
    lm_head: matrix(vocabSize, nEmbd),
  };
  for (let i = 0; i < nLayer; i++) {
    stateDict[`layer${i}.attn_wq`] = matrix(nEmbd, nEmbd);
    stateDict[`layer${i}.attn_wk`] = matrix(nEmbd, nEmbd);
    stateDict[`layer${i}.attn_wv`] = matrix(nEmbd, nEmbd);
    stateDict[`layer${i}.attn_wo`] = matrix(nEmbd, nEmbd);
    stateDict[`layer${i}.mlp_fc1`] = matrix(4 * nEmbd, nEmbd);
    stateDict[`layer${i}.mlp_fc2`] = matrix(nEmbd, 4 * nEmbd);
  }

  params = Object.values(stateDict).flat().flat();
  m = new Array(params.length).fill(0);
  v = new Array(params.length).fill(0);

  return params.length;
}

function gpt(tokenId: number, posId: number, keys: Value[][][], values: Value[][][]): Value[] {
  const nEmbd = 16, nHead = 4, headDim = 4, nLayer = 1;

  const tokEmb = stateDict.wte[tokenId];
  const posEmb = stateDict.wpe[posId];
  let x = vAdd(tokEmb, posEmb);
  x = rmsnorm(x);

  for (let li = 0; li < nLayer; li++) {
    let xResidual = x;
    x = rmsnorm(x);
    const q = linear(x, stateDict[`layer${li}.attn_wq`]);
    const k = linear(x, stateDict[`layer${li}.attn_wk`]);
    const vv = linear(x, stateDict[`layer${li}.attn_wv`]);
    keys[li].push(k);
    values[li].push(vv);
    const xAttn: Value[] = [];
    for (let h = 0; h < nHead; h++) {
      const hs = h * headDim;
      const qH = q.slice(hs, hs + headDim);
      const kH = keys[li].map(ki => ki.slice(hs, hs + headDim));
      const vH = values[li].map(vi => vi.slice(hs, hs + headDim));
      const attnLogits = kH.map(kt => vDot(qH, kt).div(Math.sqrt(headDim)));
      const attnWeights = softmax(attnLogits);
      for (let j = 0; j < headDim; j++) {
        xAttn.push(vSum(attnWeights.map((w, t) => w.mul(vH[t][j]))));
      }
    }
    x = linear(xAttn, stateDict[`layer${li}.attn_wo`]);
    x = vAdd(x, xResidual);

    xResidual = x;
    x = rmsnorm(x);
    x = linear(x, stateDict[`layer${li}.mlp_fc1`]);
    x = x.map(xi => xi.relu());
    x = linear(x, stateDict[`layer${li}.mlp_fc2`]);
    x = vAdd(x, xResidual);
  }

  return linear(x, stateDict.lm_head);
}

/* ── Serialize weights ───────────────────────────────────── */
function serializeWeights(): SerializedStateDict {
  const out: SerializedStateDict = {};
  for (const [key, mat] of Object.entries(stateDict)) {
    out[key] = mat.map(row => row.map(v => v.data));
  }
  return out;
}

/* ── Training loop ───────────────────────────────────────── */
async function train(numSteps: number): Promise<void> {
  const learningRate = 0.01, beta1 = 0.85, beta2 = 0.99, epsAdam = 1e-8;
  const nLayer = 1, blockSize = 16;
  const startTime = performance.now();
  isPaused = false;
  isStopped = false;

  for (let step = 0; step < numSteps; step++) {
    // Check pause/stop
    while (isPaused && !isStopped) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (isStopped) {
      post({ type: 'stopped', step, weights: serializeWeights() });
      return;
    }

    const doc = docs[step % docs.length];
    const tokens = [BOS, ...doc.split('').map(ch => uchars.indexOf(ch)), BOS];
    const n = Math.min(blockSize, tokens.length - 1);

    const keys: Value[][][] = Array.from({ length: nLayer }, () => []);
    const valuesArr: Value[][][] = Array.from({ length: nLayer }, () => []);
    const losses: Value[] = [];

    for (let posId = 0; posId < n; posId++) {
      const tokenId = tokens[posId];
      const targetId = tokens[posId + 1];
      const logits = gpt(tokenId, posId, keys, valuesArr);
      const probs = softmax(logits);
      losses.push(probs[targetId].log().neg());
    }

    const loss = vSum(losses).div(n);
    loss.backward();

    const lrT = learningRate * (1 - step / numSteps);
    for (let i = 0; i < params.length; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * params[i].grad;
      v[i] = beta2 * v[i] + (1 - beta2) * params[i].grad ** 2;
      const mHat = m[i] / (1 - beta1 ** (step + 1));
      const vHat = v[i] / (1 - beta2 ** (step + 1));
      params[i].data -= lrT * mHat / (Math.sqrt(vHat) + epsAdam);
      params[i].grad = 0;
    }

    const elapsedMs = performance.now() - startTime;
    post({
      type: 'progress',
      step: step + 1,
      totalSteps: numSteps,
      loss: loss.data,
      lr: lrT,
      elapsedMs,
    });

    // Yield to event loop every 5 steps so we can receive pause/stop messages
    if (step % 5 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const elapsedMs = performance.now() - startTime;
  post({
    type: 'done',
    weights: serializeWeights(),
    finalLoss: 0, // will be set from last progress
    totalSteps: numSteps,
    elapsedMs,
  });
}

/* ── Message handler ─────────────────────────────────────── */
function post(msg: WorkerMessage): void {
  self.postMessage(msg);
}

self.onmessage = (e: MessageEvent<WorkerCommand>) => {
  const cmd = e.data;
  switch (cmd.type) {
    case 'init': {
      const paramCount = initModel(cmd.docs);
      post({ type: 'init-done', paramCount });
      break;
    }
    case 'start':
      train(cmd.numSteps).catch(err => {
        post({ type: 'error', message: String(err) });
      });
      break;
    case 'pause':
      isPaused = true;
      break;
    case 'resume':
      isPaused = false;
      break;
    case 'stop':
      isStopped = true;
      break;
  }
};
