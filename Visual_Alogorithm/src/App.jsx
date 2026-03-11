import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Visualizer from "./pages/Visualizer";
import LearningPath from "./pages/LearningPath";
import GapDetector from "./pages/GapDetector";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./services/useAuth";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const { user, loading, signInWithGoogle, logout } = useAuth();

  // Track which programs the user has run in the Visualizer
  const [watchedPrograms, setWatchedPrograms] = useState(new Set());

  const handleProgramWatched = (programKey) => {
    setWatchedPrograms(prev => new Set([...prev, programKey]));
  };

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <Home onNavigate={setActivePage} />;
      case "visualizer":
        return <Visualizer user={user} onProgramWatched={handleProgramWatched} />;
      case "learning":
        return <LearningPath user={user} />;
      case "gap-detector":
        return <GapDetector user={user} watchedPrograms={watchedPrograms} onNavigate={setActivePage} />;
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} user={user} />;
      default:
        return <Home onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-root">
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        loading={loading}
        onSignIn={signInWithGoogle}
        onSignOut={logout}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}
