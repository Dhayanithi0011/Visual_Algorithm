import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiRotateCcw, FiCpu, FiAlertCircle, FiChevronRight,
  FiEdit3, FiRefreshCw, FiBookOpen, FiVolume2, FiVolumeX,
  FiCode, FiX, FiZap, FiCheckCircle
} from "react-icons/fi";
import { saveVisualizerSession } from "../services/sessions";
import { ProgramDiagram } from "./VisualizerDiagrams";
import { CHAPTERS, DIFF_COLORS } from "./visualizerData";
import { simulateExecution } from "./simulators";
import { validateCodeWithBackend, clientSidePythonCheck } from "./codeValidator";
import { analyzeCodeWithAI } from "../services/aiCodeAnalyzer";
import { TheoryPanel, ChapterSidebar } from "./VisualizerPanels";
import "./Visualizer.css";

const LANG_COLORS = {
  Python:     { bg: "rgba(55,118,171,0.18)",  border: "rgba(55,118,171,0.5)",  text: "#4a9cc7" },
  JavaScript: { bg: "rgba(240,219,79,0.15)",  border: "rgba(240,219,79,0.5)",  text: "#e0c84a" },
  Java:       { bg: "rgba(232,110,37,0.15)",  border: "rgba(232,110,37,0.5)",  text: "#e06b25" },
  C:          { bg: "rgba(96,160,210,0.15)",  border: "rgba(96,160,210,0.5)",  text: "#60a0d2" },
};
const TRY_IT_LANGS = ["Python", "JavaScript", "Java", "C"];
const SPEED_OPTIONS = [
  { label: "0.25×", ms: 3600 },
  { label: "0.5×",  ms: 1800 },
  { label: "0.75×", ms: 1200 },
  { label: "1×",    ms:  900 },
];
const DEFAULT_SPEED = 900;

// ── Validators ────────────────────────────────────────────────
function validateJS(code) {
  const lines = code.split("\n");
  const opens = { "(": 0, "[": 0, "{": 0 };
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\/\/.*$/, "").replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""');
    for (const ch of line) {
      if (opens[ch] !== undefined) opens[ch]++;
      else if (pairs[ch]) { opens[pairs[ch]]--; if (opens[pairs[ch]] < 0) return `SyntaxError: unexpected '${ch}' on line ${i + 1}`; }
    }
  }
  if (opens["{"] > 0) return "SyntaxError: missing closing '}'";
  if (opens["("] > 0) return "SyntaxError: missing closing ')'";
  if (opens["["] > 0) return "SyntaxError: missing closing ']'";
  if (/\bvar\s+\w+\s*$/.test(lines.join("\n"))) return "SyntaxError: variable declared without value";
  return null;
}
function validateJava(code) {
  const lines = code.split("\n");
  const opens = { "(": 0, "[": 0, "{": 0 };
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\/\/.*$/, "").replace(/"[^"]*"/g, '""');
    for (const ch of line) {
      if (opens[ch] !== undefined) opens[ch]++;
      else if (pairs[ch]) { opens[pairs[ch]]--; if (opens[pairs[ch]] < 0) return `SyntaxError: unexpected '${ch}' on line ${i + 1}`; }
    }
  }
  if (opens["{"] > 0) return "SyntaxError: missing closing '}'";
  if (opens["("] > 0) return "SyntaxError: missing closing ')'";
  if (!lines.some(l => /\bclass\s+\w+/.test(l))) return "Error: Java code must have a class definition";
  if (!lines.some(l => /public\s+static\s+void\s+main/.test(l))) return "Error: Java code must have a main method";
  return null;
}
function validateC(code) {
  const lines = code.split("\n");
  const opens = { "(": 0, "[": 0, "{": 0 };
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\/\/.*$|\/\*.*?\*\//g, "").replace(/"[^"]*"/g, '""');
    for (const ch of line) {
      if (opens[ch] !== undefined) opens[ch]++;
      else if (pairs[ch]) { opens[pairs[ch]]--; if (opens[pairs[ch]] < 0) return `SyntaxError: unexpected '${ch}' on line ${i + 1}`; }
    }
  }
  if (opens["{"] > 0) return "SyntaxError: missing closing '}'";
  if (opens["("] > 0) return "SyntaxError: missing closing ')'";
  if (!lines.some(l => /\bmain\s*\(/.test(l))) return "Error: C code must have a main() function";
  if (!lines.some(l => /return\s+0\s*;/.test(l) || /return\s+\d/.test(l))) return "Warning: main() should return 0";
  return null;
}
function validateTryItCode(code, lang) {
  if (!code.trim()) return "Write some code first.";
  if (lang === "Python")     return clientSidePythonCheck(code);
  if (lang === "JavaScript") return validateJS(code);
  if (lang === "Java")       return validateJava(code);
  if (lang === "C")          return validateC(code);
  return null;
}

