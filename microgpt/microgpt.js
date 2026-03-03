/**
 * The most atomic way to train and run inference for a GPT
 * in pure, dependency-free JavaScript.
 * This file is the complete algorithm.
 * Everything else is just efficiency.
 *
 * @karpathy (translated from Python to JavaScript)
 */

import { readFileSync, existsSync } from "node:fs";

// Let there be a Dataset `docs`: string[] of documents (e.g. a list of names)
if (!existsSync("input.txt")) {
  // Original downloads from: https://raw.githubusercontent.com/karpathy/makemore/988aa59/names.txt
  throw new Error("Please download input.txt first");
}
const docs = readFileSync("input.txt", "utf-8")
  .split("\n")
  .filter((l) => l.trim());
shuffle(docs);
console.log(`num docs: ${docs.length}`);

// Let there be a Tokenizer to translate strings to sequences of integers ("tokens") and back
const uchars = [...new Set(docs.join(""))].sort(); // unique characters become token ids 0..n-1
const BOS = uchars.length; // token id for a special Beginning of Sequence (BOS) token
const vocabSize = uchars.length + 1; // total number of unique tokens, +1 is for BOS
console.log(`vocab size: ${vocabSize}`);

// Let there be Autograd to recursively apply the chain rule through a computation graph
class Value {
  constructor(data, children = [], localGrads = []) {
    this.data = data; // scalar value of this node calculated during forward pass
    this.grad = 0; // derivative of the loss w.r.t. this node, calculated in backward pass
    this._children = children; // children of this node in the computation graph
    this._localGrads = localGrads; // local derivative of this node w.r.t. its children
  }

  add(other) {
    if (!(other instanceof Value)) other = new Value(other);
    return new Value(this.data + other.data, [this, other], [1, 1]);
  }

  mul(other) {
    if (!(other instanceof Value)) other = new Value(other);
    return new Value(
      this.data * other.data,
      [this, other],
      [other.data, this.data],
    );
  }

  pow(n) {
    return new Value(this.data ** n, [this], [n * this.data ** (n - 1)]);
  }
  log() {
    return new Value(Math.log(this.data), [this], [1 / this.data]);
  }
  exp() {
    return new Value(Math.exp(this.data), [this], [Math.exp(this.data)]);
  }
  relu() {
    return new Value(Math.max(0, this.data), [this], [this.data > 0 ? 1 : 0]);
  }
  neg() {
    return this.mul(-1);
  }
  sub(other) {
    return this.add(other instanceof Value ? other.neg() : new Value(-other));
  }
  div(other) {
    if (!(other instanceof Value)) other = new Value(other);
    return this.mul(other.pow(-1));
  }

