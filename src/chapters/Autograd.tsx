import { useState } from "react";
import Layout from "../components/Layout";
import { useCodePanel } from "../CodePanelContext";

/* ------------------------------------------------------------------ */
/*  Node positions for the computation graph                          */
/* ------------------------------------------------------------------ */
const NODES = {
  a: { x: 80, y: 80, label: "a", type: "value" as const },
  b: { x: 80, y: 220, label: "b", type: "value" as const },
  c: { x: 80, y: 360, label: "c", type: "value" as const },
  mul: { x: 250, y: 150, label: "\u00d7", type: "op" as const },
  add: { x: 400, y: 250, label: "+", type: "op" as const },
  sq: { x: 530, y: 250, label: "x\u00b2", type: "op" as const },
  loss: { x: 620, y: 250, label: "loss", type: "value" as const },
};

const EDGES: [keyof typeof NODES, keyof typeof NODES][] = [
  ["a", "mul"],
  ["b", "mul"],
  ["mul", "add"],
  ["c", "add"],
  ["add", "sq"],
  ["sq", "loss"],
];

/* ------------------------------------------------------------------ */
/*  Step descriptions                                                 */
/* ------------------------------------------------------------------ */
const FORWARD_STEPS = [
  {
    desc: "Inputs ready: a = 2, b = 3, c = 1",
    active: ["a", "b", "c"],
    values: {} as Record<string, string>,
  },
  {
    desc: "a \u00d7 b = 2 \u00d7 3 = 6",
    active: ["a", "b", "mul"],
    values: { mul: "6" },
  },
  {
    desc: "(a\u00d7b) + c = 6 + 1 = 7",
    active: ["mul", "c", "add"],
    values: { mul: "6", add: "7" },
  },
  {
    desc: "(a\u00d7b + c)\u00b2 = 7\u00b2 = 49",
    active: ["add", "sq", "loss"],
    values: { mul: "6", add: "7", sq: "49", loss: "49" },
  },
];

const BACKWARD_STEPS = [
  {
    desc: "Seed: \u2202loss/\u2202loss = 1",
    grads: { loss: "1" } as Record<string, string>,
    active: ["loss"],
    explanation:
      'Every backward pass starts the same way: the loss node gets a gradient of 1. This just means "the loss affects itself by exactly 1" \u2014 it\u2019s our starting point for tracing blame backward through the graph.',
  },
  {
    desc: "x\u00b2 derivative: 2 \u00d7 7 = 14",
    grads: { loss: "1", sq: "14" },
    active: ["loss", "sq"],
    explanation:
      "The x\u00b2 node computed 7\u00b2 = 49 during the forward pass. The derivative of x\u00b2 is 2x. Since the input was 7, the local gradient is 2 \u00d7 7 = 14. This means: if the input to x\u00b2 changed by 1, the output would change 14\u00d7 as much.",
  },
  {
    desc: "Grad flows through to the + node: 14",
    grads: { loss: "1", sq: "14", add: "14" },
    active: ["sq", "add"],
    explanation:
      "The x\u00b2 node has exactly one input: the + node. When there\u2019s only one path, the gradient passes straight through unchanged. The + node receives the full gradient of 14.",
  },
  {
    desc: "+ distributes grad equally: \u00d7 gets 14, c gets 14",
    grads: { loss: "1", sq: "14", add: "14", mul: "14", c: "14" },
    active: ["add", "mul", "c"],
    explanation:
      "Addition is the simplest operation in backprop: it copies the incoming gradient to both inputs equally. Both the \u00d7 node and c receive 14. Think about it: if you increase either input to a sum by 1, the sum also increases by 1 \u2014 so the rate of change is always 1 \u00d7 incoming gradient.",
  },
  {
    desc: "\u00d7 node: \u2202/\u2202a = b\u00d714 = 42,  \u2202/\u2202b = a\u00d714 = 28",
    grads: {
      loss: "1",
      sq: "14",
      add: "14",
      mul: "14",
      c: "14",
      a: "42",
      b: "28",
    },
    active: ["mul", "a", "b"],
    explanation:
      "Multiplication swaps and scales: to get a\u2019s gradient, multiply the other input (b = 3) by the incoming gradient (14), giving 3 \u00d7 14 = 42. For b, use a = 2, giving 2 \u00d7 14 = 28. This makes intuitive sense \u2014 the bigger your partner in a multiplication, the more your small change gets amplified.",
  },
];

/* ------------------------------------------------------------------ */
/*  Static value mapping for display inside nodes                     */
/* ------------------------------------------------------------------ */
const BASE_VALUES: Record<string, string> = {
  a: "2",
  b: "3",
  c: "1",
};