// ── Algorithm key detection ───────────────────────────────────
function detectAlgorithmKey(code) {
  const c = code.toLowerCase();
  if (/fib_memo|memo\[n\]|memoiz|if n in memo|memo\s*=\s*\{/.test(c))              return "fib_dp";
  if (/knapsack|dp\[i\]\[w\]|dp\[i-1\]\[w\]/.test(c))                               return "knapsack";
  if (/\blcs\b|longest.?common.?sub|dp\[i-1\]\[j-1\]/.test(c))                      return "lcs";
  if (/\bhanoi\b|tower.?of.?hanoi|peg/.test(c))                                      return "tower_of_hanoi";
  if (/\bfactorial\b/.test(c))                                                        return "factorial";
  if (/\bfib\b.*\bfib\b|fibonacci/.test(c) && !/memo/.test(c))                       return "fibonacci";
  if (/sum_arr|sum.*arr.*recurs|def sum.*arr/.test(c))                                return "sum_array";
  if (/merge.?sort|def merge\b|function merge\b|void merge\b|static.*merge/.test(c)) return "merge_sort";
  if (/quick.?sort|partition.*pivot|pivot.*partition/.test(c))                        return "quick_sort";
  if (/bubble.?sort|arr\[j\]\s*>\s*arr\[j.?1\]/.test(c))                            return "bubble_sort";
  if (/selection.?sort|min.?idx|min_idx/.test(c))                                     return "selection_sort";
  if (/insertion.?sort|key\s*=\s*arr\[i\]/.test(c))                                  return "insertion_sort";
  if (/binary.?search|lo.*hi.*mid|low.*high.*mid/.test(c))                           return "binary_search";
  if (/jump.?search|math\.sqrt|int\(math/.test(c))                                   return "jump_search";
  if (/linear.?search|for.*==.*target|sequential/.test(c))                           return "linear_search";
  if (/linked.?list|class node.*next|node\.next|\.next\s*=/.test(c))                 return "linked_list";
  if (/\bbst\b|binary.?search.?tree|def insert.*root|\.left\s*=|\.right\s*=/.test(c)) return "bst_insert";
  if (/\bstack\b.*append|push\s*\(|stack\.push|lifo/.test(c))                        return "stack_impl";
  if (/\bqueue\b.*popleft|deque\b|queue\.shift|queue\.poll|fifo/.test(c))            return "queue_impl";
  if (/\bbfs\b|breadth.?first|levelorder/.test(c))                                   return "bfs";
  if (/\bdfs\b|depth.?first/.test(c))                                                 return "dfs";
  return null;
}

// ── Audio text builder ────────────────────────────────────────
function buildAudioExplanation(stepIdx, totalSteps, step) {
  const note  = step?.note || "";
  const line  = step?.line || 0;
  const frame = step?.stack?.[0];
  const cleanNote = note
    .replace(/[▶🔁🔄❓📌✅🔑📍⬅↩✔🧮🏁→←📥📤📞🎉🔀✂🦘🔍]/gu, "")
    .replace(/\s{2,}/g, " ").trim();
  let varContext = "";
  if (frame?.vars) {
    const entries = Object.entries(frame.vars).slice(0, 3);
    if (entries.length > 0)
      varContext = ` Current values: ${entries.map(([k, v]) => `${k} equals ${v}`).join(", ")}.`;
  }
  const lineContext = line > 0 ? ` Line ${line}.` : "";
  let teaching = "";
  const n = note.toLowerCase();
  if (n.includes("base case") || n.includes("n == 0") || n.includes("n <= 1")) teaching = "Base case reached. ";
  else if (n.includes("recurse") || n.includes("recursive call") || n.includes("factorial(") || n.includes("fib(")) teaching = "Making a recursive call. ";
  else if (n.includes("return") || n.includes("↩") || n.includes("pop frame")) teaching = "Returning and unwinding the call stack. ";
  else if (n.includes("swap") || n.includes("↔")) teaching = "Swapping two elements. ";
  else if (n.includes("compar")) teaching = "Comparing two elements. ";
  else if (n.includes("pivot")) teaching = "Pivot divides the array. ";
  else if (n.includes("merge")) teaching = "Merging two sorted halves. ";
  else if (n.includes("dp[") || n.includes("memo")) teaching = "Filling the dynamic programming table. ";
  return `Step ${stepIdx + 1} of ${totalSteps}.${lineContext} ${teaching}${cleanNote}${varContext}`;
}

// ── Speech helpers ────────────────────────────────────────────
// CRITICAL: speakAsync does NOT call cancel() internally.
// Calling cancel() inside speakAsync would fire the onend of any
// currently-awaited utterance, breaking the sequential loop.
// Always call window.speechSynthesis.cancel() ONCE before starting
// the loop, then let each utterance finish naturally.
function speakAsync(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 1.0;
    utt.pitch  = 1.0;
    utt.volume = 1.0;
    utt.onend   = resolve;
    utt.onerror = resolve;
    window.speechSynthesis.speak(utt);
  });
}

// ── Shared UI components ──────────────────────────────────────
function TopbarCallStack({ step }) {
  if (!step?.stack || step.stack.length === 0)
    return <div className="topbar-stack topbar-stack-empty" />;
  const frames = step.stack;
  return (
    <div className="topbar-stack">
      <div className="stack-viz-compact">
        <div className="stack-viz-compact-header">
          <span className="svc-title">Call Stack</span>
          <span className="stack-depth-badge">{frames.length} frame{frames.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="stack-compact-frames">
          {frames.map((frame, i) => {
            const isActive = i === 0;
            const isReturning = !!frame.returning;
            return (
              <div key={i} className={["stack-compact-frame",
                isActive && isReturning ? "scf-returning" : isActive ? "scf-active" : "scf-lower",
              ].join(" ")}>
                <div className="scf-header">
                  <span className="scf-num">#{frames.length - i}</span>
                  <span className="scf-name">{frame.fn}()</span>
                  {isReturning ? <span className="scf-badge scf-return-badge">↩ RET</span>
                    : isActive ? <span className="scf-badge scf-active-badge">ACTIVE</span>
                    : <span className="scf-badge scf-wait-badge">wait</span>}
                </div>
                {Object.entries(frame.vars || {}).slice(0, 4).map(([k, v]) => (
                  <span key={k} className={`scf-var ${k.startsWith("↩") ? "scf-var-ret" : ""}`}>
                    <span className="scf-vname">{k}</span>
                    <span className="scf-veq"> = </span>
                    <span className="scf-vval">{String(v)}</span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpeedSelect({ value, onChange }) {
  return (
    <div className="speed-control">
      <span className="speed-label">Speed</span>
      <select className="speed-select" value={value} onChange={e => onChange(Number(e.target.value))}>
        {SPEED_OPTIONS.map(o => <option key={o.ms} value={o.ms}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TryItPanel({ tryLang, setTryLang, tryCode, setTryCode, tryError, tryRunning, tryHasRun, tryTitle, tryAlgoKey, onRun, onReset }) {
  const col = LANG_COLORS[tryLang] || LANG_COLORS.Python;
  const PLACEHOLDERS = {
    Python: "# Write your Python code here…", JavaScript: "// Write your JavaScript code here…",
    Java: "// Write your Java code here…", C: "// Write your C code here…",
  };
  return (
    <div className="tryit-inline">
      <div className="tryit-header-hint">
        <FiZap size={12} color="#4ec9b0" />
        <span>Write code in any language — see the same flow diagrams as the Code tab</span>
      </div>
      <div className="tryit-lang-tabs">
        {TRY_IT_LANGS.map(lang => {
          const lc = LANG_COLORS[lang]; const isActive = tryLang === lang;
          return (
            <button key={lang} className={`tryit-lang-btn ${isActive ? "tryit-lang-active" : ""}`}
              style={isActive ? { background: lc.bg, border: `1px solid ${lc.border}`, color: lc.text } : {}}
              onClick={() => { setTryLang(lang); onReset(); }}>{lang}</button>
          );
        })}
        {tryCode.trim() && (
          <button className="tryit-clear-btn" onClick={() => { setTryCode(""); onReset(); }}>
            <FiX size={11} /> Clear
          </button>
        )}
      </div>
      <div className="tryit-editor-wrap">
        <textarea
          className={`tryit-textarea ${tryError ? "tryit-textarea-error" : tryHasRun && !tryError ? "tryit-textarea-ok" : ""}`}
          value={tryCode} onChange={e => { setTryCode(e.target.value); onReset(); }}
          placeholder={PLACEHOLDERS[tryLang]} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        />
      </div>
      {tryError && (
        <div className="tryit-error-block">
          <div className="tryit-error-icon"><FiAlertCircle size={18} /></div>
          <div>
            <div className="tryit-error-title">Error — Fix before visualizing</div>
            <div className="tryit-error-msg">{tryError}</div>
          </div>
        </div>
      )}
      <div className="tryit-footer">
        <button className="btn btn-primary tryit-run-btn" onClick={onRun} disabled={tryRunning || !tryCode.trim()}>
          {tryRunning ? <><FiCpu size={14} className="spin" /> Analyzing…</> : <><FiZap size={14} /> Run & Visualize</>}
        </button>
        {!tryCode.trim() && !tryRunning && <span className="tryit-run-hint">Write code above, then click Run &amp; Visualize</span>}
        {tryRunning && <span className="tryit-run-hint">⏳ Tracing your code…</span>}
      </div>
      {tryHasRun && !tryError && tryTitle && (
        <div className="tryit-detected-title">
          <FiCheckCircle size={12} color="#4ec9b0" />
          <span>Detected: <strong>{tryTitle}</strong></span>
          <span className="tryit-lang-pill" style={{ color: col.text, background: col.bg, border: `1px solid ${col.border}` }}>{tryLang}</span>
        </div>
      )}
      {tryHasRun && !tryError && !tryAlgoKey && (
        <div className="tryit-no-diagram-hint">
          <FiAlertCircle size={12} color="var(--text-dim)" />
          <span>Tip: write a known algorithm (factorial, bubble sort, binary search…) to see its flow diagram →</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN VISUALIZER
// ═══════════════════════════════════════════════════════════════
export default function Visualizer({ user }) {
  const defaultChapter = CHAPTERS[0];
  const defaultProgram = CHAPTERS[0].programs[0];

  const [activeChapter, setActiveChapter] = useState(defaultChapter);
  const [activeProgram, setActiveProgram] = useState(defaultProgram);
  const [code,          setCode]          = useState(defaultProgram.code);
  const [isEditing,     setIsEditing]     = useState(false);
  const [codeDirty,     setCodeDirty]     = useState(false);
  const [activeTab,     setActiveTab]     = useState("code");
  const [codeError,     setCodeError]     = useState(null);
  const [isValidating,  setIsValidating]  = useState(false);

  const [steps,       setSteps]       = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isRunning,   setIsRunning]   = useState(false);
  const [hasRun,      setHasRun]      = useState(false);
  const [speed,       setSpeed]       = useState(DEFAULT_SPEED);
  const [audioOn,     setAudioOn]     = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);

  const [tryLang,        setTryLang]        = useState("Python");
  const [tryCode,        setTryCode]        = useState("");
  const [tryError,       setTryError]       = useState(null);
  const [tryRunning,     setTryRunning]     = useState(false);
  const [tryHasRun,      setTryHasRun]      = useState(false);
  const [trySteps,       setTrySteps]       = useState([]);
  const [tryCurrentStep, setTryCurrentStep] = useState(0);
  const [tryIsPlaying,   setTryIsPlaying]   = useState(false);
  const [trySpeed,       setTrySpeed]       = useState(DEFAULT_SPEED);
  const [tryAudioOn,     setTryAudioOn]     = useState(false);
  const [tryIsSpeaking,  setTryIsSpeaking]  = useState(false);
  const [tryTitle,       setTryTitle]       = useState("");
  const [tryAlgoKey,     setTryAlgoKey]     = useState(null);

  const intervalRef    = useRef(null);
  const tryIntervalRef = useRef(null);
  const activeLineRef  = useRef(null);
  const validateTimer  = useRef(null);

  // Cancel flags for the audio loops — set to true to exit the while loop
  const audioCancelRef    = useRef(false);
  const tryAudioCancelRef = useRef(false);

  const codeLines = code.split("\n");

  // ── stopSpeech: cancel speech & exit any running audio loops ─
  const stopSpeech = useCallback(() => {
    audioCancelRef.current    = true;
    tryAudioCancelRef.current = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTryIsSpeaking(false);
  }, []);

  // ── Main interval playback (audio OFF) ───────────────────────
  useEffect(() => {
    if (!isPlaying || !hasRun || audioOn) return;
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, hasRun, audioOn, speed, steps.length]);

  // ── Main audio-driven playback (audio ON) ────────────────────
  // The loop owns `idx` as a plain local variable — never reads React state.
  // setCurrentStep() is only called to push the display update to React.
  // No cancel() inside speakAsync — that would fire the onend of the
  // currently-awaited utterance and break the sequential flow.
  useEffect(() => {
    if (!isPlaying || !hasRun || !audioOn) return;

    // Capture steps array at the moment play starts (closure snapshot)
    const stepsSnapshot = steps;
    const startIdx      = currentStep;

    audioCancelRef.current = false;

    // Cancel any leftover speech from before, then wait one tick so the
    // browser can fully process the cancel before we start speaking again.
    window.speechSynthesis?.cancel();

    const run = async () => {
      // Give the browser a tick to settle after cancel()
      await new Promise(r => setTimeout(r, 50));

      let idx = startIdx;

      while (!audioCancelRef.current) {
        if (idx >= stepsSnapshot.length) break;

        const stepData = stepsSnapshot[idx];
        if (!stepData) break;

        // Update the UI to show this step
        setCurrentStep(idx);
        setIsSpeaking(true);

        // Await the utterance — speakAsync does NOT call cancel()
        await speakAsync(buildAudioExplanation(idx, stepsSnapshot.length, stepData));

        setIsSpeaking(false);

        // Check if cancelled while we were speaking
        if (audioCancelRef.current) break;

        // Advance
        idx += 1;

        if (idx >= stepsSnapshot.length) {
          setIsPlaying(false);
          break;
        }
      }
      setIsSpeaking(false);
    };

    run();

    return () => {
      audioCancelRef.current = true;
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, hasRun, audioOn]);
  // Intentionally NOT including `steps` or `currentStep` in deps —
  // they are captured via closure snapshot when the effect fires.

  // ── Try It interval playback (audio OFF) ─────────────────────
  useEffect(() => {
    if (!tryIsPlaying || !tryHasRun || tryAudioOn) return;
    tryIntervalRef.current = setInterval(() => {
      setTryCurrentStep(prev => {
        if (prev >= trySteps.length - 1) { setTryIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, trySpeed);
    return () => clearInterval(tryIntervalRef.current);
  }, [tryIsPlaying, tryHasRun, tryAudioOn, trySpeed, trySteps.length]);

  // ── Try It audio-driven playback (audio ON) ──────────────────
  useEffect(() => {
    if (!tryIsPlaying || !tryHasRun || !tryAudioOn) return;

    const stepsSnapshot = trySteps;
    const startIdx      = tryCurrentStep;

    tryAudioCancelRef.current = false;
    window.speechSynthesis?.cancel();

    const run = async () => {
      await new Promise(r => setTimeout(r, 50));

      let idx = startIdx;

      while (!tryAudioCancelRef.current) {
        if (idx >= stepsSnapshot.length) break;

        const stepData = stepsSnapshot[idx];
        if (!stepData) break;

        setTryCurrentStep(idx);
        setTryIsSpeaking(true);

        await speakAsync(buildAudioExplanation(idx, stepsSnapshot.length, stepData));

        setTryIsSpeaking(false);

        if (tryAudioCancelRef.current) break;

        idx += 1;

        if (idx >= stepsSnapshot.length) {
          setTryIsPlaying(false);
          break;
        }
      }
      setTryIsSpeaking(false);
    };

    run();

    return () => {
      tryAudioCancelRef.current = true;
      window.speechSynthesis?.cancel();
      setTryIsSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryIsPlaying, tryHasRun, tryAudioOn]);

  // Stop speech when audio toggle turned off
  useEffect(() => { if (!audioOn)    stopSpeech(); }, [audioOn,    stopSpeech]);
  useEffect(() => { if (!tryAudioOn) stopSpeech(); }, [tryAudioOn, stopSpeech]);

  // Scroll active code line into view
  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentStep]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleSelect = (chapter, program) => {
    stopSpeech();
    setActiveChapter(chapter); setActiveProgram(program); setCode(program.code);
    setHasRun(false); setSteps([]); setCurrentStep(0);
    setIsPlaying(false); setIsEditing(false); setCodeDirty(false);
    setActiveTab("code"); setCodeError(null);
    setTryHasRun(false); setTrySteps([]); setTryCurrentStep(0);
    setTryIsPlaying(false); setTryError(null); setTryAlgoKey(null); setTryCode("");
  };

  const handleCodeChange = (val) => {
    setCode(val); setCodeDirty(true); setIsPlaying(false); setCodeError(null);
    if (validateTimer.current) clearTimeout(validateTimer.current);
    validateTimer.current = setTimeout(async () => {
      setIsValidating(true);
      const err = await validateCodeWithBackend(val);
      setCodeError(err); setIsValidating(false);
    }, 600);
  };

  const handleResetCode = () => {
    stopSpeech();
    setCode(activeProgram.code); setCodeDirty(false); setIsEditing(false);
    setCodeError(null); setHasRun(false); setSteps([]); setCurrentStep(0); setIsPlaying(false);
  };

  const runCode = async () => {
    const freshErr = await validateCodeWithBackend(code);
    if (freshErr) { setCodeError(freshErr); return; }
    stopSpeech();
    setIsRunning(true); setIsPlaying(false); clearInterval(intervalRef.current);
    setTimeout(() => {
      const s = simulateExecution(activeProgram.key, code);
      setSteps(s); setCurrentStep(0); setHasRun(true);
      setIsRunning(false); setCodeDirty(false);
      if (user?.uid) saveVisualizerSession(user.uid, code, activeProgram.label, s.length);
    }, 400);
  };

  const runTryItCode = async () => {
    if (!tryCode.trim()) return;
    const clientErr = validateTryItCode(tryCode, tryLang);
    if (clientErr) { setTryError(clientErr); setTryHasRun(false); setTrySteps([]); return; }
    stopSpeech();
    setTryError(null); setTryHasRun(false); setTrySteps([]);
    setTryCurrentStep(0); setTryRunning(true); setTryIsPlaying(false);
    clearInterval(tryIntervalRef.current);
    const detectedKey = detectAlgorithmKey(tryCode);
    setTryAlgoKey(detectedKey);
    let resultSteps = [], title = "", errorMsg = null;
    if (detectedKey) {
      try { resultSteps = simulateExecution(detectedKey, tryCode); title = ALGO_TITLES[detectedKey] || detectedKey; }
      catch (e) { errorMsg = `Simulation error: ${e.message}`; }
    } else {
      const result = await analyzeCodeWithAI(tryCode, tryLang);
      if (result.error) errorMsg = result.error;
      else { resultSteps = result.steps || []; title = result.title || "Custom Program"; }
    }
    setTryRunning(false);
    if (errorMsg) { setTryError(errorMsg); setTryHasRun(false); return; }
    if (resultSteps.length > 0) {
      setTrySteps(resultSteps); setTryCurrentStep(0); setTryTitle(title);
      setTryHasRun(true); setTryError(null);
    } else {
      setTryError("No steps generated. Make sure your code calls the function.");
    }
  };

  const resetTryIt = () => {
    stopSpeech();
    setTryHasRun(false); setTrySteps([]); setTryCurrentStep(0);
    setTryIsPlaying(false); setTryError(null); setTryAlgoKey(null);
  };

  const step       = steps[currentStep];
  const activeLine = step?.line ?? -1;
  const tryStep    = trySteps[tryCurrentStep];

  const reset    = () => { stopSpeech(); setCurrentStep(0); setIsPlaying(false); };
  const stepBack = () => { stopSpeech(); setIsPlaying(false); setCurrentStep(p => Math.max(0, p - 1)); };
  const stepFwd  = () => { stopSpeech(); setIsPlaying(false); setCurrentStep(p => Math.min(steps.length - 1, p + 1)); };

  const togglePlay = () => {
    if (isPlaying) { stopSpeech(); setIsPlaying(false); }
    else { setIsPlaying(true); }
  };
  const toggleTryPlay = () => {
    if (tryIsPlaying) { stopSpeech(); setTryIsPlaying(false); }
    else { setTryIsPlaying(true); }
  };
  const toggleAudio    = () => { stopSpeech(); setAudioOn(p => !p); };
  const toggleTryAudio = () => { stopSpeech(); setTryAudioOn(p => !p); };
  const handleTabSwitch = tab => { setActiveTab(tab); if (tab !== "code") setIsEditing(false); };

  const isShowingTryIt = activeTab === "tryit" && tryHasRun && !tryError;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="viz-page">
      <ChapterSidebar selectedKey={activeProgram.key} onSelect={handleSelect} />
      <div className="viz-main">

        <div className="viz-topbar">
          <div className="viz-breadcrumb">
            <span className="viz-chapter-name">{activeChapter.label}</span>
            <FiChevronRight size={14} color="var(--text-dim)" />
            <span className="viz-program-name">{activeProgram.label}</span>
            <span className={`diff-badge ${DIFF_COLORS[activeProgram.difficulty]}`}>{activeProgram.difficulty}</span>
          </div>
          <p className="viz-program-desc">{activeProgram.desc}</p>

          {/* Try It player bar */}
          {tryHasRun && !tryError && activeTab === "tryit" && trySteps.length > 0 && (
            <div className="topbar-row">
              <div className="topbar-player">
                <div className="player-controls">
                  <button className="ctrl-btn" onClick={() => { stopSpeech(); setTryCurrentStep(0); setTryIsPlaying(false); }}><FiRotateCcw size={15} /></button>
                  <button className="ctrl-btn" onClick={() => { stopSpeech(); setTryIsPlaying(false); setTryCurrentStep(p => Math.max(0, p - 1)); }} disabled={tryCurrentStep === 0}><FiSkipBack size={15} /></button>
                  <button className="ctrl-btn play-btn" onClick={toggleTryPlay}>{tryIsPlaying ? <FiPause size={17} /> : <FiPlay size={17} />}</button>
                  <button className="ctrl-btn" onClick={() => { stopSpeech(); setTryIsPlaying(false); setTryCurrentStep(p => Math.min(trySteps.length - 1, p + 1)); }} disabled={tryCurrentStep === trySteps.length - 1}><FiSkipForward size={15} /></button>
                  <button className={`ctrl-btn audio-btn ${tryAudioOn ? "audio-on" : ""} ${tryIsSpeaking ? "audio-speaking" : ""}`} onClick={toggleTryAudio}>
                    {tryAudioOn ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                  </button>
                </div>
                <div className="player-progress">
                  <span className="player-step">{tryCurrentStep + 1} / {trySteps.length}</span>
                  <input type="range" className="step-slider" min={0} max={trySteps.length - 1} value={tryCurrentStep}
                    onChange={e => { stopSpeech(); setTryIsPlaying(false); setTryCurrentStep(Number(e.target.value)); }} />
                  <SpeedSelect value={trySpeed} onChange={setTrySpeed} />
                </div>
                {trySteps[tryCurrentStep] && (
                  <div className={`player-note ${tryAudioOn ? "player-note-audio" : ""}`}>
                    {tryAudioOn && <span className={`audio-indicator ${tryIsSpeaking ? "audio-pulse" : ""}`}>{tryIsSpeaking ? "🔊" : "🔈"}</span>}
                    <span className="note-step">Step {tryCurrentStep + 1}:</span>
                    <span className="note-text">{trySteps[tryCurrentStep].note}</span>
                  </div>
                )}
              </div>
              <TopbarCallStack step={trySteps[tryCurrentStep]} />
            </div>
          )}

          {/* Code tab player bar */}
          {hasRun && activeTab === "code" && (
            <div className="topbar-row">
              <div className="topbar-player">
                <div className="player-controls">
                  <button className="ctrl-btn" onClick={reset}><FiRotateCcw size={15} /></button>
                  <button className="ctrl-btn" onClick={stepBack} disabled={currentStep === 0}><FiSkipBack size={15} /></button>
                  <button className="ctrl-btn play-btn" onClick={togglePlay}>{isPlaying ? <FiPause size={17} /> : <FiPlay size={17} />}</button>
                  <button className="ctrl-btn" onClick={stepFwd} disabled={currentStep === steps.length - 1}><FiSkipForward size={15} /></button>
                  <button className={`ctrl-btn audio-btn ${audioOn ? "audio-on" : ""} ${isSpeaking ? "audio-speaking" : ""}`} onClick={toggleAudio}>
                    {audioOn ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                  </button>
                </div>
                <div className="player-progress">
                  <span className="player-step">{currentStep + 1} / {steps.length}</span>
                  <input type="range" className="step-slider" min={0} max={steps.length - 1} value={currentStep}
                    onChange={e => { stopSpeech(); setIsPlaying(false); setCurrentStep(Number(e.target.value)); }} />
                  <SpeedSelect value={speed} onChange={setSpeed} />
                </div>
                {step && (
                  <div className={`player-note ${audioOn ? "player-note-audio" : ""}`}>
                    {audioOn && <span className={`audio-indicator ${isSpeaking ? "audio-pulse" : ""}`}>{isSpeaking ? "🔊" : "🔈"}</span>}
                    <span className="note-step">Step {currentStep + 1}:</span>
                    <span className="note-text">{step.note}</span>
                  </div>
                )}
              </div>
              <TopbarCallStack step={step} />
            </div>
          )}
        </div>

        <div className="viz-layout">
          <div className="editor-panel card">
            <div className="panel-header">
              <div className="panel-tabs">
                <button className={`panel-tab ${activeTab === "code" ? "panel-tab-active" : ""}`} onClick={() => handleTabSwitch("code")}>
                  <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 7px" }}>python</span>
                  <span style={{ marginLeft: 5 }}>Code</span>
                </button>
                <button className={`panel-tab ${activeTab === "theory" ? "panel-tab-active panel-tab-theory" : ""}`} onClick={() => handleTabSwitch("theory")}>
                  <FiBookOpen size={13} style={{ marginRight: 4 }} />Theory
                </button>
                <button className={`panel-tab ${activeTab === "tryit" ? "panel-tab-active panel-tab-tryit" : ""}`} onClick={() => handleTabSwitch("tryit")}>
                  <FiCode size={13} style={{ marginRight: 4 }} />Try It
                </button>
              </div>
              {activeTab === "code" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {isEditing && <button className="edit-toggle reset-btn" onClick={handleResetCode}><FiRefreshCw size={12} /> Reset</button>}
                  <button className={`edit-toggle ${isEditing ? "edit-active" : ""}`} onClick={() => { setIsEditing(p => !p); setCodeError(null); }}>
                    <FiEdit3 size={13} />{isEditing ? "Editing" : "Edit"}
                  </button>
                </div>
              )}
            </div>

            {activeTab === "theory" ? (
              <TheoryPanel theory={activeProgram.theory} />
            ) : activeTab === "tryit" ? (
              <TryItPanel tryLang={tryLang} setTryLang={setTryLang} tryCode={tryCode} setTryCode={setTryCode}
                tryError={tryError} tryRunning={tryRunning} tryHasRun={tryHasRun} tryTitle={tryTitle}
                tryAlgoKey={tryAlgoKey} onRun={runTryItCode} onReset={resetTryIt} />
            ) : isEditing ? (
              <>
                <textarea className={`code-textarea ${codeError ? "code-textarea-error" : ""}`}
                  value={code} onChange={e => handleCodeChange(e.target.value)}
                  spellCheck={false} autoComplete="off" autoCorrect="off" />
                {codeError && <div className="code-error-banner"><FiAlertCircle size={14} /><span>{codeError}</span></div>}
              </>
            ) : (
              <div className="code-editor-wrap">
                {codeLines.map((line, i) => {
                  const isActive = !codeDirty && activeLine === i + 1 && hasRun;
                  return (
                    <div key={i} ref={isActive ? activeLineRef : null}
                      className={`editor-line ${isActive ? "editor-line-active" : ""}`}>
                      <span className="editor-lnum">{i + 1}</span>
                      <span className="editor-text">{line || " "}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "code" && (
              <div className="editor-footer">
                <button className="btn btn-primary" onClick={runCode} disabled={isRunning || isValidating || !!codeError}>
                  {isRunning ? <><FiCpu size={14} className="spin" /> Analyzing...</>
                    : isValidating ? <><FiCpu size={14} className="spin" /> Checking...</>
                    : codeDirty ? <><FiRefreshCw size={14} /> Re-run with Changes</>
                    : <><FiPlay size={14} /> Run & Visualize</>}
                </button>
                {codeError && <span className="dirty-hint" style={{ color: "var(--red)" }}>Fix error before running.</span>}
                {!codeError && codeDirty && hasRun && <span className="dirty-hint">Code changed — press Re-run to update.</span>}
              </div>
            )}
          </div>

          <div className="vis-panel">
            {isShowingTryIt ? (
              tryAlgoKey
                ? <ProgramDiagram step={tryStep} programKey={tryAlgoKey} allSteps={trySteps} currentStepIdx={tryCurrentStep} />
                : <GenericStepCard step={tryStep} currentStep={tryCurrentStep} totalSteps={trySteps.length} title={tryTitle} />
            ) : activeTab === "tryit" && !tryHasRun ? (
              <div className="vis-empty card">
                <FiCode size={28} color="var(--text-dim)" />
                <p>Write code in the <strong>Try It</strong> panel and click <strong>Run &amp; Visualize</strong>.</p>
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
                  Supports Python, JavaScript, Java, and C.<br />Known algorithms show the same flow diagrams as the Code tab.
                </p>
              </div>
            ) : !hasRun && activeTab === "code" ? (
              <div className="vis-empty card">
                <FiAlertCircle size={28} color="var(--text-dim)" />
                <p>Press <strong>Run & Visualize</strong> to start stepping.</p>
              </div>
            ) : codeDirty && activeTab === "code" ? (
              <div className="vis-stale card">
                <FiRefreshCw size={22} color="var(--orange)" />
                <p>Code was edited. Press <strong>Re-run with Changes</strong> to update.</p>
              </div>
            ) : activeTab === "code" ? (
              <ProgramDiagram step={step} programKey={activeProgram.key} allSteps={steps} currentStepIdx={currentStep} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Algorithm display titles ──────────────────────────────────
const ALGO_TITLES = {
  factorial: "Factorial — Recursion", fibonacci: "Fibonacci — Recursion",
  sum_array: "Sum of Array — Recursion", tower_of_hanoi: "Tower of Hanoi — Recursion",
  bubble_sort: "Bubble Sort", selection_sort: "Selection Sort",
  insertion_sort: "Insertion Sort", merge_sort: "Merge Sort", quick_sort: "Quick Sort",
  linear_search: "Linear Search", binary_search: "Binary Search", jump_search: "Jump Search",
  linked_list: "Linked List", stack_impl: "Stack (LIFO)", queue_impl: "Queue (FIFO)",
  bst_insert: "Binary Search Tree", bfs: "BFS — Breadth-First Search",
  dfs: "DFS — Depth-First Search", fib_dp: "Fibonacci — Dynamic Programming",
  knapsack: "0/1 Knapsack — DP", lcs: "Longest Common Subsequence — DP",
};

// ── Generic Step Card (Try It fallback) ───────────────────────
function GenericStepCard({ step, currentStep, totalSteps, title }) {
  if (!step) return null;
  const vars = step?.stack?.[0]?.vars || {};
  const note = step?.note || "";
  const outputMatch = note.match(/→\s*Output[:\s]+(.+)/i);
  const outputVal   = outputMatch ? outputMatch[1].trim() : null;
  return (
    <div className="generic-step-card card">
      <div className="gsc-header">
        <span className="gsc-title">{title || "Custom Program"}</span>
        <span className="gsc-counter">Step {currentStep + 1} / {totalSteps}</span>
      </div>
      <div className="gsc-note">
        <span className="gsc-note-text">{note.replace(/→\s*Output[:\s]+.+/i, "").trim()}</span>
        {outputVal && <div className="gsc-output"><span className="gsc-output-label">OUTPUT</span><span className="gsc-output-val">{outputVal}</span></div>}
      </div>
      {Object.keys(vars).length > 0 && (
        <div className="gsc-vars">
          <div className="gsc-vars-label">VARIABLES</div>
          <div className="gsc-vars-grid">
            {Object.entries(vars).slice(0, 8).map(([k, v]) => (
              <div key={k} className="gsc-var">
                <span className="gsc-var-name">{k}</span><span className="gsc-var-eq">=</span>
                <span className="gsc-var-val">{String(v).length > 28 ? String(v).slice(0, 28) + "…" : String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {step.depth > 0 && (
        <div className="gsc-depth">
          <span className="gsc-depth-label">Call depth</span>
          <div className="gsc-depth-bars">
            {Array.from({ length: Math.min(step.depth, 10) }).map((_, i) => (
              <span key={i} className="gsc-depth-bar" style={{ opacity: 1 - i * 0.08 }} />
            ))}
          </div>
          <span className="gsc-depth-num">{step.depth}</span>
        </div>
      )}
      <div className="gsc-hint">
        <FiZap size={11} color="var(--text-dim)" />
        <span>Write a named algorithm (factorial, bubble sort…) to see its flow diagram</span>
      </div>
    </div>
  );
}