  backward() {
    const topo = [],
      visited = new Set();
    const buildTopo = (v) => {
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

// Array-of-Value helpers (replace Python's operator overloading on lists)
const vAdd = (a, b) => a.map((ai, i) => ai.add(b[i]));
const vSum = (arr) => arr.reduce((a, b) => a.add(b));
const vDot = (a, b) => vSum(a.map((ai, i) => ai.mul(b[i])));

// Initialize the parameters, to store the knowledge of the model
const nLayer = 1; // depth of the transformer neural network (number of layers)
const nEmbd = 16; // width of the network (embedding dimension)
const blockSize = 16; // maximum context length of the attention window (note: the longest name is 15 characters)
const nHead = 4; // number of attention heads
const headDim = nEmbd / nHead; // derived dimension of each head
const matrix = (nout, nin, std = 0.08) =>
  Array.from({ length: nout }, () =>
    Array.from({ length: nin }, () => new Value(gauss(0, std))),
  );
const stateDict = {
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
const params = Object.values(stateDict).flat().flat(); // flatten params into a single Value[]
console.log(`num params: ${params.length}`);

// Define the model architecture: a function mapping tokens and parameters to logits over what comes next
// Follow GPT-2, blessed among the GPTs, with minor differences: layernorm -> rmsnorm, no biases, GeLU -> ReLU
function linear(x, w) {
  return w.map((wo) => vDot(wo, x));
}

function softmax(logits) {
  const maxVal = Math.max(...logits.map((v) => v.data));
  const exps = logits.map((v) => v.sub(maxVal).exp());
  const total = vSum(exps);
  return exps.map((e) => e.div(total));
}

function rmsnorm(x) {
  const ms = vSum(x.map((xi) => xi.mul(xi))).div(x.length);
  const scale = ms.add(1e-5).pow(-0.5);
  return x.map((xi) => xi.mul(scale));
}

function gpt(tokenId, posId, keys, values) {
  const tokEmb = stateDict.wte[tokenId]; // token embedding
  const posEmb = stateDict.wpe[posId]; // position embedding
  let x = vAdd(tokEmb, posEmb); // joint token and position embedding
  x = rmsnorm(x); // note: not redundant due to backward pass via the residual connection

  for (let li = 0; li < nLayer; li++) {
    // 1) Multi-head Attention block
    let xResidual = x;
    x = rmsnorm(x);
    const q = linear(x, stateDict[`layer${li}.attn_wq`]);
    const k = linear(x, stateDict[`layer${li}.attn_wk`]);
    const v = linear(x, stateDict[`layer${li}.attn_wv`]);
    keys[li].push(k);
    values[li].push(v);
    const xAttn = [];
    for (let h = 0; h < nHead; h++) {
      const hs = h * headDim;
      const qH = q.slice(hs, hs + headDim);
      const kH = keys[li].map((ki) => ki.slice(hs, hs + headDim));
      const vH = values[li].map((vi) => vi.slice(hs, hs + headDim));
      const attnLogits = kH.map((kt) => vDot(qH, kt).div(Math.sqrt(headDim)));
      const attnWeights = softmax(attnLogits);
      for (let j = 0; j < headDim; j++) {
        xAttn.push(vSum(attnWeights.map((w, t) => w.mul(vH[t][j]))));
      }
    }
    x = linear(xAttn, stateDict[`layer${li}.attn_wo`]);
    x = vAdd(x, xResidual);
    // 2) MLP block
    xResidual = x;
    x = rmsnorm(x);
    x = linear(x, stateDict[`layer${li}.mlp_fc1`]);
    x = x.map((xi) => xi.relu());
    x = linear(x, stateDict[`layer${li}.mlp_fc2`]);
    x = vAdd(x, xResidual);
  }

  return linear(x, stateDict.lm_head);
}

// Let there be Adam, the blessed optimizer and its buffers
const learningRate = 0.01,
  beta1 = 0.85,
  beta2 = 0.99,
  epsAdam = 1e-8;
const m = new Array(params.length).fill(0); // first moment buffer
const v = new Array(params.length).fill(0); // second moment buffer

// Repeat in sequence
const numSteps = 1000; // number of training steps
for (let step = 0; step < numSteps; step++) {
  // Take single document, tokenize it, surround it with BOS special token on both sides
  const doc = docs[step % docs.length];
  const tokens = [BOS, ...doc.split("").map((ch) => uchars.indexOf(ch)), BOS];
  const n = Math.min(blockSize, tokens.length - 1);

  // Forward the token sequence through the model, building up the computation graph all the way to the loss
  const keys = Array.from({ length: nLayer }, () => []);
  const values = Array.from({ length: nLayer }, () => []);
  const losses = [];
  for (let posId = 0; posId < n; posId++) {
    const [tokenId, targetId] = [tokens[posId], tokens[posId + 1]];
    const logits = gpt(tokenId, posId, keys, values);
    const probs = softmax(logits);
    losses.push(probs[targetId].log().neg());
  }
  const loss = vSum(losses).div(n); // final average loss over the document sequence. May yours be low.

  // Backward the loss, calculating the gradients with respect to all model parameters
  loss.backward();

  // Adam optimizer update: update the model parameters based on the corresponding gradients
  const lrT = learningRate * (1 - step / numSteps); // linear learning rate decay
  for (let i = 0; i < params.length; i++) {
    m[i] = beta1 * m[i] + (1 - beta1) * params[i].grad;
    v[i] = beta2 * v[i] + (1 - beta2) * params[i].grad ** 2;
    const mHat = m[i] / (1 - beta1 ** (step + 1));
    const vHat = v[i] / (1 - beta2 ** (step + 1));
    params[i].data -= (lrT * mHat) / (Math.sqrt(vHat) + epsAdam);
    params[i].grad = 0;
  }

  process.stdout.write(
    `\rstep ${String(step + 1).padStart(4)} / ${numSteps} | loss ${loss.data.toFixed(4)}`,
  );
}

// Inference: may the model babble back to us
const temperature = 0.5; // in (0, 1], control the "creativity" of generated text, low to high
console.log("\n--- inference (new, hallucinated names) ---");
for (let sampleIdx = 0; sampleIdx < 20; sampleIdx++) {
  const keys = Array.from({ length: nLayer }, () => []);
  const values = Array.from({ length: nLayer }, () => []);
  let tokenId = BOS;
  const sample = [];
  for (let posId = 0; posId < blockSize; posId++) {
    const logits = gpt(tokenId, posId, keys, values);
    const probs = softmax(logits.map((l) => l.div(temperature)));
    tokenId = weightedChoice(probs.map((p) => p.data));
    if (tokenId === BOS) break;
    sample.push(uchars[tokenId]);
  }
  console.log(
    `sample ${String(sampleIdx + 1).padStart(2)}: ${sample.join("")}`,
  );
}

// === Some seeded random functions for compatability
// with original python source. No need to read this. ===
let _seed = 42; // Let there be order among chaos
function random() {
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss(mean, std) {
  // Gaussian random via Box-Muller
  const u1 = random(),
    u2 = random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function shuffle(arr) {
  // Fisher-Yates shuffle in-place
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function weightedChoice(weights) {
  // random.choices equivalent
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
// === End of compatability code ===
