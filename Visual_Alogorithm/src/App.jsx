import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Visualizer from "./pages/Visualizer";
import LearningPath from "./pages/LearningPath";
import GapDetector from "./pages/GapDetector";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./services/useAuth";
import { useUserProgress } from "./services/useUserProgress";
import "./App.css";

// Restore last visited page across browser refreshes (same session)
function getInitialPage() {
  try { return sessionStorage.getItem("vz_page") || "home"; } catch { return "home"; }
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();

  // ── All persistent progress lives here ────────────────────────────────────
  const {
    scores,
    watchedSet,
    vizSessions,
    quizHistory,
    streak,
    loaded: progressLoaded,
    recordQuizScore,
    recordProgramWatched,
  } = useUserProgress(user);

  const navigate = (page) => {
    setActivePage(page);
    try { sessionStorage.setItem("vz_page", page); } catch {}
  };

  // ── Callbacks passed down to pages ────────────────────────────────────────
  const handleProgramWatched = (programKey, programLabel) => {
    recordProgramWatched(programKey, programLabel);
  };

  const handleQuizScore = (programKey, programLabel, score) => {
    recordQuizScore(programKey, programLabel, score);
  };

  // ── Auth loading splash ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="app-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#d4d4d4", letterSpacing: "-0.02em" }}>VisuAlgo</span>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", background: "rgba(0,122,204,0.15)", color: "var(--vsc-blue)", border: "1px solid rgba(0,122,204,0.3)", borderRadius: 3, padding: "2px 5px", fontWeight: 700 }}>BETA</span>
          </div>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(0,122,204,0.3)", borderTopColor: "var(--vsc-blue)", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  // ── Not signed in → full-screen auth page ────────────────────────────────
  if (!user) {
    return <AuthPage onSuccess={() => navigate("home")} />;
  }

  // ── Signed in → full app ──────────────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <Home onNavigate={navigate} />;

      case "visualizer":
        return (
          <Visualizer
            user={user}
            onProgramWatched={handleProgramWatched}
          />
        );

      case "learning":
        return <LearningPath user={user} />;

      case "gap-detector":
        return (
          <GapDetector
            user={user}
            scores={scores}
            watchedPrograms={watchedSet}
            onQuizScore={handleQuizScore}
            onNavigate={navigate}
            progressLoaded={progressLoaded}
          />
        );

      case "dashboard":
        return (
          <Dashboard
            onNavigate={navigate}
            user={user}
            scores={scores}
            vizSessions={vizSessions}
            quizHistory={quizHistory}
            streak={streak}
            progressLoaded={progressLoaded}
          />
        );

      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-root">
      <Navbar
        activePage={activePage}
        onNavigate={navigate}
        user={user}
        loading={authLoading}
        onSignIn={signInWithGoogle}
        onSignOut={logout}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}
