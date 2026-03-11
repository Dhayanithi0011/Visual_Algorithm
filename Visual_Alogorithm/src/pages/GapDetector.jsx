import { useState } from "react";
import {
  FiChevronRight, FiChevronDown, FiCheckCircle, FiXCircle,
  FiAlertTriangle, FiAward, FiRefreshCw, FiBarChart2,
  FiTarget, FiArrowRight, FiArrowLeft, FiZap,
  FiStar, FiTrendingUp, FiList, FiLock, FiPlayCircle,
  FiUnlock, FiEye
} from "react-icons/fi";
import { QUIZ_CHAPTERS } from "./quizData";
import { saveGapAnalysis } from "../services/sessions";
import "./GapDetector.css";

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const CHAPTER_COLORS = {
  recursion:           { accent: "#7c5cbf", bg: "rgba(124,92,191,0.1)"  },
  sorting:             { accent: "#2d8fd9", bg: "rgba(45,143,217,0.1)"  },
  searching:           { accent: "#12a08f", bg: "rgba(18,160,143,0.1)"  },
  data_structures:     { accent: "#d4721e", bg: "rgba(212,114,30,0.1)"  },
  graph:               { accent: "#9b4fd1", bg: "rgba(155,79,209,0.1)"  },
  dynamic_programming: { accent: "#1e9e4a", bg: "rgba(30,158,74,0.1)"   },
};

const CHAPTER_ICONS = {
  recursion: "⟲", sorting: "≋", searching: "⌕",
  data_structures: "⊞", graph: "⬡", dynamic_programming: "◈",
};

// Minimum passing score to unlock the next quiz
const PASS_SCORE = 60;

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function scoreLabel(pct) {
  if (pct >= 80) return { text: "Mastered",   color: "#1e9e4a" };
  if (pct >= 60) return { text: "Good",        color: "#2d8fd9" };
  if (pct >= 40) return { text: "Needs Work",  color: "#e0952a" };
  return           { text: "Weak",        color: "#d94f4f" };
}

/**
 * Given a chapter's programs + watched set + scores, return which quiz
 * index is currently unlocked (0-based). Rules:
 *   - A program quiz is unlocked only if its program was watched in Visualizer
 *   - The FIRST program in a chapter is always unlocked once watched
 *   - Program N+1 is unlocked only if program N quiz score >= PASS_SCORE
 */
function getUnlockedIndex(programs, watchedPrograms, scores) {
  // Find the furthest index we can unlock
  let unlocked = -1;
  for (let i = 0; i < programs.length; i++) {
    const key = programs[i].key;
    if (!watchedPrograms.has(key)) break;          // must be watched first
    unlocked = i;                                   // watched → at least unlocked
    if (scores[key] === undefined) break;           // hasn't been quizzed yet
    if (scores[key] < PASS_SCORE) break;            // failed → don't unlock next
  }
  return unlocked;
}

