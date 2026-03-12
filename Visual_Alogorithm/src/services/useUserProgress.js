// src/services/useUserProgress.js

import { useState, useEffect, useCallback } from "react";
import {
  loadUserProgress,
  saveQuizScore,
  saveWatchedProgram,
} from "./userProgress";

export function useUserProgress(user) {
  const [scores,          setScores]          = useState({});
  const [watchedPrograms, setWatchedPrograms] = useState([]);
  const [vizSessions,     setVizSessions]     = useState([]);
  const [quizHistory,     setQuizHistory]     = useState([]);
  const [streak,          setStreak]          = useState({ count: 0, lastQuizDate: null, weekDays: Array(7).fill(false), weekStart: null });
  const [loaded,          setLoaded]          = useState(false);

  // ── Load on login ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setScores({}); setWatchedPrograms([]); setVizSessions([]);
      setQuizHistory([]); setStreak({ count: 0, lastQuizDate: null, weekDays: Array(7).fill(false), weekStart: null });
      setLoaded(false);
      return;
    }
    setLoaded(false);
    loadUserProgress(user.uid).then((data) => {
      setScores(data.scores);
      setWatchedPrograms(data.watchedPrograms);
      setVizSessions(data.vizSessions);
      setQuizHistory(data.quizHistory);
      setStreak(data.streak);
      setLoaded(true);
    });
  }, [user?.uid]);

  // ── Record quiz (triggers streak) ────────────────────────────────────────
  const recordQuizScore = useCallback(async (programKey, programLabel, score) => {
    // Optimistic local update
    const newScores  = { ...scores, [programKey]: score };
    const newHistory = [{ key: programKey, label: programLabel, score, ts: Date.now() }, ...quizHistory].slice(0, 50);
    setScores(newScores);
    setQuizHistory(newHistory);

    if (user?.uid) {
      const result = await saveQuizScore(user.uid, programKey, programLabel, score, {
        scores, quizHistory, streak,
      });
      // Apply server-computed streak back to local state
      if (result?.newStreak) setStreak(result.newStreak);
    }
  }, [user?.uid, scores, quizHistory, streak]);

  // ── Record visualizer run ─────────────────────────────────────────────────
  const recordProgramWatched = useCallback(async (programKey, programLabel) => {
    const newWatched  = watchedPrograms.includes(programKey) ? watchedPrograms : [...watchedPrograms, programKey];
    const newSessions = [{ key: programKey, label: programLabel, ts: Date.now() }, ...vizSessions].slice(0, 50);
    setWatchedPrograms(newWatched);
    setVizSessions(newSessions);

    if (user?.uid) {
      await saveWatchedProgram(user.uid, programKey, programLabel, watchedPrograms, vizSessions);
    }
  }, [user?.uid, watchedPrograms, vizSessions]);

  return {
    scores,
    watchedPrograms,
    watchedSet: new Set(watchedPrograms),
    vizSessions,
    quizHistory,
    streak,
    loaded,
    recordQuizScore,
    recordProgramWatched,
  };
}
