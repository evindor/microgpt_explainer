export default function GptPipelineDiagram() {
  return (
    <div className="viz-card glow-violet">
      <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
        The GPT Pipeline
      </h2>
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox="0 0 700 650"
          width="700"
          height="650"
          className="block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor="var(--accent-cyan-strong)"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-cyan-strong)"
                stopOpacity="0.7"
              />
            </linearGradient>
            <linearGradient
              id="gradViolet"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-violet-strong)"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-violet-strong)"
                stopOpacity="0.7"
              />
            </linearGradient>
            <linearGradient
              id="gradAmber"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-amber-strong)"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-amber-strong)"
                stopOpacity="0.7"
              />
            </linearGradient>
            <linearGradient
              id="gradEmerald"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-emerald-strong)"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-emerald-strong)"
                stopOpacity="0.7"
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="var(--svg-muted)" />
            </marker>
          </defs>

          {/* ===== ROW 1: Text Input -> Tokenizer -> Token IDs ===== */}
          <rect
            x="20"
            y="20"
            width="180"
            height="54"
            rx="12"
            ry="12"
            fill="url(#gradCyan)"
            fillOpacity="0.2"
            stroke="var(--accent-cyan)"
            strokeWidth="1.5"
          />
          <text
            x="110"
            y="42"
            textAnchor="middle"
            fill="var(--accent-cyan)"
            fontSize="14"
            fontWeight="600"
          >
            Text Input
          </text>
          <text
            x="110"
            y="60"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="11"
          >
            "emma"
          </text>

          <line
            x1="200"
            y1="47"
            x2="238"
            y2="47"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="246"
            y="20"
            width="180"
            height="54"
            rx="12"
            ry="12"
            fill="url(#gradCyan)"
            fillOpacity="0.2"
            stroke="var(--accent-cyan)"
            strokeWidth="1.5"
          />
          <text
            x="336"
            y="42"
            textAnchor="middle"
            fill="var(--accent-cyan)"
            fontSize="14"
            fontWeight="600"
          >
            Tokenizer
          </text>
          <text
            x="336"
            y="60"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="11"
          >
            char &lt;-&gt; integer
          </text>

          <line
            x1="426"
            y1="47"
            x2="464"
            y2="47"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="472"
            y="20"
            width="200"
            height="54"
            rx="12"
            ry="12"
            fill="url(#gradCyan)"
            fillOpacity="0.2"
            stroke="var(--accent-cyan)"
            strokeWidth="1.5"
          />
          <text
            x="572"
            y="42"
            textAnchor="middle"
            fill="var(--accent-cyan)"
            fontSize="14"
            fontWeight="600"
          >
            Token IDs
          </text>
          <text
            x="572"
            y="60"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="11"
          >
            [26, 4, 12, 12, 0]
          </text>

          {/* ===== Arrow down to Embeddings ===== */}
          <line
            x1="572"
            y1="74"
            x2="572"
            y2="108"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* ===== ROW 2: Embeddings + RMSNorm ===== */}
          <rect
            x="370"
            y="116"
            width="300"
            height="54"
            rx="12"
            ry="12"
            fill="url(#gradViolet)"
            fillOpacity="0.2"
            stroke="var(--accent-violet)"
            strokeWidth="1.5"
          />
          <text
            x="520"
            y="138"
            textAnchor="middle"
            fill="var(--accent-violet)"
            fontSize="14"
            fontWeight="600"
          >
            Embeddings + RMSNorm
          </text>
          <text
            x="520"
            y="156"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="11"
          >
            token + position vectors, normalized
          </text>

          {/* ===== Arrow down to Transformer ===== */}
          <line
            x1="520"
            y1="170"
            x2="520"
            y2="206"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* ===== ROW 3: Transformer Layers ===== */}
          <rect
            x="40"
            y="214"
            width="630"
            height="170"
            rx="14"
            ry="14"
            fill="url(#gradViolet)"
            fillOpacity="0.1"
            stroke="var(--accent-violet)"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          <text
            x="355"
            y="234"
            textAnchor="middle"
            fill="var(--accent-violet)"
            fontSize="12"
            fontWeight="700"
          >
            Transformer Layers (repeat per layer)
          </text>

          {/* --- Attention sub-row --- */}
          <text
            x="72"
            y="279"
            fill="var(--svg-muted)"
            fontSize="9"
            fontWeight="500"
          >
            norm
          </text>
          <line
            x1="93"
            y1="275"
            x2="108"
            y2="275"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="112"
            y="257"
            width="195"
            height="36"
            rx="8"
            ry="8"
            fill="url(#gradViolet)"
            fillOpacity="0.25"
            stroke="var(--accent-violet)"
            strokeWidth="1.5"
          />
          <text
            x="210"
            y="273"
            textAnchor="middle"
            fill="var(--accent-violet)"
            fontSize="12"
            fontWeight="600"
          >
            Self-Attention
          </text>
          <text
            x="210"
            y="287"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="9"
          >
            {"softmax(QK/\u221Ad) \u00B7 V"}
          </text>

          <line
            x1="307"
            y1="275"
            x2="326"
            y2="275"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />

          <circle
            cx="340"
            cy="275"
            r="11"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1.5"
          />
          <text
            x="340"
            y="280"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="14"
            fontWeight="700"
          >
            +
          </text>

          <path
            d="M 62 268 C 62 244, 340 244, 340 264"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          <text
            x="200"
            y="250"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="8"
            opacity="0.7"
          >
            residual
          </text>

          <line
            x1="351"
            y1="275"
            x2="630"
            y2="275"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.4"
          />

          <line
            x1="355"
            y1="286"
            x2="355"
            y2="325"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* --- MLP sub-row --- */}
          <text
            x="72"
            y="347"
            fill="var(--svg-muted)"
            fontSize="9"
            fontWeight="500"
          >
            norm
          </text>
          <line
            x1="93"
            y1="343"
            x2="108"
            y2="343"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="112"
            y="325"
            width="195"
            height="36"
            rx="8"
            ry="8"
            fill="url(#gradViolet)"
            fillOpacity="0.25"
            stroke="var(--accent-violet)"
            strokeWidth="1.5"
          />
          <text
            x="210"
            y="341"
            textAnchor="middle"
            fill="var(--accent-violet)"
            fontSize="12"
            fontWeight="600"
          >
            MLP (Feed-Forward)
          </text>
          <text
            x="210"
            y="355"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="9"
          >
            {"linear \u2192 ReLU \u2192 linear"}
          </text>

          <line
            x1="307"
            y1="343"
            x2="326"
            y2="343"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />

          <circle
            cx="340"
            cy="343"
            r="11"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1.5"
          />
          <text
            x="340"
            y="348"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="14"
            fontWeight="700"
          >
            +
          </text>

          <path
            d="M 62 336 C 62 312, 340 312, 340 332"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          <text
            x="200"
            y="318"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="8"
            opacity="0.7"
          >
            residual
          </text>

          <line
            x1="351"
            y1="343"
            x2="630"
            y2="343"
            stroke="var(--svg-muted)"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.4"
          />

          {/* ===== Arrow down from Transformer to lm_head ===== */}
          <line
            x1="355"
            y1="384"
            x2="355"
            y2="406"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* ===== ROW 3.5: lm_head linear projection ===== */}
          <rect
            x="245"
            y="412"
            width="220"
            height="38"
            rx="10"
            ry="10"
            fill="url(#gradViolet)"
            fillOpacity="0.2"
            stroke="var(--accent-violet)"
            strokeWidth="1.5"
          />
          <text
            x="355"
            y="430"
            textAnchor="middle"
            fill="var(--accent-violet)"
            fontSize="12"
            fontWeight="600"
          >
            lm_head (Linear)
          </text>
          <text
            x="355"
            y="444"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="9"
          >
            16-dim hidden state → 27 logits
          </text>

          {/* ===== Arrow down to Softmax row ===== */}
          <line
            x1="355"
            y1="450"
            x2="355"
            y2="472"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* ===== ROW 4: Softmax -> Probabilities ===== */}
          <rect
            x="120"
            y="478"
            width="180"
            height="48"
            rx="12"
            ry="12"
            fill="url(#gradAmber)"
            fillOpacity="0.2"
            stroke="var(--accent-amber)"
            strokeWidth="1.5"
          />
          <text
            x="210"
            y="498"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="13"
            fontWeight="600"
          >
            Softmax
          </text>
          <text
            x="210"
            y="514"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="10"
          >
            exp(x) / sum(exp)
          </text>

          <line
            x1="300"
            y1="502"
            x2="338"
            y2="502"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="346"
            y="478"
            width="220"
            height="48"
            rx="12"
            ry="12"
            fill="url(#gradAmber)"
            fillOpacity="0.2"
            stroke="var(--accent-amber)"
            strokeWidth="1.5"
          />
          <text
            x="456"
            y="498"
            textAnchor="middle"
            fill="var(--accent-amber)"
            fontSize="13"
            fontWeight="600"
          >
            Probabilities
          </text>
          <text
            x="456"
            y="514"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="10"
          >
            [0.01, 0.72, 0.03, ...]
          </text>

          {/* ===== Arrow down to sampling ===== */}
          <line
            x1="456"
            y1="526"
            x2="456"
            y2="548"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          {/* ===== ROW 5: Sampled Token -> Generated Name ===== */}
          <rect
            x="200"
            y="554"
            width="200"
            height="48"
            rx="12"
            ry="12"
            fill="url(#gradEmerald)"
            fillOpacity="0.2"
            stroke="var(--accent-emerald)"
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          <text
            x="300"
            y="574"
            textAnchor="middle"
            fill="var(--accent-emerald)"
            fontSize="13"
            fontWeight="600"
          >
            Sample Token
          </text>
          <text
            x="300"
            y="590"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="10"
          >
            pick from distribution
          </text>

          <line
            x1="400"
            y1="578"
            x2="438"
            y2="578"
            stroke="var(--svg-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />

          <rect
            x="446"
            y="554"
            width="180"
            height="48"
            rx="12"
            ry="12"
            fill="url(#gradEmerald)"
            fillOpacity="0.2"
            stroke="var(--accent-emerald)"
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          <text
            x="536"
            y="574"
            textAnchor="middle"
            fill="var(--accent-emerald)"
            fontSize="13"
            fontWeight="600"
          >
            Generated Name
          </text>
          <text
            x="536"
            y="590"
            textAnchor="middle"
            fill="var(--svg-muted)"
            fontSize="10"
          >
            "kamon"
          </text>

          {/* ===== Category Legend ===== */}
          <rect
            x="20"
            y="610"
            width="10"
            height="10"
            rx="2"
            fill="var(--accent-cyan)"
            fillOpacity="0.7"
          />
          <text x="35" y="619" fill="var(--svg-muted)" fontSize="9">
            Data Transforms
          </text>

          <rect
            x="20"
            y="624"
            width="10"
            height="10"
            rx="2"
            fill="var(--accent-violet)"
            fillOpacity="0.7"
          />
          <text x="35" y="633" fill="var(--svg-muted)" fontSize="9">
            Neural Network
          </text>

          <rect
            x="150"
            y="610"
            width="10"
            height="10"
            rx="2"
            fill="var(--accent-amber)"
            fillOpacity="0.7"
          />
          <text x="165" y="619" fill="var(--svg-muted)" fontSize="9">
            Math Operations
          </text>

          <rect
            x="150"
            y="624"
            width="10"
            height="10"
            rx="2"
            fill="var(--accent-emerald)"
            fillOpacity="0.7"
          />
          <text x="165" y="633" fill="var(--svg-muted)" fontSize="9">
            Output
          </text>
        </svg>
      </div>
    </div>
  );
}
