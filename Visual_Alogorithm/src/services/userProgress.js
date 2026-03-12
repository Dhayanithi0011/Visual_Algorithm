// src/services/userProgress.js
// ─────────────────────────────────────────────────────────────────────────────
// Firestore document:  users/{uid}/progress/data
//
// streak shape:
// {
//   count:         number,        // current streak days
//   lastQuizDate:  string|null,   // "YYYY-MM-DD"
//   weekDays:      boolean[7],    // Sun–Sat activity this week
//   weekStart:     string|null,   // "YYYY-MM-DD" of Sunday that started weekDays
//   freezes:       number,        // available freeze shields (0–2 max)
//   frozenOn:      string|null,   // date a freeze was last AUTO-consumed
//   totalDaysForFreeze: number,   // lifetime consecutive days counter for earning freezes
//   freezeUsedDates: string[],    // dates where freeze was auto-consumed (for UI display)
// }
//
// FREEZE RULES:
//  - User starts with 0 freezes.
//  - Every 4 consecutive streak days EARNED → user gets +1 freeze (max 2).
//  - If a day is missed (gap == 2) and freezes > 0:
//      → auto-consume 1 freeze, streak is PRESERVED (not reset), count continues.
//  - If gap >= 2 and freezes == 0 → streak resets to 1.
//  - Gap >= 3 → always reset to 1 (freeze only covers 1 missed day).
// ─────────────────────────────────────────────────────────────────────────────

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const progressRef = (uid) => doc(db, "users", uid, "progress", "data");

const MAX_FREEZES = 2;

// ── Date helpers ──────────────────────────────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function weekSundayFor(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
function dayIndexInWeek(dateStr) {
  return new Date(dateStr).getDay();
}

// ── Load ──────────────────────────────────────────────────────────────────────
export async function loadUserProgress(uid) {
  try {
    const snap = await getDoc(progressRef(uid));
    if (!snap.exists()) return defaultProgress();
    const d = snap.data();
    return {
      scores:          d.scores          || {},
      watchedPrograms: d.watchedPrograms || [],
      vizSessions:     d.vizSessions     || [],
      quizHistory:     d.quizHistory     || [],
      streak:          sanitizeStreak(d.streak),
    };
  } catch (e) {
    console.error("loadUserProgress:", e);
    return defaultProgress();
  }
}

// ── Save quiz score + update streak ──────────────────────────────────────────
export async function saveQuizScore(uid, programKey, programLabel, score, prev) {
  const newScores    = { ...prev.scores, [programKey]: score };
  const historyEntry = { key: programKey, label: programLabel, score, ts: Date.now() };
  const newHistory   = [historyEntry, ...prev.quizHistory].slice(0, 50);
  const newStreak    = computeNewStreak(prev.streak);

  try {
    await setDoc(progressRef(uid), {
      scores:      newScores,
      quizHistory: newHistory,
      streak:      newStreak,
    }, { merge: true });
  } catch (e) {
    console.error("saveQuizScore:", e);
  }

  return { newScores, newHistory, newStreak };
}

