import { useState, useRef } from "react";
import {
  FiUpload, FiAlertTriangle, FiCheckCircle,
  FiChevronRight, FiBook, FiLoader
} from "react-icons/fi";
import { saveGapAnalysis } from "../services/sessions";
import "./LearningPath.css";

// --- Concept dependency graph data ---
const CONCEPT_GRAPHS = {
  "machine-learning": {
    label: "Machine Learning",
    graph: [
      { id: "linear_algebra", label: "Linear Algebra", deps: [], strength: 0.3 },
      { id: "probability", label: "Probability Theory", deps: ["linear_algebra"], strength: 0.4 },
      { id: "statistics", label: "Statistics", deps: ["probability"], strength: 0.5 },
      { id: "calculus", label: "Calculus / Derivatives", deps: [], strength: 0.7 },
      { id: "gradient_descent", label: "Gradient Descent", deps: ["calculus", "linear_algebra"], strength: 0.6 },
      { id: "logistic_reg", label: "Logistic Regression", deps: ["probability", "statistics"], strength: 0.35 },
      { id: "ml", label: "Machine Learning", deps: ["gradient_descent", "logistic_reg"], strength: 0.2 },
    ],
  },
  "data-structures": {
    label: "Data Structures & Algorithms",
    graph: [
      { id: "pointers", label: "Pointers & References", deps: [], strength: 0.45 },
      { id: "arrays", label: "Arrays", deps: [], strength: 0.8 },
      { id: "recursion", label: "Recursion", deps: ["arrays"], strength: 0.5 },
      { id: "linked_list", label: "Linked Lists", deps: ["pointers"], strength: 0.4 },
      { id: "trees", label: "Trees & BST", deps: ["linked_list", "recursion"], strength: 0.3 },
      { id: "graphs", label: "Graphs (BFS/DFS)", deps: ["trees"], strength: 0.25 },
      { id: "dp", label: "Dynamic Programming", deps: ["recursion", "arrays"], strength: 0.2 },
    ],
  },
  "web-dev": {
    label: "Web Development",
    graph: [
      { id: "html", label: "HTML Basics", deps: [], strength: 0.9 },
      { id: "css", label: "CSS Styling", deps: ["html"], strength: 0.7 },
      { id: "js_basics", label: "JavaScript Basics", deps: [], strength: 0.6 },
      { id: "dom", label: "DOM Manipulation", deps: ["js_basics", "html"], strength: 0.5 },
      { id: "async", label: "Async / Promises", deps: ["js_basics"], strength: 0.4 },
      { id: "react", label: "React Framework", deps: ["dom", "async"], strength: 0.3 },
    ],
  },
};

const QUIZ_PRESETS = [
  {
    label: "ML Quiz Result",
    topic: "machine-learning",
    scores: { linear_algebra: 35, probability: 42, statistics: 68, calculus: 78, gradient_descent: 55, logistic_reg: 38, ml: 25 },
  },
  {
    label: "DSA Quiz Result",
    topic: "data-structures",
    scores: { pointers: 40, arrays: 85, recursion: 55, linked_list: 35, trees: 28, graphs: 20, dp: 18 },
  },
  {
    label: "Web Dev Quiz Result",
    topic: "web-dev",
    scores: { html: 90, css: 75, js_basics: 60, dom: 55, async: 35, react: 30 },
  },
];

function getStrengthLabel(score) {
  if (score >= 70) return { label: "Strong", cls: "strong" };
  if (score >= 50) return { label: "Moderate", cls: "moderate" };
  return { label: "Weak", cls: "weak" };
}

function ConceptNode({ concept, score, isBlind }) {
  const s = getStrengthLabel(score);
  const barColor = isBlind ? "var(--red)" : score >= 70 ? "var(--green)" : "var(--orange)";
  const iconColor = isBlind ? "var(--red)" : "var(--green)";
  return (
    <div className={`concept-node ${s.cls} ${isBlind ? "blind-spot" : ""}`}>
      <div className="concept-node-header">
        <span className="concept-label">{concept.label}</span>
        {isBlind && <FiAlertTriangle size={13} color={iconColor} />}
        {!isBlind && score >= 70 && <FiCheckCircle size={13} color={iconColor} />}
      </div>
      <div className="concept-bar-wrap">
        <div className="concept-bar" style={{ width: `${score}%`, background: barColor }} />
      </div>
      <span className={`concept-score ${s.cls}`}>{score}% — {s.label}</span>
    </div>
  );
}

