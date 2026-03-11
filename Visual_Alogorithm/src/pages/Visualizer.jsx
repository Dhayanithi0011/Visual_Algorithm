import { useState, useRef, useEffect } from "react";
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiRotateCcw, FiCpu, FiAlertCircle, FiChevronRight,
  FiEdit3, FiRefreshCw, FiBookOpen
} from "react-icons/fi";
import { saveVisualizerSession } from "../services/sessions";
import { ProgramDiagram } from "./VisualizerDiagrams";
import { CHAPTERS, DIFF_COLORS } from "./visualizerData";
import { simulateExecution } from "./simulators";
import { validateCodeWithBackend } from "./codeValidator";
import { TheoryPanel, ChapterSidebar } from "./VisualizerPanels";
import "./Visualizer.css";

// ── Topbar Call Stack Card ─────────────────────────────────────────────────
// Shown in the right half of the topbar for every program that has stack data.
function TopbarCallStack({ step }) {
  if (!step?.stack || step.stack.length === 0) return (
    <div className="topbar-stack topbar-stack-empty" />
  );

  const frames = step.stack;

  return (
    <div className="topbar-stack">
      <div className="stack-viz-compact">
        {/* Header */}
        <div className="stack-viz-compact-header">
          <span className="svc-title">Call Stack</span>
          <span className="stack-depth-badge">
            {frames.length} frame{frames.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Frames — horizontal scroll */}
        <div className="stack-compact-frames">
          {frames.map((frame, i) => {
            const isActive   = i === 0;
            const isReturning = !!frame.returning;
            return (
              <div
                key={i}
                className={[
                  "stack-compact-frame",
                  isActive && isReturning ? "scf-returning"
                    : isActive            ? "scf-active"
                    :                       "scf-lower",
                ].join(" ")}
              >
                <div className="scf-header">
                  <span className="scf-num">#{frames.length - i}</span>
                  <span className="scf-name">{frame.fn}()</span>
                  {isReturning
                    ? <span className="scf-badge scf-return-badge">↩ RET</span>
                    : isActive
                      ? <span className="scf-badge scf-active-badge">ACTIVE</span>
                      : <span className="scf-badge scf-wait-badge">wait</span>
                  }
                </div>

                {Object.entries(frame.vars || {}).slice(0, 4).map(([k, v]) => (
                  <span
                    key={k}
                    className={`scf-var ${k.startsWith("↩") ? "scf-var-ret" : ""}`}
                  >
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

export default function Visualizer({ user, onProgramWatched }) {
  const defaultChapter = CHAPTERS[0];
  const defaultProgram = CHAPTERS[0].programs[0];

  const [activeChapter, setActiveChapter] = useState(defaultChapter);
  const [activeProgram, setActiveProgram] = useState(defaultProgram);
  const [code, setCode] = useState(defaultProgram.code);
  const [isEditing, setIsEditing] = useState(false);
  const [codeDirty, setCodeDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [codeError, setCodeError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const validateTimerRef = useRef(null);

  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [speed, setSpeed] = useState(900);

  const intervalRef  = useRef(null);
  const activeLineRef = useRef(null);

  const codeLines = code.split("\n");

  const handleSelect = (chapter, program) => {
    setActiveChapter(chapter);
    setActiveProgram(program);
    setCode(program.code);
    setHasRun(false);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setIsEditing(false);
    setCodeDirty(false);
    setActiveTab("code");
    setCodeError(null);
  };

  const handleCodeChange = (val) => {
    setCode(val);
    setCodeDirty(true);
    setIsPlaying(false);
    setCodeError(null);

    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(async () => {
      setIsValidating(true);
      const err = await validateCodeWithBackend(val);
      setCodeError(err);
      setIsValidating(false);
    }, 600);
  };

  const handleResetCode = () => {
    setCode(activeProgram.code);
    setCodeDirty(false);
    setIsEditing(false);
    setCodeError(null);
    setHasRun(false);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const runCode = async () => {
    const freshErr = await validateCodeWithBackend(code);
    if (freshErr) { setCodeError(freshErr); return; }
    setIsRunning(true);
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    setTimeout(() => {
      const s = simulateExecution(activeProgram.key, code);
      setSteps(s);
      setCurrentStep(0);
      setHasRun(true);
      setIsRunning(false);
      setCodeDirty(false);
      // Notify parent that this program has been watched
      onProgramWatched?.(activeProgram.key);
      if (user?.uid) {
        saveVisualizerSession(user.uid, code, activeProgram.label, s.length);
      }
    }, 400);
  };

  useEffect(() => {
    if (isPlaying && hasRun) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, hasRun, steps, speed]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentStep]);

  const step       = steps[currentStep];
  const activeLine = step?.line ?? -1;

  const reset    = () => { setCurrentStep(0); setIsPlaying(false); };
  const stepBack = () => setCurrentStep(p => Math.max(0, p - 1));
  const stepFwd  = () => setCurrentStep(p => Math.min(steps.length - 1, p + 1));

  return (
    <div className="viz-page">
      <ChapterSidebar selectedKey={activeProgram.key} onSelect={handleSelect} />

      <div className="viz-main">
        {/* ── Topbar ── */}
        <div className="viz-topbar">
          <div className="viz-breadcrumb">
            <span className="viz-chapter-name">{activeChapter.label}</span>
            <FiChevronRight size={14} color="var(--text-dim)" />
            <span className="viz-program-name">{activeProgram.label}</span>
            <span className={`diff-badge ${DIFF_COLORS[activeProgram.difficulty]}`}>
              {activeProgram.difficulty}
            </span>
          </div>
          <p className="viz-program-desc">{activeProgram.desc}</p>

          {hasRun && (
            <div className="topbar-row">
              {/* Left: player */}
              <div className="topbar-player">
                <div className="player-controls">
                  <button className="ctrl-btn" onClick={reset} title="Reset to start">
                    <FiRotateCcw size={15} />
                  </button>
                  <button className="ctrl-btn" onClick={stepBack} title="Step back" disabled={currentStep === 0}>
                    <FiSkipBack size={15} />
                  </button>
                  <button className="ctrl-btn play-btn" onClick={() => setIsPlaying(p => !p)}>
                    {isPlaying ? <FiPause size={17} /> : <FiPlay size={17} />}
                  </button>
                  <button className="ctrl-btn" onClick={stepFwd} title="Step forward" disabled={currentStep === steps.length - 1}>
                    <FiSkipForward size={15} />
                  </button>
                </div>

                <div className="player-progress">
                  <span className="player-step">{currentStep + 1} / {steps.length}</span>
                  <input
                    type="range"
                    className="step-slider"
                    min={0}
                    max={steps.length - 1}
                    value={currentStep}
                    onChange={e => setCurrentStep(Number(e.target.value))}
                  />
                  <div className="speed-control">
                    <span className="speed-label">Speed</span>
                    <select className="speed-select" value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                      <option value={1500}>0.5×</option>
                      <option value={900}>1×</option>
                      <option value={500}>2×</option>
                      <option value={200}>4×</option>
                    </select>
                  </div>
                </div>

                {step && (
                  <div className="player-note">
                    <span className="note-step">Step {currentStep + 1}:</span>
                    <span className="note-text">{step.note}</span>
                  </div>
                )}
              </div>

              {/* Right: call stack — shown for every program */}
              <TopbarCallStack step={step} />
            </div>
          )}
        </div>

        {/* ── Editor + Viz layout ── */}
        <div className="viz-layout">
          {/* Editor Panel */}
          <div className="editor-panel card">
            <div className="panel-header">
              <div className="panel-tabs">
                <button
                  className={`panel-tab ${activeTab === "code" ? "panel-tab-active" : ""}`}
                  onClick={() => { setActiveTab("code"); setIsEditing(false); }}
                >
                  <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 7px" }}>python</span>
                  <span style={{ marginLeft: 5 }}>Code</span>
                </button>
                <button
                  className={`panel-tab ${activeTab === "theory" ? "panel-tab-active panel-tab-theory" : ""}`}
                  onClick={() => { setActiveTab("theory"); setIsEditing(false); }}
                >
                  <FiBookOpen size={13} style={{ marginRight: 4 }} />
                  Theory
                </button>
              </div>
              {activeTab === "code" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {isEditing && (
                    <button className="edit-toggle reset-btn" onClick={handleResetCode} title="Reset to original code">
                      <FiRefreshCw size={12} /> Reset
                    </button>
                  )}
                  <button
                    className={`edit-toggle ${isEditing ? "edit-active" : ""}`}
                    onClick={() => { setIsEditing(p => !p); setCodeError(null); }}
                    title="Toggle edit mode"
                  >
                    <FiEdit3 size={13} />
                    {isEditing ? "Editing" : "Edit"}
                  </button>
                </div>
              )}
            </div>

            {activeTab === "theory" ? (
              <TheoryPanel theory={activeProgram.theory} />
            ) : isEditing ? (
              <>
                <textarea
                  className={`code-textarea ${codeError ? "code-textarea-error" : ""}`}
                  value={code}
                  onChange={e => handleCodeChange(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                />
                {codeError && (
                  <div className="code-error-banner">
                    <FiAlertCircle size={14} />
                    <span>{codeError}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="code-editor-wrap">
                {codeLines.map((line, i) => {
                  const isActive = !codeDirty && activeLine === i + 1 && hasRun;
                  return (
                    <div
                      key={i}
                      ref={isActive ? activeLineRef : null}
                      className={`editor-line ${isActive ? "editor-line-active" : ""}`}
                    >
                      <span className="editor-lnum">{i + 1}</span>
                      <span className="editor-text">{line || " "}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "code" && (
              <div className="editor-footer">
                <button
                  className="btn btn-primary"
                  onClick={runCode}
                  disabled={isRunning || isValidating || !!codeError}
                >
                  {isRunning
                    ? <><FiCpu size={14} className="spin" /> Analyzing...</>
                    : isValidating
                      ? <><FiCpu size={14} className="spin" /> Checking...</>
                      : codeDirty
                        ? <><FiRefreshCw size={14} /> Re-run with Changes</>
                        : <><FiPlay size={14} /> Run & Visualize</>
                  }
                </button>
                {codeError && (
                  <span className="dirty-hint" style={{ color: "var(--red)" }}>Fix error before running.</span>
                )}
                {!codeError && codeDirty && hasRun && (
                  <span className="dirty-hint">Code changed — press Re-run to update.</span>
                )}
              </div>
            )}
          </div>

          {/* Visualization Panel */}
          <div className="vis-panel">
            {!hasRun ? (
              <div className="vis-empty card">
                <FiAlertCircle size={28} color="var(--text-dim)" />
                <p>Press <strong>Run & Visualize</strong> to start stepping.</p>
                {isEditing && <p className="vis-hint">You can edit the code first, then run.</p>}
              </div>
            ) : codeDirty ? (
              <div className="vis-stale card">
                <FiRefreshCw size={22} color="var(--orange)" />
                <p>Code was edited. Press <strong>Re-run with Changes</strong> to update.</p>
              </div>
            ) : (
              <ProgramDiagram
                step={step}
                programKey={activeProgram.key}
                allSteps={steps}
                currentStepIdx={currentStep}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