/* ------------------------------------------------------------------ */
/*  Gradient Accumulation interactive graph                           */
/* ------------------------------------------------------------------ */
const ACC_NODES = {
  a:   { x: 60,  y: 130, label: "a",  type: "value" as const },
  b:   { x: 60,  y: 270, label: "b",  type: "value" as const },
  mul: { x: 220, y: 200, label: "\u00d7", type: "op" as const },
  add: { x: 420, y: 200, label: "+", type: "op" as const },
  L:   { x: 560, y: 200, label: "L",  type: "value" as const },
};

const ACC_EDGES: [keyof typeof ACC_NODES, keyof typeof ACC_NODES][] = [
  ["a", "mul"],
  ["b", "mul"],
  ["mul", "add"],
  ["a", "add"],   // <-- the second path!
  ["add", "L"],
];

const ACC_BASE: Record<string, string> = { a: "2", b: "3" };

const ACC_FORWARD = [
  {
    desc: "Inputs ready: a = 2, b = 3",
    active: ["a", "b"],
    values: {} as Record<string, string>,
    explanation: "We start with two inputs. Notice that a connects to two places \u2014 both the \u00d7 node and the + node. This will matter during the backward pass.",
  },
  {
    desc: "c = a \u00d7 b = 2 \u00d7 3 = 6",
    active: ["a", "b", "mul"],
    values: { mul: "6" },
    explanation: "The multiplication node computes a \u00d7 b = 6. This result feeds into the + node.",
  },
  {
    desc: "L = c + a = 6 + 2 = 8",
    active: ["mul", "a", "add", "L"],
    values: { mul: "6", add: "8", L: "8" },
    explanation: "The + node adds the output of \u00d7 (which is 6) and a directly (which is 2), giving L = 8. Notice how a is used twice \u2014 once through \u00d7 and once directly.",
  },
];

const ACC_BACKWARD = [
  {
    desc: "Seed: \u2202L/\u2202L = 1",
    grads: { L: "1" } as Record<string, string>,
    active: ["L"],
    explanation: "We start at L with gradient 1, same as always.",
  },
  {
    desc: "+ passes grad 1 to both inputs",
    grads: { L: "1", add: "1", mul: "1" },
    active: ["L", "add"],
    explanation: "Addition copies its incoming gradient (1) to both inputs. The \u00d7 node gets 1, and a gets 1 through this direct path. But we\u2019re not done with a yet\u2026",
    pathHighlight: "both" as const,
  },
  {
    desc: "Path 2: + \u2192 a directly, a.grad += 1",
    grads: { L: "1", add: "1", mul: "1", a: "1" },
    active: ["add", "a"],
    explanation: "Through the direct connection (the lower edge), a receives a gradient of 1 from the + node. We write a.grad += 1, so a.grad is now 1. This is the first contribution.",
    pathHighlight: "path2" as const,
  },
  {
    desc: "Path 1: + \u2192 \u00d7 \u2192 a, gradient = b = 3",
    grads: { L: "1", add: "1", mul: "1", b: "2", a: "3+1" },
    active: ["mul", "a", "b"],
    explanation: "Now the \u00d7 node distributes its incoming gradient (1). For a: multiply by b = 3, giving 3. For b: multiply by a = 2, giving 2. We write a.grad += 3, so a.grad is now 1 + 3 = 4. This is the second contribution \u2014 the gradients accumulated!",
    pathHighlight: "path1" as const,
  },
  {
    desc: "Final: a.grad = 3 + 1 = 4",
    grads: { L: "1", add: "1", mul: "1", b: "2", a: "4" },
    active: ["a"],
    explanation: "a.grad = 4 because a influences L through two separate paths, and we added the contributions: 3 (through \u00d7) + 1 (direct) = 4. This is why the code uses += instead of = when accumulating gradients.",
    pathHighlight: "both" as const,
  },
];

