import { useState } from "react";
import {
  FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff,
  FiArrowRight, FiArrowLeft, FiAlertCircle, FiCheckCircle,
  FiRefreshCw, FiCode
} from "react-icons/fi";
import { useAuth } from "../services/useAuth";
import "./AuthPage.css";

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" fill="none">
      <path fill="#4285F4" d="M46.145 24.504c0-1.636-.146-3.207-.418-4.716H24v8.924h12.418c-.535 2.892-2.163 5.344-4.61 6.99v5.81h7.465c4.369-4.025 6.872-9.954 6.872-16.008z"/>
      <path fill="#34A853" d="M24 47c6.24 0 11.468-2.066 15.29-5.598l-7.465-5.81c-2.072 1.388-4.727 2.208-7.825 2.208-6.017 0-11.11-4.063-12.931-9.525H3.397v6.006C7.2 42.618 15.023 47 24 47z"/>
      <path fill="#FBBC05" d="M11.069 28.275A14.832 14.832 0 0 1 10.5 24c0-1.486.254-2.932.569-4.275v-6.006H3.397A23.943 23.943 0 0 0 0 24c0 3.862.926 7.52 2.567 10.72l7.461-6.006.041-.44z"/>
      <path fill="#EA4335" d="M24 9.2c3.39 0 6.436 1.165 8.827 3.45l6.618-6.617C35.462 2.298 30.234 0 24 0 15.024 0 7.2 4.382 3.397 10.719l7.672 5.952.031.054C12.89 11.263 17.983 9.2 24 9.2z"/>
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// We store phone accounts as fake emails so Firebase Email/Password handles auth
// without needing Blaze billing. The user never sees the fake email.
const PHONE_DOMAIN = "phone.visualgo.app";
const phoneToFakeEmail = (countryCode, digits) =>
  `${countryCode.replace("+", "")}${digits}@${PHONE_DOMAIN}`;

const COUNTRY_CODES = [
  { code: "+60",  label: "🇲🇾 +60  Malaysia"     },
  { code: "+65",  label: "🇸🇬 +65  Singapore"    },
  { code: "+1",   label: "🇺🇸 +1   USA / Canada" },
  { code: "+44",  label: "🇬🇧 +44  UK"           },
  { code: "+91",  label: "🇮🇳 +91  India"        },
  { code: "+61",  label: "🇦🇺 +61  Australia"    },
  { code: "+49",  label: "🇩🇪 +49  Germany"      },
  { code: "+33",  label: "🇫🇷 +33  France"       },
  { code: "+86",  label: "🇨🇳 +86  China"        },
  { code: "+81",  label: "🇯🇵 +81  Japan"        },
  { code: "+82",  label: "🇰🇷 +82  Korea"        },
  { code: "+55",  label: "🇧🇷 +55  Brazil"       },
  { code: "+971", label: "🇦🇪 +971 UAE"          },
  { code: "+966", label: "🇸🇦 +966 Saudi Arabia" },
];

// ─── Mini alert ──────────────────────────────────────────────────────────────
function Alert({ msg, type = "error" }) {
  if (!msg) return null;
  return (
    <div className={`auth-alert auth-alert-${type}`}>
      {type === "error" ? <FiAlertCircle size={13} /> : <FiCheckCircle size={13} />}
      <span>{msg}</span>
    </div>
  );
}

// ─── Floating-label input ────────────────────────────────────────────────────
function AuthInput({ icon: Icon, label, type = "text", value, onChange, autoComplete, rightSlot, disabled }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value?.length > 0;
  return (
    <div className={`auth-field ${focused ? "auth-field-focused" : ""} ${hasValue ? "auth-field-filled" : ""}`}>
      <div className="auth-field-icon"><Icon size={14} /></div>
      <div className="auth-field-inner">
        <label className="auth-field-label">{label}</label>
        <input
          className="auth-field-input"
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
        />
      </div>
      {rightSlot && <div className="auth-field-right">{rightSlot}</div>}
    </div>
  );
}

