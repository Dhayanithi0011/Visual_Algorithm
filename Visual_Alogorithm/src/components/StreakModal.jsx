// src/components/StreakModal.jsx
import { useEffect } from "react";
import "./StreakModal.css";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_FREEZES = 2;

// ── Chess pawn SVG ────────────────────────────────────────────────────────────
function ChessPawn({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="white">
      <circle cx="50" cy="22" r="14" />
      <path d="M38 36 Q32 52 36 60 L28 72 Q24 80 30 84 L70 84 Q76 80 72 72 L64 60 Q68 52 62 36 Z" />
    </svg>
  );
}

// ── Animated flame ────────────────────────────────────────────────────────────
function FlameIcon() {
  return (
    <div className="streak-flame-wrap">
      <div className="streak-glow-ring" />
      <svg className="streak-flame-svg" viewBox="0 0 120 140" fill="none">
        <path className="flame-back"
          d="M60 130 C20 120 10 90 18 65 C24 48 18 32 26 20
             C30 36 36 44 42 48 C36 34 48 10 60 4
             C58 22 66 32 72 36 C80 20 86 10 88 4
             C96 20 100 42 94 65 C102 50 104 36 100 24
             C110 40 110 68 100 90 C92 108 80 122 60 130Z"
          fill="url(#flameGradBack)" />
        <path className="flame-front"
          d="M60 128 C30 118 22 92 28 70 C32 54 28 42 34 30
             C38 44 44 50 50 54 C46 40 54 20 60 10
             C60 26 68 36 74 40 C78 28 80 18 82 10
             C90 26 92 50 86 70 C92 56 92 42 88 32
             C96 46 96 68 88 88 C80 108 72 120 60 128Z"
          fill="url(#flameGradFront)" />
        <defs>
          <linearGradient id="flameGradBack" x1="60" y1="4" x2="60" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9d00" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="flameGradFront" x1="60" y1="10" x2="60" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffcc00" />
            <stop offset="40%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#cc2200" />
          </linearGradient>
        </defs>
      </svg>
      <div className="streak-pawn"><ChessPawn size={36} /></div>
    </div>
  );
}

// ── Freeze shield icon ────────────────────────────────────────────────────────
function ShieldIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
        fill={active ? "#4db6f7" : "#2d2d30"}
        stroke={active ? "#7dd3fc" : "#3e3e42"}
        strokeWidth="1.5"
      />
      {active && (
        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// ── Week day row ──────────────────────────────────────────────────────────────
function WeekRow({ weekDays }) {
  const today = new Date().getDay();
  return (
    <div className="streak-week-row">
      {DAY_LABELS.map((d, i) => {
        const val      = weekDays?.[i];
        const isDone   = val === true;
        const isFreeze = val === "freeze";
        const isToday  = i === today;
        const isEmpty  = !isDone && !isFreeze;

        return (
          <div key={i} className="streak-week-col">
            <span className={`streak-day-label ${isToday ? "today" : ""}`}>{d}</span>
            <div className={[
              "streak-day-box",
              isDone   ? "done"   : "",
              isFreeze ? "frozen" : "",
              isToday && isEmpty ? "today-empty" : "",
              isToday && isDone  ? "today-done"  : "",
            ].filter(Boolean).join(" ")}>
              {isDone && (
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l5 5 7-8" stroke="white" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isFreeze && (
                /* snowflake ❄ for freeze day */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4db6f7" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <line x1="5" y1="5" x2="19" y2="19"/>
                  <line x1="19" y1="5" x2="5" y2="19"/>
                  <circle cx="12" cy="12" r="2" fill="#4db6f7" stroke="none"/>
                </svg>
              )}
              {isToday && isEmpty && (
                /* pause bars for "today not done yet" */
                <svg width="12" height="12" viewBox="0 0 20 20" fill="#555">
                  <rect x="4" y="3" width="4" height="14" rx="1"/>
                  <rect x="12" y="3" width="4" height="14" rx="1"/>
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Freeze shields row ────────────────────────────────────────────────────────
function FreezesRow({ freezes, count }) {
  // How many days until the next freeze is earned
  // Freeze earned at every multiple of 4 consecutive days, capped at MAX_FREEZES
  const nextFreezeAt = (Math.floor(count / 4) + 1) * 4;
  const daysLeft     = nextFreezeAt - count;
  const atMax        = freezes >= MAX_FREEZES;

  return (
    <div className="streak-freezes-section">
      <div className="streak-freezes-row">
        {Array.from({ length: MAX_FREEZES }).map((_, i) => (
          <div key={i} className={`streak-freeze-slot ${i < freezes ? "active" : ""}`}>
            <ShieldIcon active={i < freezes} />
            <span className="streak-freeze-label">
              {i < freezes ? "Ready" : "Empty"}
            </span>
          </div>
        ))}
      </div>

      <p className="streak-freeze-info">
        {atMax
          ? "You have the maximum 2 streak freezes!"
          : freezes === 0 && count < 4
          ? `Complete ${4 - count} more day${4 - count !== 1 ? "s" : ""} to earn your first freeze shield.`
          : `${daysLeft} more day${daysLeft !== 1 ? "s" : ""} to earn your next freeze shield.`
        }
      </p>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function StreakModal({ streak, onClose }) {
  const count    = streak?.count    || 0;
  const weekDays = streak?.weekDays || Array(7).fill(false);
  const freezes  = Math.min(streak?.freezes || 0, MAX_FREEZES);

  const motivational =
    count === 0  ? "Start your streak — take any quiz today!" :
    count < 4    ? `${4 - count} day${4 - count !== 1 ? "s" : ""} until your first freeze shield!` :
    count < 7    ? "Great momentum! You're on a roll 🔥" :
    count < 14   ? "One week strong! Keep showing up." :
    count < 30   ? "Two weeks of consistency! Incredible." :
                   "Unstoppable! True DSA champion 🏆";

  // Close on backdrop / Escape
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="streak-backdrop" onClick={handleBackdrop}>
      <div className="streak-modal">

        {/* Header */}
        <div className="streak-modal-header">
          <span className="streak-modal-title">Streak</span>
          <button className="streak-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Flame + count */}
        <div className="streak-center">
          <FlameIcon />
          <h2 className="streak-count">{count} Day Streak</h2>
        </div>

        {/* Week grid */}
        <WeekRow weekDays={weekDays} />

        {/* Motivational line */}
        <p className="streak-message">{motivational}</p>

        {/* Divider */}
        <div className="streak-divider" />

        {/* Freeze shields */}
        <FreezesRow freezes={freezes} count={count} />

        {/* Rules */}
        <div className="streak-rules">
          <p>✅ Complete any program quiz (pass or fail) to keep your streak.</p>
          <p>🔥 Every <strong>4 consecutive days</strong> earns +1 freeze shield.</p>
          <p>🛡️ A freeze auto-protects your streak if you miss <strong>1 day</strong>.</p>
          <p>⚠️ Maximum <strong>2 freeze shields</strong> at any time.</p>
        </div>

      </div>
    </div>
  );
}
