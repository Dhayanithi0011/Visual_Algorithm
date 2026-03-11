import { useState, useEffect } from "react";
import { FiCode, FiCpu, FiTrendingUp, FiActivity, FiArrowRight, FiLoader } from "react-icons/fi";
import { loadVisualizerSessions, loadGapAnalyses } from "../services/sessions";
import "./Dashboard.css";

export default function Dashboard({ onNavigate, user }) {
  const [sessions, setSessions] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    Promise.all([
      loadVisualizerSessions(user.uid),
      loadGapAnalyses(user.uid),
    ]).then(([s, g]) => {
      setSessions(s);
      setGaps(g);
      setLoading(false);
    });
  }, [user]);

  // Derived stats
  const totalSessions = sessions.length;
  const totalGaps = gaps.length;
  const conceptsMastered = gaps.reduce((acc, g) => {
    const strong = Object.values(g.scores || {}).filter(v => v >= 70).length;
    return acc + strong;
  }, 0);

  // Recent activity feed — merge sessions + gap analyses, sort by time
  const recentActivity = [
    ...sessions.slice(0, 5).map(s => ({
      type: "viz",
      label: `${s.label || "Code"} visualized`,
      time: timeAgo(s.createdAt?.toDate?.() ?? null),
      color: "var(--accent)",
    })),
    ...gaps.slice(0, 5).map(g => ({
      type: "gap",
      label: `${g.topic?.replace(/-/g, " ")} gap analysis`,
      time: timeAgo(g.createdAt?.toDate?.() ?? null),
      color: "var(--teal)",
    })),
  ].slice(0, 6);

  // Topic progress — build from gap analyses
  const topicMap = {};
  gaps.forEach(g => {
    if (!g.topic || !g.scores) return;
    const avg = Math.round(
      Object.values(g.scores).reduce((a, b) => a + b, 0) / Object.values(g.scores).length
    );
    topicMap[g.topic] = avg;
  });
  const topicProgress = Object.entries(topicMap).map(([topic, score]) => ({
    topic: topic.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    score,
  }));

  const quickStats = [
    { icon: FiCode,      label: "Sessions Visualized", value: String(totalSessions || 0), color: "var(--accent)" },
    { icon: FiCpu,       label: "Gaps Analyzed",        value: String(totalGaps || 0),     color: "var(--teal)" },
    { icon: FiTrendingUp,label: "Concepts Mastered",    value: String(conceptsMastered),   color: "var(--orange)" },
    { icon: FiActivity,  label: "Total Runs",           value: String(totalSessions + totalGaps), color: "var(--purple)" },
  ];

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Dashboard</h2>
          <p className="dash-sub">
            {user
              ? `Welcome back, ${user.displayName?.split(" ")[0] || "learner"} — here's your progress.`
              : "Sign in to track your learning progress."}
          </p>
        </div>
      </div>

      {loading && (
        <div className="dash-loading">
          <FiLoader size={18} className="spin" color="var(--accent)" />
          <span>Loading your data…</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        {quickStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div className="stat-card card" key={i}>
              <Icon size={18} color={s.color} />
              <div>
                <div className="stat-card-val">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-grid">
        {/* Topic Progress */}
        <div className="card dash-section">
          <div className="section-label">Topic Progress</div>
          {topicProgress.length === 0 ? (
            <p className="dash-empty">Run a gap analysis to see topic progress here.</p>
          ) : (
            <div className="topic-list">
              {topicProgress.map((t, i) => (
                <div className="topic-row" key={i}>
                  <div className="topic-name">{t.topic}</div>
                  <div className="topic-bar-wrap">
                    <div
                      className="topic-bar"
                      style={{
                        width: `${t.score}%`,
                        background: t.score >= 70 ? "var(--green)" : t.score >= 50 ? "var(--orange)" : "var(--red)",
                      }}
                    />
                  </div>
                  <div className="topic-score">{t.score}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card dash-section">
          <div className="section-label">Recent Activity</div>
          {recentActivity.length === 0 ? (
            <p className="dash-empty">No activity yet — run a visualization or gap analysis!</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((a, i) => (
                <div className="activity-item" key={i}>
                  <div className="activity-dot" style={{ background: a.color }} />
                  <div className="activity-text">{a.label}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card dash-section actions-section">
          <div className="section-label">Quick Actions</div>
          <div className="action-btns">
            <button className="action-card" onClick={() => onNavigate("visualizer")}>
              <FiCode size={20} color="var(--accent)" />
              <div>
                <div className="action-title">Open Visualizer</div>
                <div className="action-desc">Step through new code</div>
              </div>
              <FiArrowRight size={16} color="var(--text-dim)" />
            </button>
            <button className="action-card" onClick={() => onNavigate("gap-detector")}>
              <FiCpu size={20} color="var(--teal)" />
              <div>
                <div className="action-title">Detect Gaps</div>
                <div className="action-desc">Analyze quiz results</div>
              </div>
              <FiArrowRight size={16} color="var(--text-dim)" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "recently";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? "s" : ""} ago`;
}