export default function LearningPath({ user }) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        let parsed = null;
        // Try JSON first
        try { parsed = JSON.parse(text); } catch {}
        // Try CSV: "concept,score" rows
        if (!parsed) {
          const lines = text.trim().split(/\r?\n/).filter(Boolean);
          const scores = {};
          lines.forEach(line => {
            const [key, val] = line.split(",");
            if (key && val && !isNaN(Number(val.trim()))) {
              scores[key.trim()] = Number(val.trim());
            }
          });
          if (Object.keys(scores).length > 0) parsed = { scores };
        }
        if (!parsed?.scores || Object.keys(parsed.scores).length === 0) {
          setFileError("Could not parse file. Use JSON { scores: {...} } or CSV concept,score format.");
          return;
        }
        // Auto-detect topic from keys
        const keys = Object.keys(parsed.scores);
        const topic = Object.keys(CONCEPT_GRAPHS).find(t =>
          CONCEPT_GRAPHS[t].graph.some(c => keys.includes(c.id))
        ) || "data-structures";
        runAnalysis({ label: file.name, topic, scores: parsed.scores });
      } catch {
        setFileError("Failed to read file. Please check the format.");
      }
    };
    reader.readAsText(file);
    // Reset so same file can be uploaded again
    e.target.value = "";
  };

  const runAnalysis = (preset) => {
    setSelectedPreset(preset);
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const graph = CONCEPT_GRAPHS[preset.topic];
      const scores = preset.scores;
      const blindSpots = graph.graph.filter((c) => scores[c.id] < 50);
      const rootCauses = blindSpots.filter(
        (c) => c.deps.length === 0 || c.deps.every((d) => (scores[d] || 0) < 50)
      );
      // Build learning path: start with weakest root deps, then build up
      const order = [];
      const visited = new Set();
      const visit = (id) => {
        if (visited.has(id)) return;
        visited.add(id);
        const node = graph.graph.find((c) => c.id === id);
        if (!node) return;
        node.deps.forEach(visit);
        if (scores[id] < 65) order.push(node);
      };
      graph.graph.forEach((c) => visit(c.id));
      const overallScore = Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
      );
      const res = { graph, scores, blindSpots, rootCauses, path: order.slice(0, 5) };
      setResult(res);
      setAnalyzing(false);
      // Save to Firestore if signed in
      if (user?.uid) {
        saveGapAnalysis(user.uid, preset.topic, scores, blindSpots, overallScore);
      }
    }, 1200);
  };

  return (
    <div className="lp-page">
      <div className="lp-header">
        <div>
          <h2 className="lp-title">AI Learning Quiz</h2>
          <p className="lp-sub">Upload quiz results to find hidden knowledge gaps and get a targeted learning path.</p>
        </div>
      </div>

      {/* Upload / Preset area */}
      <div className="lp-upload-row">
        <div className="card upload-card" onClick={() => fileInputRef.current?.click()}
          style={{ cursor: "pointer" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.txt"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            onClick={e => e.stopPropagation()}
          />
          <div className="upload-icon-wrap">
            <FiUpload size={28} color="var(--accent)" />
          </div>
          <p className="upload-text">Click to upload your quiz results file</p>
          <p className="upload-hint">Supported: .json, .csv, .txt</p>
          {fileError && (
            <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4, fontWeight: 500 }}>
              {fileError}
            </p>
          )}
          <p className="upload-or" onClick={e => e.stopPropagation()}>— or use a sample below —</p>
          <div className="preset-btns" onClick={e => e.stopPropagation()}>
            {QUIZ_PRESETS.map((p, i) => (
              <button
                key={i}
                className={`sample-btn ${selectedPreset?.label === p.label ? "active" : ""}`}
                onClick={() => runAnalysis(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {analyzing && (
        <div className="lp-loading card">
          <FiLoader size={20} className="spin" color="var(--accent)" />
          <span>Analyzing concept dependencies...</span>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="lp-results fade-in">
          {/* Concept Map */}
          <div className="card result-section">
            <div className="section-label">Concept Map — {CONCEPT_GRAPHS[selectedPreset.topic].label}</div>
            <div className="concept-grid">
              {result.graph.graph.map((c) => (
                <ConceptNode
                  key={c.id}
                  concept={c}
                  score={result.scores[c.id] || 0}
                  isBlind={result.blindSpots.some((b) => b.id === c.id)}
                />
              ))}
            </div>
          </div>

          <div className="lp-two-col">
            {/* Blind Spots */}
            <div className="card result-section">
              <div className="section-label">Detected Blind Spots</div>
              {result.blindSpots.length === 0 ? (
                <p className="no-gaps">No critical gaps found. Strong performance overall.</p>
              ) : (
                <div className="blind-list">
                  {result.blindSpots.map((b) => (
                    <div key={b.id} className="blind-item">
                      <FiAlertTriangle size={14} color="var(--red)" />
                      <div>
                        <div className="blind-name">{b.label}</div>
                        <div className="blind-score">Score: {result.scores[b.id]}% — needs work</div>
                        {b.deps.length > 0 && (
                          <div className="blind-deps">
                            Depends on: {b.deps.map((d) => result.graph.graph.find((c) => c.id === d)?.label).filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Path */}
            <div className="card result-section">
              <div className="section-label">Personalized Learning Path</div>
              <div className="path-list">
                {result.path.map((c, i) => (
                  <div key={c.id} className="path-step">
                    <div className="path-num">{String(i + 1).padStart(2, "0")}</div>
                    <div className="path-info">
                      <div className="path-concept">{c.label}</div>
                      <div className="path-why">
                        Score: {result.scores[c.id]}% —{" "}
                        {result.scores[c.id] < 50 ? "Critical gap. Review from scratch." : "Moderate. Review key areas."}
                      </div>
                      <div className="path-action">
                        <FiBook size={12} />
                        <span>
                          {i === 0
                            ? "Start here — foundational concept"
                            : `After completing step ${i}`}
                        </span>
                      </div>
                    </div>
                    {i < result.path.length - 1 && (
                      <FiChevronRight size={16} color="var(--text-dim)" className="path-arrow" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary box */}
          <div className="card summary-box">
            <div className="section-label">Summary</div>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="summary-val">{result.blindSpots.length}</span>
                <span className="summary-key">Blind Spots</span>
              </div>
              <div className="summary-stat">
                <span className="summary-val">{result.path.length}</span>
                <span className="summary-key">Steps to Fix</span>
              </div>
              <div className="summary-stat">
                <span className="summary-val">
                  {Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length)}%
                </span>
                <span className="summary-key">Overall Score</span>
              </div>
              <div className="summary-stat">
                <span className="summary-val">{result.rootCauses.length}</span>
                <span className="summary-key">Root Causes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