function AccumulationGraph() {
  const [accMode, setAccMode] = useState<"idle" | "forward" | "backward">("idle");
  const [accStep, setAccStep] = useState(0);

  const steps = accMode === "forward" ? ACC_FORWARD : accMode === "backward" ? ACC_BACKWARD : [];
  const step = steps[accStep] as (typeof ACC_FORWARD)[number] & (typeof ACC_BACKWARD)[number] | undefined;
  const activeSet = new Set(step?.active ?? []);
  const maxStep = steps.length - 1;

  // values displayed inside nodes
  const vals: Record<string, string> = { ...ACC_BASE };
  if (accMode === "forward" && step?.values) Object.assign(vals, step.values);
  if (accMode === "backward") Object.assign(vals, ACC_FORWARD[ACC_FORWARD.length - 1].values);

  const grads: Record<string, string> = (accMode === "backward" ? step?.grads : {}) ?? {};

  // which nodes are visible so far (progressive reveal in forward)
  const visible = new Set<string>();
  if (accMode === "idle") {
    Object.keys(ACC_NODES).forEach((k) => visible.add(k));
  } else if (accMode === "forward") {
    for (let i = 0; i <= accStep; i++) ACC_FORWARD[i].active.forEach((k) => visible.add(k));
  } else {
    Object.keys(ACC_NODES).forEach((k) => visible.add(k));
  }

  // lit edges
  const litEdges = new Set<string>();
  if (step) {
    for (const [src, dst] of ACC_EDGES) {
      if (activeSet.has(src) && activeSet.has(dst)) litEdges.add(`${src}-${dst}`);
    }
  }

  // path highlight for backward (which of the two a→edges to emphasize)
  const pathHL = (accMode === "backward" && step && "pathHighlight" in step) ? (step as { pathHighlight?: string }).pathHighlight : undefined;

  const edgeColor = (src: string, dst: string) => {
    const key = `${src}-${dst}`;
    const isLit = litEdges.has(key);
    if (!isLit) return "var(--svg-grid)";
    if (accMode === "forward") return "var(--node-glow-forward)";
    // backward: highlight paths
    const isPath1 = (src === "a" && dst === "mul") || (src === "mul" && dst === "add");
    const isPath2 = (src === "a" && dst === "add");
    if (pathHL === "path1" && isPath1) return "#f472b6"; // pink
    if (pathHL === "path1" && isPath2) return "var(--svg-grid)";
    if (pathHL === "path2" && isPath2) return "#c084fc"; // purple
    if (pathHL === "path2" && !isPath2) return "var(--svg-grid)";
    return "var(--node-glow-backward)";
  };

  const renderEdge = (src: keyof typeof ACC_NODES, dst: keyof typeof ACC_NODES, idx: number) => {
    const s = ACC_NODES[src], d = ACC_NODES[dst];
    const dx = d.x - s.x, dy = d.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist, uy = dy / dist;
    const r = 26;
    const x1 = s.x + ux * r, y1 = s.y + uy * r;
    const x2 = d.x - ux * r, y2 = d.y - uy * r;
    const isLit = litEdges.has(`${src}-${dst}`);
    const color = edgeColor(src, dst);
    const bothVis = visible.has(src) && visible.has(dst);

    // Label for the two a→ edges in backward mode
    let label: string | null = null;
    if (accMode === "backward" && pathHL) {
      if (src === "a" && dst === "add") label = "path 2";
      if (src === "a" && dst === "mul") label = "path 1";
    }

    return (
      <g key={idx} style={{ transition: "opacity 0.4s", opacity: bothVis ? 1 : 0.1 }}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={isLit ? 2.5 : 1.5}
          markerEnd={
            color === "var(--svg-grid)" ? "url(#accArrowGray)"
              : accMode === "forward" ? "url(#accArrowCyan)"
              : "url(#accArrowRose)"
          }
          style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
        />
        {label && (
          <text
            x={(x1 + x2) / 2 + uy * 12}
            y={(y1 + y2) / 2 - ux * 12}
            textAnchor="middle"
            fill={color}
            fontSize={9}
            fontWeight={600}
            fontFamily="monospace"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const renderNode = (key: string) => {
    const node = ACC_NODES[key as keyof typeof ACC_NODES];
    const isActive = activeSet.has(key);
    const isVisible = visible.has(key);
    const fwd = accMode === "forward" && isActive;
    const bwd = accMode === "backward" && isActive;
    const val = vals[key];
    const grad = grads[key];
    const r = node.type === "op" ? 24 : 26;

    const fillColor = fwd ? "var(--node-glow-forward-bg)" : bwd ? "var(--node-glow-backward-bg)" : node.type === "op" ? "var(--node-bg)" : "var(--node-bg-deep)";
    const strokeColor = fwd ? "var(--node-glow-forward)" : bwd ? "var(--node-glow-backward)" : "var(--node-stroke)";
    const labelColor = fwd ? "var(--node-label-forward)" : bwd ? "var(--node-label-backward)" : "var(--node-label)";

    return (
      <g key={key} style={{ transition: "opacity 0.4s", opacity: isVisible ? 1 : 0.15 }}>
        {(fwd || bwd) && (
          <circle cx={node.x} cy={node.y} r={r + 5} fill="none" stroke={strokeColor} strokeWidth={2} opacity={0.6}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        {node.type === "op" ? (
          <rect
            x={node.x - 24} y={node.y - 20} width={48} height={40} rx={12}
            fill={fillColor} stroke={strokeColor} strokeWidth={1.5}
            style={{ transition: "fill 0.3s, stroke 0.3s" }}
          />
        ) : (
          <circle cx={node.x} cy={node.y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} style={{ transition: "fill 0.3s, stroke 0.3s" }} />
        )}
        <text x={node.x} y={node.y - (val ? 5 : 1)} textAnchor="middle" dominantBaseline="central" fill={labelColor} fontSize={13} fontWeight={700} fontFamily="monospace">
          {node.label}
        </text>
        {val && (
          <text x={node.x} y={node.y + 12} textAnchor="middle" dominantBaseline="central" fill={fwd ? "var(--node-glow-forward)" : bwd ? "var(--node-glow-backward)" : "var(--svg-label)"} fontSize={11} fontFamily="monospace" fontWeight={600}>
            {val}
          </text>
        )}
        {grad && (
          <g>
            <rect x={node.x - 30} y={node.y + r + 4} width={60} height={18} rx={4} fill="var(--node-grad-bg)" opacity={0.8} />
            <text x={node.x} y={node.y + r + 15} textAnchor="middle" fill="var(--node-grad)" fontSize={10} fontWeight={700} fontFamily="monospace">
              grad={grad}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">
          Why Gradients Accumulate
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setAccMode("forward"); setAccStep(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              accMode === "forward"
                ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700"
            }`}
          >
            Forward
          </button>
          <button
            onClick={() => { setAccMode("backward"); setAccStep(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              accMode === "backward"
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700"
            }`}
          >
            Backward
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        Here <code className="text-cyan-300">a</code> feeds into <em>two</em> places: the <code className="text-cyan-300">{"\u00d7"}</code> node and the <code className="text-cyan-300">+</code> node.
        This means gradients from both paths accumulate at <code className="text-cyan-300">a</code>.
      </p>

      <pre className="bg-slate-800/80 rounded-lg p-3 text-xs font-mono text-cyan-300 overflow-x-auto mb-3">
        {`a = Value(2.0)
b = Value(3.0)
c = a * b       # c = 6.0
L = c + a       # L = 8.0
L.backward()
print(a.grad)   # 4.0  ← why?`}
      </pre>

      <svg viewBox="0 0 620 340" width="100%" className="select-none" style={{ maxHeight: 340 }}>
        <defs>
          <marker id="accArrowCyan" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--node-glow-forward)" />
          </marker>
          <marker id="accArrowRose" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--node-glow-backward)" />
          </marker>
          <marker id="accArrowGray" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--node-stroke)" />
          </marker>
        </defs>

        {/* grid dots */}
        {Array.from({ length: 16 }).map((_, col) =>
          Array.from({ length: 9 }).map((_, row) => (
            <circle key={`${col}-${row}`} cx={col * 40 + 10} cy={row * 40 + 10} r={0.8} fill="var(--svg-grid)" opacity={0.4} />
          )),
        )}

        {ACC_EDGES.map(([s, d], i) => renderEdge(s, d, i))}
        {Object.keys(ACC_NODES).map((k) => renderNode(k))}
      </svg>

      {/* Step controls */}
      {accMode !== "idle" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => accStep > 0 && setAccStep((s) => s - 1)}
              disabled={accStep === 0}
              className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors"
            >
              &larr; Prev
            </button>
            <div className="flex-1 text-center">
              <span className="text-xs text-slate-500">Step {accStep + 1} / {maxStep + 1}</span>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${accMode === "forward" ? "bg-cyan-500" : "bg-rose-500"}`}
                  style={{ width: `${((accStep + 1) / (maxStep + 1)) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => accStep < maxStep && setAccStep((s) => s + 1)}
              disabled={accStep >= maxStep}
              className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors"
            >
              Next &rarr;
            </button>
          </div>
          <p className={`text-sm text-center font-medium ${accMode === "forward" ? "text-cyan-300" : "text-rose-300"}`}>
            {step?.desc}
          </p>
          {step?.explanation && (
            <div className={`mt-1 bg-slate-800/60 rounded-lg border px-3 py-2.5 ${accMode === "forward" ? "border-cyan-500/20" : "border-rose-500/20"}`}>
              <p className="text-xs text-slate-300 leading-relaxed">
                {step.explanation}
              </p>
            </div>
          )}
        </div>
      )}
      {accMode === "idle" && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          Click <span className="text-cyan-400">Forward</span> or{" "}
          <span className="text-rose-400">Backward</span> to see why <code className="text-amber-300 text-xs">a.grad = 4</code>.
        </p>
      )}

      {/* Takeaway — always visible */}
      <div className="mt-3 bg-slate-800/40 rounded-lg border border-slate-700/30 px-3 py-2.5">
        <p className="text-xs text-slate-300 leading-relaxed">
          This is why backprop uses{" "}
          <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">+=</code>{" "}
          instead of{" "}
          <code className="text-slate-400 bg-slate-800/50 px-1 rounded">=</code>{" "}
          when computing gradients:{" "}
          <span className="text-emerald-300 font-semibold">gradients accumulate from all paths.</span>{" "}
          If a parameter contributes to the loss through multiple routes, we add up all the contributions.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function Autograd() {
  const [mode, setMode] = useState<"idle" | "forward" | "backward">("idle");
  const [currentStep, setCurrentStep] = useState(0);

  /* derived state -------------------------------------------------- */
  const steps =
    mode === "forward"
      ? FORWARD_STEPS
      : mode === "backward"
        ? BACKWARD_STEPS
        : [];
  const step = steps[currentStep] as
    | ((typeof FORWARD_STEPS)[number] & (typeof BACKWARD_STEPS)[number])
    | undefined;
  const activeSet = new Set(step?.active ?? []);
  const displayValues: Record<string, string> = {
    ...BASE_VALUES,
    ...(mode === "forward" ? (step?.values ?? {}) : {}),
  };
  // In backward mode, keep all forward values visible
  if (mode === "backward") {
    Object.assign(
      displayValues,
      FORWARD_STEPS[FORWARD_STEPS.length - 1].values,
    );
  }
  const grads: Record<string, string> =
    (mode === "backward" ? step?.grads : {}) ?? {};

  const maxStep = steps.length - 1;

  /* handlers ------------------------------------------------------- */
  const startForward = () => {
    setMode("forward");
    setCurrentStep(0);
  };
  const startBackward = () => {
    setMode("backward");
    setCurrentStep(0);
  };
  const nextStep = () => {
    if (currentStep < maxStep) setCurrentStep((s) => s + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  /* Which edges should be lit ------------------------------------- */
  const litEdges = new Set<string>();
  if (step) {
    for (const [src, dst] of EDGES) {
      if (mode === "forward" && activeSet.has(src) && activeSet.has(dst))
        litEdges.add(`${src}-${dst}`);
      if (mode === "backward" && activeSet.has(src) && activeSet.has(dst))
        litEdges.add(`${src}-${dst}`);
    }
  }

  /* Visible nodes (in forward mode, only show nodes up to current) */
  const visibleNodes = new Set<string>();
  if (mode === "idle") {
    Object.keys(NODES).forEach((k) => visibleNodes.add(k));
  } else if (mode === "forward") {
    for (let i = 0; i <= currentStep; i++) {
      FORWARD_STEPS[i].active.forEach((k) => visibleNodes.add(k));
    }
  } else {
    Object.keys(NODES).forEach((k) => visibleNodes.add(k));
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */
  const renderNode = (key: string) => {
    const node = NODES[key as keyof typeof NODES];
    const isActive = activeSet.has(key);
    const isVisible = visibleNodes.has(key);
    const hasGrad = key in grads;
    const val = displayValues[key];

    const forwardGlow = mode === "forward" && isActive;
    const backwardGlow = mode === "backward" && isActive;

    if (node.type === "op") {
      // Rounded rectangle for operation nodes
      const w = 52,
        h = 40;
      return (
        <g
          key={key}
          style={{ transition: "opacity 0.4s", opacity: isVisible ? 1 : 0.15 }}
        >
          {/* glow */}
          {forwardGlow && (
            <rect
              x={node.x - w / 2 - 4}
              y={node.y - h / 2 - 4}
              width={w + 8}
              height={h + 8}
              rx={14}
              fill="none"
              stroke="var(--node-glow-forward)"
              strokeWidth={2}
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </rect>
          )}
          {backwardGlow && (
            <rect
              x={node.x - w / 2 - 4}
              y={node.y - h / 2 - 4}
              width={w + 8}
              height={h + 8}
              rx={14}
              fill="none"
              stroke="var(--node-glow-backward)"
              strokeWidth={2}
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </rect>
          )}
          <rect
            x={node.x - w / 2}
            y={node.y - h / 2}
            width={w}
            height={h}
            rx={12}
            fill={
              forwardGlow
                ? "var(--node-glow-forward-bg)"
                : backwardGlow
                  ? "var(--node-glow-backward-bg)"
                  : "var(--node-bg)"
            }
            stroke={
              forwardGlow
                ? "var(--node-glow-forward)"
                : backwardGlow
                  ? "var(--node-glow-backward)"
                  : "var(--node-stroke)"
            }
            strokeWidth={1.5}
            style={{ transition: "fill 0.3s, stroke 0.3s" }}
          />
          <text
            x={node.x}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill={
              forwardGlow
                ? "var(--node-glow-forward)"
                : backwardGlow
                  ? "var(--node-glow-backward)"
                  : "var(--svg-muted)"
            }
            fontSize={16}
            fontWeight={700}
            fontFamily="monospace"
          >
            {node.label}
          </text>
          {/* value label below op node */}
          {val && (
            <text
              x={node.x}
              y={node.y + h / 2 + 14}
              textAnchor="middle"
              fill="var(--node-value)"
              fontSize={11}
              fontFamily="monospace"
              fontWeight={600}
              style={{ transition: "opacity 0.3s" }}
            >
              = {val}
            </text>
          )}
          {/* gradient label above op node */}
          {hasGrad && (
            <text
              x={node.x}
              y={node.y - h / 2 - 8}
              textAnchor="middle"
              fill="var(--node-grad)"
              fontSize={11}
              fontWeight={700}
              fontFamily="monospace"
            >
              grad={grads[key]}
            </text>
          )}
        </g>
      );
    }

    // Circle for value nodes
    const r = 28;
    return (
      <g
        key={key}
        style={{ transition: "opacity 0.4s", opacity: isVisible ? 1 : 0.15 }}
      >
        {/* glow */}
        {forwardGlow && (
          <circle
            cx={node.x}
            cy={node.y}
            r={r + 5}
            fill="none"
            stroke="var(--node-glow-forward)"
            strokeWidth={2}
            opacity={0.6}
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        {backwardGlow && (
          <circle
            cx={node.x}
            cy={node.y}
            r={r + 5}
            fill="none"
            stroke="var(--node-glow-backward)"
            strokeWidth={2}
            opacity={0.6}
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill={
            forwardGlow
              ? "var(--node-glow-forward-bg)"
              : backwardGlow
                ? "var(--node-glow-backward-bg)"
                : "var(--node-bg-deep)"
          }
          stroke={
            forwardGlow
              ? "var(--node-glow-forward)"
              : backwardGlow
                ? "var(--node-glow-backward)"
                : "var(--node-stroke)"
          }
          strokeWidth={1.5}
          style={{ transition: "fill 0.3s, stroke 0.3s" }}
        />
        {/* label */}
        <text
          x={node.x}
          y={node.y - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill={
            forwardGlow
              ? "var(--node-label-forward)"
              : backwardGlow
                ? "var(--node-label-backward)"
                : "var(--node-label)"
          }
          fontSize={13}
          fontWeight={700}
          fontFamily="monospace"
        >
          {node.label}
        </text>
        {/* value inside */}
        {val && (
          <text
            x={node.x}
            y={node.y + 12}
            textAnchor="middle"
            dominantBaseline="central"
            fill={
              forwardGlow
                ? "var(--node-glow-forward)"
                : backwardGlow
                  ? "var(--node-glow-backward)"
                  : "var(--svg-label)"
            }
            fontSize={12}
            fontFamily="monospace"
            fontWeight={600}
          >
            {val}
          </text>
        )}
        {/* gradient */}
        {hasGrad && (
          <g>
            <rect
              x={node.x - 28}
              y={node.y + r + 4}
              width={56}
              height={18}
              rx={4}
              fill="var(--node-grad-bg)"
              opacity={0.8}
            />
            <text
              x={node.x}
              y={node.y + r + 15}
              textAnchor="middle"
              fill="var(--node-grad)"
              fontSize={10}
              fontWeight={700}
              fontFamily="monospace"
            >
              grad={grads[key]}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderEdge = (
    src: keyof typeof NODES,
    dst: keyof typeof NODES,
    idx: number,
  ) => {
    const s = NODES[src];
    const d = NODES[dst];
    const edgeKey = `${src}-${dst}`;
    const isLit = litEdges.has(edgeKey);
    const isForward = mode === "forward" && isLit;
    const isBackward = mode === "backward" && isLit;

    // Calculate edge points offset from node centers
    const dx = d.x - s.x;
    const dy = d.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;

    // Offset from source (circle or rect)
    const srcR = s.type === "op" ? 28 : 28;
    const dstR = d.type === "op" ? 28 : 28;
    const x1 = s.x + ux * srcR;
    const y1 = s.y + uy * srcR;
    const x2 = d.x - ux * dstR;
    const y2 = d.y - uy * dstR;

    const bothVisible = visibleNodes.has(src) && visibleNodes.has(dst);

    return (
      <g
        key={idx}
        style={{ transition: "opacity 0.4s", opacity: bothVisible ? 1 : 0.1 }}
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={
            isForward
              ? "var(--node-glow-forward)"
              : isBackward
                ? "var(--node-glow-backward)"
                : "var(--svg-grid)"
          }
          strokeWidth={isLit ? 2.5 : 1.5}
          markerEnd={
            isForward
              ? "url(#arrowCyan)"
              : isBackward
                ? "url(#arrowRose)"
                : "url(#arrowGray)"
          }
          style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
        />
      </g>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Build the left panel                                             */
  /* ---------------------------------------------------------------- */
  useCodePanel({
    pyHighlight: [[29, 72]],
    jsHighlight: [[29, 93]],
    title: "Autograd Engine",
    blogExcerpt:
      "The backward() method traverses the computation graph in reverse topological order, applying the chain rule to compute gradients for all parameters.",
  });

  const leftContent = (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Chapter 3: Autograd Engine
        </h2>
        <p className="text-sm text-cyan-400 mt-1 font-medium">
          Teaching the computer to learn from mistakes
        </p>
      </div>

      {/* Explanation paragraphs */}
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          To train a model, we need to know:{" "}
          <span className="text-cyan-300 font-semibold">
            if I slightly change any parameter, how does the final error change?
          </span>{" "}
          This is called a <em className="text-amber-300">"gradient"</em>.
        </p>
        <p>
          microgpt builds a{" "}
          <span className="text-cyan-300 font-semibold">computation graph</span>{" "}
          &mdash; a chain of operations where each node remembers its inputs. We
          can then "reverse" through this graph to compute all gradients
          automatically.
        </p>
        <p>
          Think of it like a{" "}
          <span className="text-emerald-300 font-semibold">
            trail of breadcrumbs
          </span>
          : as we compute forward, we leave a trail. Then we follow it backward
          to distribute blame for the error.
        </p>
      </div>

      {/* ============================================================ */}
      {/*  What is a Derivative?                                       */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
          Wait &mdash; What is a Derivative?
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            If you have never taken calculus, the word "derivative" might sound
            intimidating. But the idea is simple:{" "}
            <span className="text-cyan-300 font-semibold">
              a derivative tells you: if I nudge this input a tiny bit, how much
              does the output change?
            </span>
          </p>
          <p>
            <span className="text-emerald-300 font-semibold">
              Everyday example:
            </span>{" "}
            Imagine you are driving. Your <em>position</em> changes by 60 miles
            in 1 hour. Your speed &mdash; the derivative of position with
            respect to time &mdash; is 60 mph. The derivative simply measures
            the <em className="text-amber-300">rate of change</em>.
          </p>
          <p>
            Now apply this to a neural network: our model has thousands of
            adjustable numbers (parameters). For <em>each</em> parameter we need
            to ask:{" "}
          </p>
          <blockquote className="border-l-2 border-cyan-500/60 pl-3 my-2 text-cyan-200 italic">
            "If I nudge this number up a little, does the loss go up or down,
            and by how much?"
            <span className="block text-xs text-slate-500 mt-1 not-italic">
              &mdash; Andrej Karpathy
            </span>
          </blockquote>
          <p>
            That answer &mdash; for every single parameter &mdash; is what we
            call the <em className="text-amber-300">gradient</em>. The
            computation graph below is the machine that lets us compute all of
            those answers efficiently, in one backward sweep.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Interactive Computation Graph SVG                            */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Computation Graph &mdash;{" "}
            <code className="text-cyan-400">loss = (a*b + c)&sup2;</code>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={startForward}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === "forward"
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700"
              }`}
            >
              Forward Pass
            </button>
            <button
              onClick={startBackward}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === "backward"
                  ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700"
              }`}
            >
              Backward Pass
            </button>
          </div>
        </div>

        {/* SVG Graph */}
        <svg
          viewBox="0 0 680 420"
          width="100%"
          className="select-none"
          style={{ maxHeight: 420 }}
        >
          <defs>
            <marker
              id="arrowCyan"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={7}
              markerHeight={7}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--node-glow-forward)" />
            </marker>
            <marker
              id="arrowRose"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={7}
              markerHeight={7}
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="var(--node-glow-backward)"
              />
            </marker>
            <marker
              id="arrowGray"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={7}
              markerHeight={7}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--node-stroke)" />
            </marker>
            {/* Glow filters */}
            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood
                floodColor="var(--node-glow-forward)"
                floodOpacity="0.4"
              />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowRose" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood
                floodColor="var(--node-glow-backward)"
                floodOpacity="0.4"
              />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid dots */}
          {Array.from({ length: 17 }).map((_, col) =>
            Array.from({ length: 11 }).map((_, row) => (
              <circle
                key={`${col}-${row}`}
                cx={col * 42 + 8}
                cy={row * 40 + 10}
                r={0.8}
                fill="var(--svg-grid)"
                opacity={0.4}
              />
            )),
          )}

          {/* Edges */}
          {EDGES.map(([src, dst], i) => renderEdge(src, dst, i))}

          {/* Nodes */}
          {Object.keys(NODES).map((k) => renderNode(k))}
        </svg>

        {/* Step controls & description */}
        {mode !== "idle" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors"
              >
                &larr; Prev
              </button>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500">
                  Step {currentStep + 1} / {maxStep + 1}
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      mode === "forward" ? "bg-cyan-500" : "bg-rose-500"
                    }`}
                    style={{
                      width: `${((currentStep + 1) / (maxStep + 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={nextStep}
                disabled={currentStep >= maxStep}
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors"
              >
                Next &rarr;
              </button>
            </div>
            <p
              className={`text-sm text-center font-medium ${
                mode === "forward" ? "text-cyan-300" : "text-rose-300"
              }`}
            >
              {step?.desc}
            </p>
            {mode === "backward" &&
              BACKWARD_STEPS[currentStep]?.explanation && (
                <div className="mt-2 bg-slate-800/60 rounded-lg border border-rose-500/20 px-3 py-2.5">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {BACKWARD_STEPS[currentStep].explanation}
                  </p>
                </div>
              )}
          </div>
        )}
        {mode === "idle" && (
          <p className="mt-3 text-xs text-slate-500 text-center">
            Click <span className="text-cyan-400">Forward Pass</span> or{" "}
            <span className="text-rose-400">Backward Pass</span> to animate the
            computation graph.
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Gradient Rules Table                                        */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Chain Rule Reference
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-semibold">
                Operation
              </th>
              <th className="text-left py-2 px-3 text-cyan-400 font-semibold">
                Forward
              </th>
              <th className="text-left py-2 px-3 text-rose-400 font-semibold">
                Backward (local gradients)
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <tr className="border-b border-slate-800/50">
              <td className="py-2.5 px-3 text-slate-300">a + b</td>
              <td className="py-2.5 px-3 text-cyan-300">a + b</td>
              <td className="py-2.5 px-3 text-rose-300">
                &part;/&part;a = 1, &nbsp; &part;/&part;b = 1
              </td>
            </tr>
            <tr className="border-b border-slate-800/50">
              <td className="py-2.5 px-3 text-slate-300">a &times; b</td>
              <td className="py-2.5 px-3 text-cyan-300">a &times; b</td>
              <td className="py-2.5 px-3 text-rose-300">
                &part;/&part;a = b, &nbsp; &part;/&part;b = a
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-slate-300">a&sup2;</td>
              <td className="py-2.5 px-3 text-cyan-300">a&sup2;</td>
              <td className="py-2.5 px-3 text-rose-300">&part;/&part;a = 2a</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================================ */}
      {/*  Chain Rule Intuition (car/bicycle/man)                      */}
      {/* ============================================================ */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          The Chain Rule in Plain English
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            The "chain rule" in the table above might look like scary math, but
            it is just multiplication along a path. Here is an analogy from
            Karpathy's blog:
          </p>
          <blockquote className="border-l-2 border-emerald-500/60 pl-3 my-2 text-emerald-200 italic">
            "If a car travels twice as fast as a bicycle and the bicycle is four
            times as fast as a walking man, then the car travels 2 &times; 4 = 8
            times as fast as the man."
          </blockquote>
          <p>
            The chain rule works the same way: to find how the loss changes when
            you wiggle an input,{" "}
            <span className="text-cyan-300 font-semibold">
              multiply the rates of change along the path
            </span>{" "}
            from that input to the loss. That is literally all it is &mdash;
            multiplying numbers together along a chain.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Gradient Accumulation Example — Interactive                  */}
      {/* ============================================================ */}
      <AccumulationGraph />

      {/* ============================================================ */}
      {/*  Key Insight                                                 */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-rose-950/40 rounded-xl border border-cyan-700/30 p-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          Key Insight
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed">
          This is exactly what{" "}
          <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">
            loss.backward()
          </code>{" "}
          does in microgpt! It walks backward through every operation, applying
          the chain rule to compute how each parameter affects the loss. With{" "}
          <span className="text-amber-300 font-semibold">4,192 parameters</span>
          , this tells us exactly how to adjust each one to reduce the error.
        </p>
        <p className="text-sm text-slate-200 leading-relaxed mt-3">
          <span className="text-amber-300 font-semibold">The wiggle test:</span>{" "}
          In the accumulation example above,{" "}
          <code className="text-cyan-300 bg-slate-800/50 px-1 rounded">
            a.grad = 4.0
          </code>{" "}
          means: if you increase <code className="text-cyan-300">a</code> by
          0.001, <code className="text-cyan-300">L</code> increases by about
          0.004. The gradient tells you the{" "}
          <span className="text-emerald-300 font-semibold">direction</span>{" "}
          (positive or negative, from the sign) and the{" "}
          <span className="text-emerald-300 font-semibold">steepness</span> (how
          strongly it pulls, from the magnitude) of each parameter's influence
          on the loss.
        </p>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Right panel: CodePanel                                           */
  /* ---------------------------------------------------------------- */

  return <Layout left={leftContent} />;
}
