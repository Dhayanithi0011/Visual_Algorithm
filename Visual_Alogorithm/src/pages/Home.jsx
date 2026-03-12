import { useState, useEffect, useRef } from "react";
import { FiArrowRight, FiCode, FiCpu, FiZap, FiLayers,
         FiTarget, FiCheck, FiChevronRight, FiPlay } from "react-icons/fi";
import "./Home.css";

// ── Animated typing effect ────────────────────────────────────────────────────
function TypeWriter({ words, speed = 80, pause = 1800 }) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let delay = deleting ? speed / 2 : speed;
    if (!deleting && charIdx === word.length) delay = pause;
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(() => {
      if (!deleting && charIdx < word.length) {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx(i => i + 1);
      } else if (!deleting && charIdx === word.length) {
        setDeleting(true);
      } else if (deleting) {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx(i => i - 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return <span className="typewriter">{display}<span className="cursor">|</span></span>;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(to);
        const dur = 1200;
        const steps = 40;
        let step = 0;
        const t = setInterval(() => {
          step++;
          setVal(Math.round((num * step) / steps));
          if (step >= steps) clearInterval(t);
        }, dur / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Feature card data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: FiCode,
    accent: "#007acc",
    glow: "rgba(0,122,204,0.15)",
    tag: "Visualizer",
    title: "Step-Through Code Execution",
    desc: "Watch every variable, call stack frame, and data structure update in real time as your algorithm runs. No black box — full transparency.",
    bullets: ["Live variable tracking", "Call stack visualization", "Step forward & backward"],
  },
  {
    icon: FiTarget,
    accent: "#4ec9b0",
    glow: "rgba(78,201,176,0.15)",
    tag: "Quiz",
    title: "Quiz-Based Knowledge Gaps",
    desc: "Answer algorithm quizzes per program. VisuAlgo maps exactly which concepts you've mastered and which need work — with a progress streak to keep you going.",
    bullets: ["20 program quizzes", "Chapter progress tracking", "Daily streak system"],
  },
  {
    icon: FiZap,
    accent: "#fd9e5a",
    glow: "rgba(253,158,90,0.15)",
    tag: "Smart",
    title: "Personalized Learning Path",
    desc: "Your quiz history drives a smart dashboard that shows your weak spots by chapter, recent activity, and exactly what to tackle next.",
    bullets: ["Avg score by chapter", "Mastery tracking", "Activity timeline"],
  },
  {
    icon: FiLayers,
    accent: "#c586c0",
    glow: "rgba(197,134,192,0.15)",
    tag: "Coverage",
    title: "20+ DSA Programs, 6 Chapters",
    desc: "From recursion and sorting to graphs and dynamic programming — full coverage of the algorithms that matter most for interviews and CS fundamentals.",
    bullets: ["Recursion & Sorting", "Graphs, Trees & DP", "Searching & Data Structures"],
  },
];

const ALGORITHMS = [
  "Factorial", "Fibonacci", "Bubble Sort", "Merge Sort",
  "Quick Sort", "Binary Search", "BFS", "DFS",
  "Linked List", "BST", "Knapsack", "LCS",
  "Tower of Hanoi", "Jump Search", "Stack", "Queue",
];

const HOW_STEPS = [
  { n: "01", accent: "#007acc", title: "Pick an Algorithm", desc: "Choose from 20+ programs across 6 DSA chapters — recursion, sorting, graphs, and more." },
  { n: "02", accent: "#4ec9b0", title: "Watch It Execute", desc: "Step through the code line by line. See every variable change and call stack frame in real time." },
  { n: "03", accent: "#fd9e5a", title: "Take the Quiz", desc: "Answer 5 questions about the program. Pass or fail — every attempt counts toward your streak." },
  { n: "04", accent: "#c586c0", title: "Track Your Progress", desc: "Your dashboard shows chapter progress, quiz scores, and activity history. Come back daily to grow." },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Home({ onNavigate }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="home">

      {/* ══════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        {/* Background grid + radial glow */}
        <div className="lp-hero-grid" />
        <div className="lp-hero-glow" />

        <div className="lp-container">
          <div className="lp-hero-inner">

            {/* Left — headline */}
            <div className="lp-hero-text">
              <div className="lp-eyebrow">
                <span className="lp-eyebrow-dot" />
                <span>Data Structures & Algorithms</span>
                <span className="lp-eyebrow-badge">BETA</span>
              </div>

              <h1 className="lp-h1">
                Learn DSA by<br />
                <span className="lp-h1-accent">
                  <TypeWriter words={["seeing it.", "doing it.", "quizzing it.", "mastering it."]} />
                </span>
              </h1>

              <p className="lp-hero-desc">
                VisuAlgo makes algorithms click. Step through live code execution,
                find your knowledge gaps with targeted quizzes, and track your
                progress with a daily streak that keeps you coming back.
              </p>

              <div className="lp-hero-actions">
                <button className="lp-btn-primary" onClick={() => onNavigate("visualizer")}>
                  <FiPlay size={15} />
                  Start Visualizing
                  <FiArrowRight size={15} />
                </button>
                <button className="lp-btn-ghost" onClick={() => onNavigate("gap-detector")}>
                  Take a Quiz
                </button>
              </div>

              {/* Social proof strip */}
              <div className="lp-proof">
                {["20+ Programs", "6 Chapters", "Quiz Streaks", "Free to use"].map((t, i) => (
                  <span key={i} className="lp-proof-item">
                    <FiCheck size={11} color="#4ec9b0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — animated code editor preview */}
            <div className="lp-hero-editor">
              <div className="lp-editor-chrome">
                <div className="lp-editor-titlebar">
                  <div className="lp-editor-dots">
                    <span className="led red" /><span className="led yellow" /><span className="led green" />
                  </div>
                  <div className="lp-editor-tabs">
                    <span className="lp-tab active">merge_sort.py</span>
                    <span className="lp-tab">bfs.py</span>
                  </div>
                  <div className="lp-editor-actions">
                    <span className="lp-run-pill"><FiPlay size={9} /> Run</span>
                  </div>
                </div>

                <div className="lp-editor-body">
                  {/* Line numbers + code */}
                  <div className="lp-editor-code">
                    {[
                      { ln: 1,  text: <><span className="syn-kw">def</span> <span className="syn-fn">merge_sort</span>(arr):</>, active: true },
                      { ln: 2,  text: <><span className="syn-kw">  if</span> len(arr) &lt;= <span className="syn-num">1</span>:</> },
                      { ln: 3,  text: <><span className="syn-kw">    return</span> arr</> },
                      { ln: 4,  text: "" },
                      { ln: 5,  text: <>  mid = len(arr) // <span className="syn-num">2</span></>, highlight: true },
                      { ln: 6,  text: <>  L = arr[:<span className="syn-var">mid</span>]</> },
                      { ln: 7,  text: <>  R = arr[<span className="syn-var">mid</span>:]</> },
                      { ln: 8,  text: "" },
                      { ln: 9,  text: <>  L = merge_sort(L)</> },
                      { ln: 10, text: <>  R = merge_sort(R)</> },
                    ].map(({ ln, text, active, highlight }) => (
                      <div key={ln} className={`lp-code-row${active ? " active" : ""}${highlight ? " highlight" : ""}`}>
                        <span className="lp-ln">{ln}</span>
                        <span className="lp-code">{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right panel — variables */}
                  <div className="lp-editor-panel">
                    <div className="lp-panel-head">VARIABLES</div>
                    <div className="lp-var-row"><span className="lp-var-name">arr</span><span className="lp-var-val">[38, 27, 43, 3]</span></div>
                    <div className="lp-var-row"><span className="lp-var-name">mid</span><span className="lp-var-val syn-num">2</span></div>
                    <div className="lp-var-row"><span className="lp-var-name">L</span><span className="lp-var-val">[38, 27]</span></div>
                    <div className="lp-var-row"><span className="lp-var-name">R</span><span className="lp-var-val">[43, 3]</span></div>

                    <div className="lp-panel-head" style={{ marginTop: 16 }}>CALL STACK</div>
                    <div className="lp-stack-frame active-frame">merge_sort([38,27])</div>
                    <div className="lp-stack-frame">merge_sort([38,27,43,3])</div>

                    <div className="lp-panel-head" style={{ marginTop: 16 }}>STEP</div>
                    <div className="lp-step-controls">
                      <button className="lp-step-btn">‹‹</button>
                      <button className="lp-step-btn lp-step-play">▶</button>
                      <button className="lp-step-btn">››</button>
                    </div>
                  </div>
                </div>

                {/* Bottom status bar */}
                <div className="lp-editor-status">
                  <span className="lp-status-item blue">Python 3</span>
                  <span className="lp-status-item">Step 5 / 18</span>
                  <span className="lp-status-item green">● Merge Sort</span>
                </div>
              </div>

              {/* Floating quiz card */}
              <div className="lp-floating-quiz">
                <div className="lp-fq-head">
                  <span className="lp-fq-icon">⚡</span>
                  <span>Quick Quiz</span>
                </div>
                <p className="lp-fq-q">What is the time complexity of Merge Sort?</p>
                <div className="lp-fq-answers">
                  <div className="lp-fq-ans correct">✓ O(n log n)</div>
                  <div className="lp-fq-ans">O(n²)</div>
                </div>
              </div>

              {/* Floating streak card */}
              <div className="lp-floating-streak">
                <span className="lp-streak-fire">🔥</span>
                <div>
                  <div className="lp-streak-num">12</div>
                  <div className="lp-streak-lbl">Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS TICKER
         ══════════════════════════════════════════════════════ */}
      <div className="lp-stats-bar">
        <div className="lp-container">
          <div className="lp-stats-row">
            {[
              { val: "20", suf: "+", label: "Algorithm Programs" },
              { val: "6",  suf: "",  label: "DSA Chapters" },
              { val: "100", suf: "+", label: "Quiz Questions" },
              { val: "4",  suf: "",  label: "Chapters Covered" },
            ].map((s, i) => (
              <div key={i} className="lp-stat">
                <div className="lp-stat-val"><Counter to={s.val} suffix={s.suf} /></div>
                <div className="lp-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ALGORITHM TICKER
         ══════════════════════════════════════════════════════ */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker">
          {[...ALGORITHMS, ...ALGORITHMS].map((a, i) => (
            <span key={i} className="lp-ticker-item">
              <FiCode size={10} /> {a}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURES — interactive tabs
         ══════════════════════════════════════════════════════ */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-section-label">What You Get</div>
          <h2 className="lp-h2">Everything you need to<br /><span className="lp-h2-accent">master algorithms.</span></h2>

          <div className="lp-features-layout">
            {/* Tab list */}
            <div className="lp-feat-tabs">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <button
                    key={i}
                    className={`lp-feat-tab ${activeFeature === i ? "active" : ""}`}
                    style={activeFeature === i ? { "--tab-accent": f.accent, borderLeftColor: f.accent } : {}}
                    onClick={() => setActiveFeature(i)}
                  >
                    <span className="lp-feat-tab-icon" style={{ color: activeFeature === i ? f.accent : "#555" }}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <div className="lp-feat-tab-tag">{f.tag}</div>
                      <div className="lp-feat-tab-title">{f.title}</div>
                    </div>
                    <FiChevronRight size={14} className="lp-feat-tab-arrow" />
                  </button>
                );
              })}
            </div>

            {/* Feature detail panel */}
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`lp-feat-detail ${activeFeature === i ? "visible" : ""}`}
                  style={{ "--feat-accent": f.accent, "--feat-glow": f.glow }}
                >
                  <div className="lp-feat-detail-icon">
                    <Icon size={28} color={f.accent} />
                  </div>
                  <span className="lp-feat-tag" style={{ color: f.accent, borderColor: f.accent + "44", background: f.glow }}>
                    {f.tag}
                  </span>
                  <h3 className="lp-feat-title">{f.title}</h3>
                  <p className="lp-feat-desc">{f.desc}</p>
                  <ul className="lp-feat-bullets">
                    {f.bullets.map((b, j) => (
                      <li key={j}>
                        <FiCheck size={13} color={f.accent} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="lp-feat-cta"
                    style={{ background: f.accent }}
                    onClick={() => onNavigate(i === 0 ? "visualizer" : "gap-detector")}
                  >
                    Try it now <FiArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <section className="lp-how">
        <div className="lp-how-bg" />
        <div className="lp-container">
          <div className="lp-section-label">The Process</div>
          <h2 className="lp-h2">From zero to mastery<br /><span className="lp-h2-accent">in four steps.</span></h2>

          <div className="lp-steps-grid">
            {HOW_STEPS.map((s, i) => (
              <div key={i} className="lp-step-card" style={{ "--step-accent": s.accent }}>
                <div className="lp-step-num" style={{ color: s.accent, borderColor: s.accent + "44", background: s.accent + "18" }}>
                  {s.n}
                </div>
                {i < HOW_STEPS.length - 1 && <div className="lp-step-connector" />}
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ALGORITHM SHOWCASE
         ══════════════════════════════════════════════════════ */}
      <section className="lp-algos">
        <div className="lp-container">
          <div className="lp-section-label">Full Coverage</div>
          <h2 className="lp-h2">Every algorithm<br /><span className="lp-h2-accent">beautifully explained.</span></h2>

          <div className="lp-algo-chapters">
            {[
              { id: "recursion",           label: "Recursion",           color: "#7c5cbf", programs: ["Factorial", "Fibonacci", "Sum of Array", "Tower of Hanoi"] },
              { id: "sorting",             label: "Sorting",             color: "#2d8fd9", programs: ["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort"] },
              { id: "searching",           label: "Searching",           color: "#12a08f", programs: ["Linear Search", "Binary Search", "Jump Search"] },
              { id: "data_structures",     label: "Data Structures",     color: "#d4721e", programs: ["Linked List", "Stack", "Queue", "BST"] },
              { id: "graph",               label: "Graph",               color: "#9b4fd1", programs: ["BFS", "DFS"] },
              { id: "dynamic_programming", label: "Dynamic Programming", color: "#1e9e4a", programs: ["Fibonacci DP", "0/1 Knapsack", "LCS"] },
            ].map((ch) => (
              <div key={ch.id} className="lp-chapter-card" style={{ "--ch-color": ch.color }}>
                <div className="lp-chapter-head">
                  <span className="lp-chapter-dot" style={{ background: ch.color }} />
                  <span className="lp-chapter-name">{ch.label}</span>
                  <span className="lp-chapter-count">{ch.programs.length}</span>
                </div>
                <div className="lp-chapter-pills">
                  {ch.programs.map(p => (
                    <span key={p} className="lp-pill">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
         ══════════════════════════════════════════════════════ */}
      <section className="lp-cta-section">
        <div className="lp-cta-glow" />
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-label">Ready?</div>
            <h2 className="lp-cta-title">
              Stop guessing.<br />Start understanding.
            </h2>
            <p className="lp-cta-desc">
              VisuAlgo is free. No credit card. No setup.
              Just open it and start learning DSA the way it was meant to be taught.
            </p>
            <div className="lp-cta-btns">
              <button className="lp-btn-primary large" onClick={() => onNavigate("visualizer")}>
                <FiPlay size={16} />
                Open Visualizer
                <FiArrowRight size={16} />
              </button>
              <button className="lp-btn-ghost large" onClick={() => onNavigate("gap-detector")}>
                Test Your Knowledge
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
