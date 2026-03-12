import { useState } from "react";
import { FiCode, FiCpu, FiArrowRight, FiLoader,
         FiAward, FiCheckCircle, FiBarChart2, FiUser } from "react-icons/fi";
import { QUIZ_CHAPTERS } from "./quizData";
import StreakModal from "../components/StreakModal";
import "./Dashboard.css";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "recently";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) > 1 ? "s" : ""} ago`;
}
function scoreColor(s) {
  if (s >= 80) return "#4ec9b0";
  if (s >= 60) return "#007acc";
  if (s >= 40) return "#fd9e5a";
  return "#f44747";
}
const CHAPTER_COLORS = {
  recursion: "#7c5cbf", sorting: "#2d8fd9", searching: "#12a08f",
  data_structures: "#d4721e", graph: "#9b4fd1", dynamic_programming: "#1e9e4a",
};

// ── Streak badge shown in header ──────────────────────────────────────────────
function StreakBadge({ streak, onClick }) {
  const count   = streak?.count   || 0;
  const freezes = Math.min(streak?.freezes || 0, 2);
  // Always show badge. "active" = has streak (shines). "zero" = no streak yet (dim, encourages action)
  const active  = count > 0;
  const title   = count === 0
    ? "Take your first quiz to start a streak!"
    : `${count} day streak${freezes > 0 ? ` · ${freezes} freeze${freezes > 1 ? "s" : ""} available` : ""}`;
  return (
    <button className={`dash-streak-badge ${active ? "active" : "zero"}`} onClick={onClick} title={title}>
      {/* Mini flame */}
      <span className="dsb-flame" aria-hidden>
        <svg width="15" height="18" viewBox="0 0 60 70" fill="none">
          <path d="M30 65C12 58 6 42 10 28 13 18 10 10 14 4 16 12 20 16 24 18 20 10 26 2 30 0 30 10 34 16 37 18 40 10 42 4 44 0 48 8 50 22 46 34 50 26 50 16 48 10 54 20 54 36 48 48 44 58 38 64 30 65Z"
            fill="url(#mf)" />
          <defs>
            <linearGradient id="mf" x1="30" y1="0" x2="30" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffcc00"/>
              <stop offset="60%" stopColor="#ff6600"/>
              <stop offset="100%" stopColor="#cc2200"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="dsb-count">{count}</span>
      {/* Shield badges for available freezes */}
      {freezes > 0 && (
        <span className="dsb-freezes">
          {Array.from({ length: freezes }).map((_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#4db6f7">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"/>
            </svg>
          ))}
        </span>
      )}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard({
  onNavigate, user,
  scores = {}, vizSessions = [], quizHistory = [],
  streak = { count: 0, weekDays: Array(7).fill(false) },
  progressLoaded = false,
}) {
  const [showStreak, setShowStreak] = useState(false);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const allPrograms     = QUIZ_CHAPTERS.flatMap(ch => ch.programs.map(p => ({ ...p, chapterId: ch.id })));
  const quizzedPrograms = allPrograms.filter(p => scores[p.key] !== undefined);
  const mastered        = quizzedPrograms.filter(p => scores[p.key] >= 80).length;
  const overallAvg      = quizzedPrograms.length
    ? Math.round(quizzedPrograms.reduce((a, p) => a + scores[p.key], 0) / quizzedPrograms.length) : 0;

  const chapterProgress = QUIZ_CHAPTERS.map(ch => {
    const progs = ch.programs.filter(p => scores[p.key] !== undefined);
    const avg   = progs.length ? Math.round(progs.reduce((a, p) => a + scores[p.key], 0) / progs.length) : null;
    return { ...ch, avg, done: progs.length, total: ch.programs.length };
  });

  const recentActivity = [
    ...vizSessions.slice(0, 5).map(s => ({ label: `Watched: ${s.label}`, ts: s.ts, color: "#007acc" })),
    ...quizHistory.slice(0, 5).map(q => ({ label: `Quiz: ${q.label} — ${q.score}%`, ts: q.ts, color: scoreColor(q.score) })),
  ].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 8);

  const quickStats = [
    { icon: FiBarChart2,   label: "Avg Quiz Score",    value: quizzedPrograms.length ? `${overallAvg}%` : "—", color: scoreColor(overallAvg) },
    { icon: FiAward,       label: "Programs Mastered", value: String(mastered),                                 color: "#4ec9b0" },
    { icon: FiCheckCircle, label: "Quizzes Completed", value: `${quizzedPrograms.length}/${allPrograms.length}`,color: "#12a08f" },
    { icon: FiCode,        label: "Visualizer Runs",   value: String(vizSessions.length),                       color: "#007acc" },
  ];

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user) return (
    <div className="dash-page">
      <div className="dash-sign-in-prompt card">
        <FiUser size={36} color="#7c5cbf" />
        <h2>Sign in to track your progress</h2>
        <p>Your quiz scores, visualizer history, and learning path are saved to your account.</p>
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!progressLoaded) return (
    <div className="dash-page">
      <div className="dash-header">
        <h2 className="dash-title">Dashboard</h2>
        <p className="dash-sub">Welcome back, {user.displayName?.split(" ")[0] || "learner"}!</p>
      </div>
      <div className="dash-loading">
        <FiLoader size={18} className="spin" color="var(--accent)" />
        <span>Loading your progress…</span>
      </div>
    </div>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="dash-page">

      {/* Streak modal */}
      {showStreak && <StreakModal streak={streak} onClose={() => setShowStreak(false)} />}

      {/* Header — avatar + name + streak badge */}
      <div className="dash-header">
        <div className="dash-header-inner">
          {user.photoURL
            ? <img src={user.photoURL} alt="avatar" className="dash-avatar" />
            : <div className="dash-avatar-placeholder">
                {(user.displayName || "?")[0].toUpperCase()}
              </div>
          }
          <div className="dash-header-text">
            <div className="dash-header-name-row">
              <h2 className="dash-title">
                Welcome back, {user.displayName?.split(" ")[0] || "learner"}!
              </h2>
              {/* ← Streak badge right after the name */}
              <StreakBadge streak={streak} onClick={() => setShowStreak(true)} />
            </div>
            <p className="dash-sub">Here's your learning progress at a glance.</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        {quickStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div className="stat-card card" key={i}>
              <Icon size={18} color={s.color} />
              <div>
                <div className="stat-card-val" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-grid">

        {/* Chapter Progress */}
        <div className="card dash-section">
          <div className="section-label">Chapter Progress</div>
          {chapterProgress.every(c => c.avg === null) ? (
            <p className="dash-empty">Complete quizzes to see chapter progress here.</p>
          ) : (
            <div className="topic-list">
              {chapterProgress.map((ch) => {
                const col = CHAPTER_COLORS[ch.id] || "var(--accent)";
                return (
                  <div className="topic-row" key={ch.id}>
                    <div className="topic-name">{ch.label}</div>
                    <div className="topic-bar-wrap">
                      <div className="topic-bar" style={{ width: `${ch.avg ?? 0}%`, background: ch.avg !== null ? col : "transparent" }} />
                    </div>
                    <div className="topic-score" style={{ color: ch.avg !== null ? col : "var(--text-dim)" }}>
                      {ch.avg !== null ? `${ch.avg}%` : `${ch.done}/${ch.total}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card dash-section">
          <div className="section-label">Recent Activity</div>
          {recentActivity.length === 0 ? (
            <p className="dash-empty">No activity yet — open the Visualizer or take a quiz!</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((a, i) => (
                <div className="activity-item" key={i}>
                  <div className="activity-dot" style={{ background: a.color }} />
                  <div className="activity-text">{a.label}</div>
                  <div className="activity-time">{timeAgo(a.ts)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Score Breakdown */}
        {quizzedPrograms.length > 0 && (
          <div className="card dash-section">
            <div className="section-label">Quiz Score Breakdown</div>
            <div className="topic-list">
              {quizzedPrograms.slice(0, 8).map(p => (
                <div className="topic-row" key={p.key}>
                  <div className="topic-name">{p.label}</div>
                  <div className="topic-bar-wrap">
                    <div className="topic-bar" style={{ width: `${scores[p.key]}%`, background: scoreColor(scores[p.key]) }} />
                  </div>
                  <div className="topic-score" style={{ color: scoreColor(scores[p.key]) }}>{scores[p.key]}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`card dash-section ${quizzedPrograms.length === 0 ? "actions-section" : ""}`}>
          <div className="section-label">Quick Actions</div>
          <div className="action-btns">
            <button className="action-card" onClick={() => onNavigate("visualizer")}>
              <FiCode size={20} color="var(--accent)" />
              <div>
                <div className="action-title">Open Visualizer</div>
                <div className="action-desc">Step through algorithm code</div>
              </div>
              <FiArrowRight size={16} color="var(--text-dim)" />
            </button>
            <button className="action-card" onClick={() => onNavigate("gap-detector")}>
              <FiCpu size={20} color="var(--teal)" />
              <div>
                <div className="action-title">Take Quizzes</div>
                <div className="action-desc">Detect your knowledge gaps</div>
              </div>
              <FiArrowRight size={16} color="var(--text-dim)" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