// ─── Password input with show/hide ───────────────────────────────────────────
function PasswordInput({ label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <AuthInput
      icon={FiLock}
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      rightSlot={
        <button type="button" className="auth-eye-btn" onClick={() => setShow(s => !s)} tabIndex={-1}>
          {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      }
    />
  );
}

// ─── Password strength meter ─────────────────────────────────────────────────
function StrengthMeter({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#d94f4f", "#e0952a", "#007acc", "#4ec9b0"];
  if (!password) return null;
  return (
    <div className="strength-meter">
      <div className="strength-bars">
        {[1,2,3,4].map(i => (
          <div key={i} className="strength-bar"
            style={{ background: i <= strength ? colors[strength] : "rgba(255,255,255,0.07)" }} />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
}

// ─── Phone + Number field ────────────────────────────────────────────────────
function PhoneNumberField({ countryCode, onCodeChange, phone, onPhoneChange }) {
  return (
    <div className="phone-row">
      <select className="phone-code-select" value={countryCode} onChange={e => onCodeChange(e.target.value)}>
        {COUNTRY_CODES.map(c => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
      <div className="phone-number-field">
        <AuthInput
          icon={FiPhone}
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ""))}
          autoComplete="tel-national"
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EMAIL TAB — Sign In / Register / Forgot Password
// ═════════════════════════════════════════════════════════════════════════════
function EmailForm({ onSuccess, onGoogle }) {
  const [mode, setMode]       = useState("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  const { signInWithEmail, registerWithEmail, resetPassword } = useAuth();

  const clear = () => { setError(""); setInfo(""); };

  const parseError = (code) => ({
    "auth/user-not-found":         "No account found with this email.",
    "auth/invalid-credential":     "Incorrect email or password.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/too-many-requests":      "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  }[code] || "Something went wrong. Please try again.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    clear();

    if (mode === "reset") {
      if (!email) { setError("Enter your email address."); return; }
      setBusy(true);
      try { await resetPassword(email); setInfo("Reset link sent! Check your inbox."); }
      catch (err) { setError(parseError(err.code)); }
      setBusy(false);
      return;
    }

    if (mode === "register") {
      if (!name.trim())           { setError("Please enter your full name."); return; }
      if (!email)                 { setError("Please enter your email."); return; }
      if (!password)              { setError("Please enter a password."); return; }
      if (password !== confirm)   { setError("Passwords don't match."); return; }
      setBusy(true);
      try { await registerWithEmail(name.trim(), email, password); onSuccess(); }
      catch (err) { setError(parseError(err.code)); }
      setBusy(false);
      return;
    }

    if (!email || !password) { setError("Fill in email and password."); return; }
    setBusy(true);
    try { await signInWithEmail(email, password); onSuccess(); }
    catch (err) { setError(parseError(err.code)); }
    setBusy(false);
  };

  const switchMode = (m) => { clear(); setMode(m); };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-mode-tabs">
        {["login","register"].map(m => (
          <button key={m} type="button"
            className={`auth-mode-tab ${mode === m ? "active" : ""}`}
            onClick={() => switchMode(m)}>
            {m === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <AuthInput icon={FiUser} label="Full Name" value={name}
          onChange={e => setName(e.target.value)} autoComplete="name" />
      )}

      <AuthInput icon={FiMail} label="Email Address" type="email" value={email}
        onChange={e => setEmail(e.target.value)} autoComplete="email" />

      {mode !== "reset" && (
        <PasswordInput label="Password" value={password}
          onChange={e => setPass(e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"} />
      )}

      {mode === "register" && (
        <>
          <PasswordInput label="Confirm Password" value={confirm}
            onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
          <StrengthMeter password={password} />
        </>
      )}

      <Alert msg={error} type="error" />
      <Alert msg={info}  type="success" />

      {mode === "login" && (
        <button type="button" className="auth-forgot-link" onClick={() => switchMode("reset")}>
          Forgot password?
        </button>
      )}
      {mode === "reset" && (
        <button type="button" className="auth-forgot-link" onClick={() => switchMode("login")}>
          <FiArrowLeft size={11} /> Back to sign in
        </button>
      )}

      <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
        {busy ? <><FiRefreshCw size={13} className="spin" /> Please wait…</>
          : mode === "login"    ? <>Sign In <FiArrowRight size={14} /></>
          : mode === "register" ? <>Create Account <FiArrowRight size={14} /></>
          :                       <>Send Reset Link <FiArrowRight size={14} /></>}
      </button>

      {mode !== "reset" && (
        <>
          <div className="auth-divider"><span>or</span></div>
          <button type="button" className="auth-google-btn" onClick={onGoogle} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </button>
        </>
      )}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PHONE TAB — Sign In / Register with phone number + password (no SMS/OTP)
// Uses Firebase Email/Password under the hood with a synthetic email address.
// ═════════════════════════════════════════════════════════════════════════════
function PhoneForm({ onSuccess, onGoogle }) {
  const [mode, setMode]           = useState("login");
  const [name, setName]           = useState("");
  const [countryCode, setCode]    = useState("+60");
  const [phone, setPhone]         = useState("");
  const [password, setPass]       = useState("");
  const [confirm, setConfirm]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  const { signInWithEmail, registerWithEmail } = useAuth();

  const clear = () => setError("");

  const parseError = (code, isRegister) => ({
    "auth/email-already-in-use":   "An account with this phone number already exists.",
    "auth/user-not-found":         "No account found for this number.",
    "auth/invalid-credential":     "Incorrect phone number or password.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  }[code] || "Something went wrong. Please try again.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    clear();
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 6) { setError("Enter a valid phone number."); return; }
    if (!password) { setError("Enter a password."); return; }

    const fakeEmail = phoneToFakeEmail(countryCode, digits);

    if (mode === "register") {
      if (!name.trim())         { setError("Enter your full name."); return; }
      if (password !== confirm) { setError("Passwords don't match."); return; }
      setBusy(true);
      try {
        await registerWithEmail(name.trim(), fakeEmail, password);
        onSuccess();
      } catch (err) { setError(parseError(err.code, true)); }
      setBusy(false);
      return;
    }

    setBusy(true);
    try {
      await signInWithEmail(fakeEmail, password);
      onSuccess();
    } catch (err) { setError(parseError(err.code, false)); }
    setBusy(false);
  };

  const switchMode = (m) => { clear(); setMode(m); };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-mode-tabs">
        {["login","register"].map(m => (
          <button key={m} type="button"
            className={`auth-mode-tab ${mode === m ? "active" : ""}`}
            onClick={() => switchMode(m)}>
            {m === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <AuthInput icon={FiUser} label="Full Name" value={name}
          onChange={e => setName(e.target.value)} autoComplete="name" />
      )}

      <p className="phone-hint">
        {mode === "register"
          ? "Your phone number will be your login ID."
          : "Sign in with your registered phone number and password."}
      </p>

      <PhoneNumberField
        countryCode={countryCode} onCodeChange={setCode}
        phone={phone} onPhoneChange={setPhone} />

      <PasswordInput label="Password" value={password}
        onChange={e => setPass(e.target.value)}
        autoComplete={mode === "register" ? "new-password" : "current-password"} />

      {mode === "register" && (
        <>
          <PasswordInput label="Confirm Password" value={confirm}
            onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
          <StrengthMeter password={password} />
        </>
      )}

      <Alert msg={error} type="error" />

      <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
        {busy ? <><FiRefreshCw size={13} className="spin" /> Please wait…</>
          : mode === "login" ? <>Sign In <FiArrowRight size={14} /></>
          :                    <>Create Account <FiArrowRight size={14} /></>}
      </button>

      <div className="auth-divider"><span>or</span></div>
      <button type="button" className="auth-google-btn" onClick={onGoogle} disabled={busy}>
        <GoogleIcon /> Continue with Google
      </button>
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN AUTH PAGE
// ═════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "email", label: "Email",  Icon: FiMail  },
  { id: "phone", label: "Phone",  Icon: FiPhone },
];

export default function AuthPage({ onSuccess }) {
  const [tab, setTab]       = useState("email");
  const [gBusy, setGBusy]   = useState(false);
  const [gError, setGError] = useState("");

  const { signInWithGoogle } = useAuth();

  const IS_LOCAL = window.location.hostname === "localhost" ||
                   window.location.hostname === "127.0.0.1";

  const handleGoogle = async () => {
    setGError("");
    setGBusy(true);
    try {
      await signInWithGoogle();
      // On localhost: signInWithPopup returns immediately → call onSuccess
      // On production: signInWithRedirect navigates away → page reloads,
      // onAuthStateChanged fires automatically, no need to call onSuccess here
      if (IS_LOCAL) onSuccess();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" &&
          err.code !== "auth/cancelled-popup-request") {
        setGError("Google sign-in failed. Please try again.");
      }
      setGBusy(false);
    }
    if (IS_LOCAL) setGBusy(false);
  };

  return (
    <div className="auth-page">

      {/* ── Left panel — branding ─────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-grid" />

        <div className="auth-brand">
          <div className="auth-brand-icon"><FiCode size={22} color="#007acc" /></div>
          <span className="auth-brand-name">VisuAlgo</span>
          <span className="auth-brand-tag">BETA</span>
        </div>

        <div className="auth-left-content">
          <h1 className="auth-left-title">
            See your code<br />
            <span className="auth-left-accent">think out loud.</span>
          </h1>
          <p className="auth-left-desc">
            Sign in to track your progress, save quiz scores, and get a personalised learning path across 20+ DSA algorithms.
          </p>
          <div className="auth-features">
            {[
              { dot: "#007acc", text: "20+ algorithm visualizations" },
              { dot: "#4ec9b0", text: "Quiz-based knowledge gap detection" },
              { dot: "#c586c0", text: "Progress saved across sessions" },
              { dot: "#fd9e5a", text: "Personalised learning paths" },
            ].map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-dot" style={{ background: f.dot }} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-code-preview">
          <div className="acp-bar">
            <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
            <span className="acp-filename">factorial.py</span>
          </div>
          <div className="acp-body">
            <div className="acp-line acp-active"><span className="acp-ln">1</span><span className="acp-kw">def</span> factorial(n):</div>
            <div className="acp-line"><span className="acp-ln">2</span>  <span className="acp-kw">if</span> n == <span className="acp-num">0</span>:</div>
            <div className="acp-line"><span className="acp-ln">3</span>    <span className="acp-kw">return</span> <span className="acp-num">1</span></div>
            <div className="acp-line acp-highlight"><span className="acp-ln">4</span>  <span className="acp-kw">return</span> n * factorial(n-<span className="acp-num">1</span>)</div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Welcome to VisuAlgo</h2>
            <p className="auth-subtitle">Sign in or create an account to get started</p>
          </div>

          {/* Method tabs */}
          <div className="auth-method-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id}
                className={`auth-method-tab ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {gError && <Alert msg={gError} type="error" />}

          {tab === "email"
            ? <EmailForm onSuccess={onSuccess} onGoogle={handleGoogle} />
            : <PhoneForm onSuccess={onSuccess} onGoogle={handleGoogle} />
          }

          <p className="auth-terms">
            By continuing you agree to our{" "}
            <span className="auth-link">Terms of Service</span> and{" "}
            <span className="auth-link">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