// ── Core streak logic ─────────────────────────────────────────────────────────
function computeNewStreak(raw) {
  const s     = sanitizeStreak(raw);
  const today = todayStr();

  // ── Already logged today — idempotent, just ensure weekDays is marked ──────
  if (s.lastQuizDate === today) {
    return markWeekDay(s, today);
  }

  const diff = s.lastQuizDate ? daysBetween(s.lastQuizDate, today) : 1;

  let next = { ...s };

  if (diff === 1) {
    // ── Perfect consecutive day ───────────────────────────────────────────────
    next.count++;
    next.totalDaysForFreeze++;
    next.lastQuizDate = today;
    next = markWeekDay(next, today);

    // Award a freeze every 4 consecutive days, max 2
    // totalDaysForFreeze tracks all consecutive days ever; we give a freeze
    // each time it crosses a new multiple of 4
    const freezesEarned = Math.floor(next.totalDaysForFreeze / 4);
    const freezesCapped = Math.min(freezesEarned, MAX_FREEZES);
    // Only ever increase freezes up to the cap
    if (freezesCapped > next.freezes) {
      next.freezes = freezesCapped;
    }

  } else if (diff === 2 && next.freezes > 0) {
    // ── Missed exactly 1 day — auto-consume a freeze ─────────────────────────
    const missedDate = offsetDate(today, -1); // yesterday
    next.freezes--;
    next.frozenOn = missedDate;
    next.freezeUsedDates = [missedDate, ...(next.freezeUsedDates || [])].slice(0, 10);
    // Streak count still increments (freeze bridged the gap)
    next.count++;
    next.totalDaysForFreeze++;
    next.lastQuizDate = today;
    next = markWeekDay(next, today);
    // Mark missed day with freeze indicator in weekDays
    next = markFreezeDay(next, missedDate);

  } else {
    // ── Gap of 2+ days with no freeze, or gap ≥ 3 → reset ────────────────────
    next.count = 1;
    next.totalDaysForFreeze = 1; // restart the "days toward next freeze" counter
    next.lastQuizDate = today;
    next = markWeekDay(next, today);
    // Rebuild weekDays fresh for the new week if needed
  }

  return next;
}

// ── Mark a quiz day in the rolling week ──────────────────────────────────────
function markWeekDay(s, dateStr) {
  const wStart = weekSundayFor(dateStr);
  let next = { ...s };
  if (next.weekStart !== wStart) {
    // New week — reset the week grid
    next.weekDays  = Array(7).fill(false);
    next.weekStart = wStart;
  }
  next.weekDays = [...next.weekDays];
  next.weekDays[dayIndexInWeek(dateStr)] = true;
  return next;
}

// ── Mark a freeze-protected day in the week grid ─────────────────────────────
function markFreezeDay(s, dateStr) {
  const wStart = weekSundayFor(dateStr);
  if (s.weekStart !== wStart) return s; // different week, skip
  const next = { ...s, weekDays: [...s.weekDays] };
  const idx  = dayIndexInWeek(dateStr);
  // Store "freeze" marker — use string "freeze" instead of boolean true
  next.weekDays[idx] = "freeze";
  return next;
}

// ── Offset a YYYY-MM-DD date by n days ───────────────────────────────────────
function offsetDate(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Save watched program ──────────────────────────────────────────────────────
export async function saveWatchedProgram(uid, programKey, programLabel, prevWatched, prevSessions) {
  const newWatched  = prevWatched.includes(programKey)
    ? prevWatched : [...prevWatched, programKey];
  const newSessions = [
    { key: programKey, label: programLabel, ts: Date.now() },
    ...prevSessions,
  ].slice(0, 50);

  try {
    await setDoc(progressRef(uid), {
      watchedPrograms: newWatched,
      vizSessions:     newSessions,
    }, { merge: true });
  } catch (e) {
    console.error("saveWatchedProgram:", e);
  }

  return { newWatched, newSessions };
}

// ── Sanitise streak from Firestore (handle missing fields) ───────────────────
function sanitizeStreak(raw) {
  if (!raw) return defaultStreak();
  return {
    count:              Number(raw.count)              || 0,
    lastQuizDate:       raw.lastQuizDate               || null,
    weekDays:           Array.isArray(raw.weekDays) ? raw.weekDays : Array(7).fill(false),
    weekStart:          raw.weekStart                  || null,
    freezes:            Math.min(Number(raw.freezes) || 0, MAX_FREEZES),
    frozenOn:           raw.frozenOn                   || null,
    totalDaysForFreeze: Number(raw.totalDaysForFreeze) || 0,
    freezeUsedDates:    Array.isArray(raw.freezeUsedDates) ? raw.freezeUsedDates : [],
  };
}

function defaultStreak() {
  return {
    count: 0, lastQuizDate: null,
    weekDays: Array(7).fill(false), weekStart: null,
    freezes: 0, frozenOn: null,
    totalDaysForFreeze: 0, freezeUsedDates: [],
  };
}
function defaultProgress() {
  return {
    scores: {}, watchedPrograms: [], vizSessions: [], quizHistory: [],
    streak: defaultStreak(),
  };
}