// ─────────────────────────────────────────────────────────────────
// QUIZ QUESTION CARD
// ─────────────────────────────────────────────────────────────────
function QuizQuestion({ question, qIndex, total, selected, onSelect, submitted }) {
  return (
    <div className="quiz-q-card">
      <div className="quiz-q-header">
        <span className="quiz-q-num">Q{qIndex + 1} <span className="quiz-q-of">/ {total}</span></span>
        <div className="quiz-q-progress-dots">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`q-dot ${i === qIndex ? "q-dot-active" : i < qIndex ? "q-dot-done" : ""}`} />
          ))}
        </div>
      </div>
      <p className="quiz-q-text">{question.q}</p>
      <div className="quiz-options">
        {question.options.map((opt, oi) => {
          let cls = "quiz-option";
          if (submitted) {
            if (oi === question.answer) cls += " opt-correct";
            else if (oi === selected && oi !== question.answer) cls += " opt-wrong";
            else cls += " opt-dim";
          } else if (oi === selected) cls += " opt-selected";
          return (
            <button key={oi} className={cls} onClick={() => !submitted && onSelect(oi)} disabled={submitted}>
              <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
              <span className="opt-text">{opt}</span>
              {submitted && oi === question.answer && <FiCheckCircle size={15} className="opt-icon opt-icon-correct" />}
              {submitted && oi === selected && oi !== question.answer && <FiXCircle size={15} className="opt-icon opt-icon-wrong" />}
            </button>
          );
        })}
      </div>
      {submitted && (
        <div className="quiz-explanation">
          <FiZap size={13} color="#f0c040" />
          <span>{question.explanation}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROGRAM QUIZ (full quiz flow)
// ─────────────────────────────────────────────────────────────────
function ProgramQuiz({ chapter, program, onFinish, onBack }) {
  const questions = program.questions;
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(Array(questions.length).fill(false));
  const [done, setDone] = useState(false);

  const col = CHAPTER_COLORS[chapter.id] || CHAPTER_COLORS.recursion;
  const finalPct = Math.round(
    (answers.filter((a, i) => a === questions[i].answer).length / questions.length) * 100
  );
  const lbl = scoreLabel(finalPct);
  const passed = finalPct >= PASS_SCORE;

  if (done) {
    return (
      <div className="quiz-result-view">
        <div className="quiz-result-header" style={{ borderColor: col.accent }}>
          <div className="quiz-result-icon" style={{ background: col.bg, color: col.accent }}>
            <FiAward size={32} />
          </div>
          <div>
            <div className="quiz-result-program">{program.label}</div>
            <div className="quiz-result-chapter">{chapter.label}</div>
          </div>
        </div>

        <div className="quiz-score-ring-wrap">
          <div className="quiz-score-ring" style={{ "--ring-color": lbl.color }}>
            <span className="ring-pct">{finalPct}%</span>
            <span className="ring-label">{lbl.text}</span>
          </div>
          <div className="quiz-score-breakdown">
            <div className="score-stat"><FiCheckCircle size={14} color="#1e9e4a" /><span>{answers.filter((a,i) => a === questions[i].answer).length} correct</span></div>
            <div className="score-stat"><FiXCircle size={14} color="#d94f4f" /><span>{questions.length - answers.filter((a,i) => a === questions[i].answer).length} wrong</span></div>
            <div className="score-stat"><FiList size={14} color="#888" /><span>{questions.length} total</span></div>
          </div>
          <div className={`quiz-pass-banner ${passed ? "pass-banner-ok" : "pass-banner-fail"}`}>
            {passed
              ? <><FiUnlock size={15} /> Passed! Next program quiz unlocked.</>
              : <><FiLock size={15} /> Score below {PASS_SCORE}% — retake to unlock the next quiz.</>
            }
          </div>
        </div>

        <div className="quiz-review-list">
          <div className="quiz-review-title">Answer Review</div>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.answer;
            return (
              <div key={i} className={`review-item ${isCorrect ? "review-correct" : "review-wrong"}`}>
                <div className="review-q-row">
                  {isCorrect ? <FiCheckCircle size={14} color="#1e9e4a" /> : <FiXCircle size={14} color="#d94f4f" />}
                  <span className="review-q-text">Q{i+1}: {q.q}</span>
                </div>
                {!isCorrect && (
                  <div className="review-answer-row">
                    <span className="review-your">Your answer: <b>{answers[i] !== null ? q.options[answers[i]] : "Not answered"}</b></span>
                    <span className="review-correct-ans">Correct: <b>{q.options[q.answer]}</b></span>
                  </div>
                )}
                <div className="review-explanation">{q.explanation}</div>
              </div>
            );
          })}
        </div>

        <div className="quiz-done-actions">
          <button className="btn btn-ghost" onClick={onBack}><FiArrowLeft size={14} /> Back</button>
          <button className="btn btn-primary" onClick={() => onFinish(program.key, finalPct)}>
            Save & Continue <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const sel = answers[qIndex];
  const isSub = submitted[qIndex];
  return (
    <div className="program-quiz-view">
      <div className="quiz-topbar">
        <button className="btn btn-ghost quiz-back-btn" onClick={onBack}><FiArrowLeft size={14} /> Back</button>
        <div className="quiz-topbar-info">
          <span className="quiz-chapter-tag" style={{ background: col.bg, color: col.accent }}>{chapter.label}</span>
          <span className="quiz-program-name">{program.label}</span>
        </div>
        <div className="quiz-progress-text">{qIndex + 1} / {questions.length}</div>
      </div>
      <QuizQuestion
        question={questions[qIndex]}
        qIndex={qIndex}
        total={questions.length}
        selected={sel}
        onSelect={(oi) => { const a = [...answers]; a[qIndex] = oi; setAnswers(a); }}
        submitted={isSub}
      />
      <div className="quiz-nav-row">
        {!isSub ? (
          <button className="btn btn-primary" onClick={() => { if (sel === null) return; const s=[...submitted]; s[qIndex]=true; setSubmitted(s); }} disabled={sel === null}>
            Check Answer
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => { if (qIndex < questions.length - 1) setQIndex(qIndex + 1); else setDone(true); }}>
            {qIndex < questions.length - 1 ? <>Next Question <FiArrowRight size={14} /></> : <>Finish Quiz <FiAward size={14} /></>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CHAPTER ACCORDION ROW  (vertical list style)
// ─────────────────────────────────────────────────────────────────
function ChapterRow({ chapter, scores, watchedPrograms, onStartQuiz, onNavigateToVisualizer, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const col = CHAPTER_COLORS[chapter.id] || CHAPTER_COLORS.recursion;

  const unlockedIdx = getUnlockedIndex(chapter.programs, watchedPrograms, scores);
  const attempted = chapter.programs.filter(p => scores[p.key] !== undefined);
  const chapterAvg = attempted.length
    ? Math.round(attempted.reduce((acc, p) => acc + scores[p.key], 0) / attempted.length)
    : null;
  const allDone = attempted.length === chapter.programs.length;

  return (
    <div className={`chapter-row ${open ? "chapter-row-open" : ""}`} style={{ "--ch-accent": col.accent }}>
      {/* Chapter header — click to expand */}
      <button className="chapter-row-header" onClick={() => setOpen(o => !o)}>
        <div className="crh-left">
          <span className="crh-icon" style={{ background: col.bg, color: col.accent }}>
            {CHAPTER_ICONS[chapter.id]}
          </span>
          <div className="crh-info">
            <span className="crh-name">{chapter.label}</span>
            <span className="crh-sub">{chapter.programs.length} programs</span>
          </div>
        </div>
        <div className="crh-right">
          {chapterAvg !== null && (
            <span className="crh-avg" style={{ color: scoreLabel(chapterAvg).color }}>{chapterAvg}%</span>
          )}
          <div className="crh-dots">
            {chapter.programs.map((p, i) => {
              const s = scores[p.key];
              return (
                <span
                  key={p.key}
                  className="crh-dot"
                  style={{
                    background: s === undefined
                      ? (i <= unlockedIdx ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)")
                      : scoreLabel(s).color
                  }}
                />
              );
            })}
          </div>
          {allDone && <FiCheckCircle size={14} color={col.accent} />}
          {open ? <FiChevronDown size={16} color="#666" /> : <FiChevronRight size={16} color="#666" />}
        </div>
      </button>

      {/* Program quiz cards — vertical list */}
      {open && (
        <div className="chapter-programs-list">
          {chapter.programs.map((prog, idx) => {
            const pct      = scores[prog.key];
            const watched  = watchedPrograms.has(prog.key);
            const isUnlocked = idx <= unlockedIdx;
            const isDone   = pct !== undefined;
            const lbl      = isDone ? scoreLabel(pct) : null;

            // Lock state
            const lockReason = !watched
              ? "watch"    // needs to be run in Visualizer first
              : !isUnlocked
              ? "score"    // previous quiz not passed yet
              : null;      // unlocked!

            return (
              <div key={prog.key} className={`prog-row ${lockReason ? "prog-row-locked" : ""} ${isDone ? "prog-row-done" : ""}`}>
                {/* Number badge */}
                <div className="pr-num" style={{
                  background: lockReason ? "rgba(255,255,255,0.04)" : col.bg,
                  color: lockReason ? "#444" : col.accent
                }}>
                  {isDone
                    ? <FiCheckCircle size={14} />
                    : lockReason
                    ? <FiLock size={13} />
                    : <span>{idx + 1}</span>
                  }
                </div>

                {/* Program info */}
                <div className="pr-info">
                  <div className="pr-name" style={{ color: lockReason ? "#555" : "var(--text)" }}>
                    {prog.label}
                  </div>
                  {isDone && (
                    <div className="pr-score-row">
                      <div className="pr-bar-track">
                        <div className="pr-bar" style={{ width: `${pct}%`, background: lbl.color }} />
                      </div>
                      <span className="pr-pct" style={{ color: lbl.color }}>{pct}% — {lbl.text}</span>
                    </div>
                  )}
                  {!isDone && lockReason === "watch" && (
                    <div className="pr-lock-msg">
                      <FiEye size={12} color="#555" />
                      <span>Run this program in the Visualizer first</span>
                    </div>
                  )}
                  {!isDone && lockReason === "score" && (
                    <div className="pr-lock-msg">
                      <FiLock size={12} color="#555" />
                      <span>Score ≥{PASS_SCORE}% on the previous quiz to unlock</span>
                    </div>
                  )}
                  {!isDone && !lockReason && (
                    <div className="pr-lock-msg pr-ready">
                      <FiUnlock size={12} color={col.accent} />
                      <span style={{ color: col.accent }}>Ready to quiz!</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="pr-action">
                  {lockReason === "watch" ? (
                    <button
                      className="pr-btn pr-btn-watch"
                      onClick={() => onNavigateToVisualizer(prog.key)}
                      title="Open in Visualizer"
                    >
                      <FiPlayCircle size={13} /> Watch
                    </button>
                  ) : lockReason === "score" ? (
                    <div className="pr-locked-badge">
                      <FiLock size={12} /> Locked
                    </div>
                  ) : isDone ? (
                    <button className="pr-btn pr-btn-retake" onClick={() => onStartQuiz(chapter, prog)}>
                      <FiRefreshCw size={12} /> Retake
                    </button>
                  ) : (
                    <button
                      className="pr-btn pr-btn-start"
                      style={{ background: col.accent }}
                      onClick={() => onStartQuiz(chapter, prog)}
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GAP ANALYSIS RESULTS VIEW
// ─────────────────────────────────────────────────────────────────
function GapResults({ scores, onRetake }) {
  const allPrograms = QUIZ_CHAPTERS.flatMap(ch =>
    ch.programs.map(p => ({ ...p, chapterId: ch.id, chapterLabel: ch.label }))
  );
  const attempted = allPrograms.filter(p => scores[p.key] !== undefined);
  const overall   = attempted.length
    ? Math.round(attempted.reduce((acc, p) => acc + scores[p.key], 0) / attempted.length) : 0;

  const weak     = attempted.filter(p => scores[p.key] < 40);
  const needsWork= attempted.filter(p => scores[p.key] >= 40 && scores[p.key] < 60);
  const mastered = attempted.filter(p => scores[p.key] >= 80);
  const learningPath = [...weak, ...needsWork].sort((a,b) => scores[a.key] - scores[b.key]);
  const overallLbl = scoreLabel(overall);

  const chapterStats = QUIZ_CHAPTERS.map(ch => {
    const progs = ch.programs.filter(p => scores[p.key] !== undefined);
    const avg = progs.length ? Math.round(progs.reduce((acc,p) => acc+scores[p.key],0)/progs.length) : null;
    return { ...ch, avg, attempted: progs.length };
  }).filter(c => c.attempted > 0);

  return (
    <div className="gap-results fade-in">
      <div className="gap-hero card">
        <div className="gap-hero-left">
          <div className="gap-overall-ring" style={{ "--ring-color": overallLbl.color }}>
            <span className="ring-pct">{overall}%</span>
            <span className="ring-label">Overall</span>
          </div>
          <div className="gap-hero-stats">
            <div className="gh-stat"><span className="gh-val">{attempted.length}</span><span className="gh-key">Quizzes taken</span></div>
            <div className="gh-stat"><span className="gh-val" style={{color:"#1e9e4a"}}>{mastered.length}</span><span className="gh-key">Mastered</span></div>
            <div className="gh-stat"><span className="gh-val" style={{color:"#d94f4f"}}>{weak.length}</span><span className="gh-key">Weak spots</span></div>
          </div>
        </div>
        <div className="gap-hero-right">
          <div className="gap-chapter-bars">
            {chapterStats.map(ch => {
              const col = CHAPTER_COLORS[ch.id];
              return (
                <div key={ch.id} className="ch-bar-row">
                  <span className="ch-bar-label">{ch.label}</span>
                  <div className="ch-bar-track"><div className="ch-bar-fill" style={{width:`${ch.avg}%`,background:col.accent}}/></div>
                  <span className="ch-bar-pct" style={{color:col.accent}}>{ch.avg}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="gap-two-col">
        {weak.length > 0 && (
          <div className="card gap-section">
            <div className="gap-section-title"><FiAlertTriangle size={15} color="#d94f4f"/> Weak Spots (Below 40%)</div>
            <div className="gap-prog-list">
              {weak.map(p => {
                const col = CHAPTER_COLORS[p.chapterId];
                return (
                  <div key={p.key} className="gap-prog-item gap-prog-weak">
                    <div className="gpi-left">
                      <span className="gpi-chapter" style={{color:col.accent}}>{p.chapterLabel}</span>
                      <span className="gpi-name">{p.label}</span>
                    </div>
                    <div className="gpi-right">
                      <div className="gpi-bar-wrap"><div className="gpi-bar" style={{width:`${scores[p.key]}%`,background:"#d94f4f"}}/></div>
                      <span className="gpi-pct" style={{color:"#d94f4f"}}>{scores[p.key]}%</span>
                    </div>
                    <button className="gpi-retake-btn" onClick={() => onRetake(p.key)}><FiRefreshCw size={11}/> Retake</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {needsWork.length > 0 && (
          <div className="card gap-section">
            <div className="gap-section-title"><FiTrendingUp size={15} color="#e0952a"/> Needs Work (40–60%)</div>
            <div className="gap-prog-list">
              {needsWork.map(p => {
                const col = CHAPTER_COLORS[p.chapterId];
                return (
                  <div key={p.key} className="gap-prog-item gap-prog-needs">
                    <div className="gpi-left">
                      <span className="gpi-chapter" style={{color:col.accent}}>{p.chapterLabel}</span>
                      <span className="gpi-name">{p.label}</span>
                    </div>
                    <div className="gpi-right">
                      <div className="gpi-bar-wrap"><div className="gpi-bar" style={{width:`${scores[p.key]}%`,background:"#e0952a"}}/></div>
                      <span className="gpi-pct" style={{color:"#e0952a"}}>{scores[p.key]}%</span>
                    </div>
                    <button className="gpi-retake-btn" onClick={() => onRetake(p.key)}><FiRefreshCw size={11}/> Retake</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {mastered.length > 0 && (
        <div className="card gap-section">
          <div className="gap-section-title"><FiStar size={15} color="#1e9e4a"/> Mastered (80%+)</div>
          <div className="mastered-chips">
            {mastered.map(p => (
              <span key={p.key} className="mastered-chip">
                <FiCheckCircle size={12} color="#1e9e4a"/> {p.label}
                <span className="chip-pct">{scores[p.key]}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {learningPath.length > 0 && (
        <div className="card gap-section">
          <div className="gap-section-title"><FiTarget size={15} color="#7c5cbf"/> Personalized Learning Path</div>
          <div className="learning-path-list">
            {learningPath.map((p, i) => {
              const col = CHAPTER_COLORS[p.chapterId];
              const pct = scores[p.key];
              return (
                <div key={p.key} className="lp-step">
                  <div className="lp-step-num" style={{background:col.bg,color:col.accent}}>{i+1}</div>
                  <div className="lp-step-body">
                    <div className="lp-step-name">{p.label}</div>
                    <div className="lp-step-chapter" style={{color:col.accent}}>{p.chapterLabel}</div>
                    <div className="lp-step-advice">{pct<40?"Core gap — study theory and re-watch the visualization.":"Moderate gap — re-watch the visualization and retry the quiz."}</div>
                  </div>
                  <span className={`lp-priority ${pct<40?"priority-critical":"priority-review"}`}>{pct<40?"Critical":"Review"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN GAP DETECTOR PAGE
// ─────────────────────────────────────────────────────────────────
export default function GapDetector({ user, watchedPrograms = new Set(), onNavigate }) {
  const [scores, setScores] = useState({});
  // view: "chapters" | "quiz" | "results"
  const [view, setView]   = useState("chapters");
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);

  const handleStartQuiz = (chapter, program) => {
    setActiveChapter(chapter);
    setActiveProgram(program);
    setView("quiz");
  };

  const handleQuizFinish = (programKey, pct) => {
    const newScores = { ...scores, [programKey]: pct };
    setScores(newScores);
    setView("chapters");
    if (user?.uid) {
      const allAttempted = QUIZ_CHAPTERS.flatMap(ch => ch.programs).filter(p => newScores[p.key] !== undefined);
      const avg = allAttempted.length
        ? Math.round(allAttempted.reduce((acc,p) => acc+newScores[p.key],0)/allAttempted.length)
        : pct;
      saveGapAnalysis(user.uid, "algorithms-quiz", newScores, [], avg);
    }
  };

  const handleRetake = (programKey) => {
    for (const ch of QUIZ_CHAPTERS) {
      const prog = ch.programs.find(p => p.key === programKey);
      if (prog) { setActiveChapter(ch); setActiveProgram(prog); setView("quiz"); return; }
    }
  };

  const allPrograms   = QUIZ_CHAPTERS.flatMap(ch => ch.programs);
  const totalAttempted = allPrograms.filter(p => scores[p.key] !== undefined).length;
  const totalPrograms  = allPrograms.length;

  // ── QUIZ VIEW ────────────────────────────────────────────────
  if (view === "quiz" && activeChapter && activeProgram) {
    return (
      <div className="gd-page">
        <div className="gd-breadcrumb">
          <button className="bc-btn" onClick={() => setView("chapters")}>Gap Detector</button>
          <FiChevronRight size={13} color="#555" />
          <span className="bc-active">{activeProgram.label} Quiz</span>
        </div>
        <ProgramQuiz
          chapter={activeChapter}
          program={activeProgram}
          onFinish={handleQuizFinish}
          onBack={() => setView("chapters")}
        />
      </div>
    );
  }

  // ── RESULTS VIEW ─────────────────────────────────────────────
  if (view === "results") {
    return (
      <div className="gd-page">
        <div className="gd-results-topbar">
          <button className="btn btn-ghost" onClick={() => setView("chapters")}>
            <FiArrowLeft size={14} /> Back
          </button>
          <h2 className="gd-results-heading">
            <FiBarChart2 size={18} color="#7c5cbf" /> Gap Analysis Report
          </h2>
        </div>
        <GapResults scores={scores} onRetake={handleRetake} />
      </div>
    );
  }

  // ── CHAPTERS VIEW (default) ───────────────────────────────────
  return (
    <div className="gd-page">
      {/* Header */}
      <div className="gd-header card">
        <div className="gd-header-left">
          <FiTarget size={26} color="#7c5cbf" />
          <div>
            <h2 className="gd-intro-title">Gap Detector</h2>
            <p className="gd-intro-sub">
              Watch each program in the Visualizer first, then take its quiz.
              Score ≥{PASS_SCORE}% to unlock the next quiz in the chapter.
            </p>
          </div>
        </div>
        <div className="gd-header-right">
          <div className="gd-progress-wrap">
            <div className="gd-progress-label">{totalAttempted} / {totalPrograms} quizzes done</div>
            <div className="gd-progress-bar-track">
              <div className="gd-progress-bar-fill" style={{ width: `${(totalAttempted/totalPrograms)*100}%` }} />
            </div>
          </div>
          {totalAttempted > 0 && (
            <button className="btn btn-primary gd-results-btn" onClick={() => setView("results")}>
              <FiBarChart2 size={14} /> View Gap Analysis
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="gd-legend">
        <span className="legend-item"><FiEye size={12} color="#888"/> Watch in Visualizer to unlock</span>
        <span className="legend-sep">·</span>
        <span className="legend-item"><FiLock size={12} color="#888"/> Score ≥{PASS_SCORE}% to unlock next</span>
        <span className="legend-sep">·</span>
        <span className="legend-item"><FiCheckCircle size={12} color="#1e9e4a"/> Completed</span>
      </div>

      {/* Chapter accordion list */}
      <div className="chapters-list">
        {QUIZ_CHAPTERS.map((ch, chIdx) => (
          <ChapterRow
            key={ch.id}
            chapter={ch}
            scores={scores}
            watchedPrograms={watchedPrograms}
            onStartQuiz={handleStartQuiz}
            onNavigateToVisualizer={() => onNavigate?.("visualizer")}
            defaultOpen={chIdx === 0}
          />
        ))}
      </div>
    </div>
  );
}
