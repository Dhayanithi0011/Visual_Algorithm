import { FiCode, FiCpu, FiGrid, FiHome, FiLogIn, FiLogOut, FiTarget } from "react-icons/fi";
import "./Navbar.css";

const navItems = [
  { id: "home",         label: "Home",        icon: FiHome   },
  { id: "visualizer",   label: "Visualizer",  icon: FiCode   },
  { id: "gap-detector", label: "Quiz",icon: FiTarget },
  { id: "dashboard",    label: "Dashboard",   icon: FiGrid   },
];

export default function Navbar({ activePage, onNavigate, user, loading, onSignIn, onSignOut }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => onNavigate("home")}>
          <span className="brand-dot" />
          <span className="brand-name">VisuAlgo</span>
          <span className="brand-tag">BETA</span>
        </div>

        <div className="navbar-links">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${activePage === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="navbar-auth">
          {loading ? null : user ? (
            <div className="user-info">
              {user.photoURL && (
                <img src={user.photoURL} alt="avatar" className="user-avatar" />
              )}
              <span className="user-name">{user.displayName?.split(" ")[0]}</span>
              <button className="btn btn-ghost auth-btn" onClick={onSignOut} title="Sign out">
                <FiLogOut size={15} />
              </button>
            </div>
          ) : (
            <button className="btn btn-outline auth-btn" onClick={onSignIn}>
              <FiLogIn size={15} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
