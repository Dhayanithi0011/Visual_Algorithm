// ─────────────────────────────────────────────────────────────────────────────
// AI CODE ANALYZER — Calls our own FastAPI backend tracer (FREE, no quota)
// Backend uses Python's sys.settrace for Python code — real execution tracing.
// For JS/Java/C it does smart structural simulation.
// No external API needed. Just make sure the backend is running:
//   cd Backend && uvicorn main:app --reload --port 8000
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Parse backend response into the step format the frontend expects ──────────
function parseBackendResponse(data) {
  if (!data) return { error: "No response from backend." };
  if (data.error) return { error: data.error };

  const rawSteps = data.steps || [];
  if (rawSteps.length === 0) {
    return { error: "No steps were generated. Make sure your code does something visible (e.g. has a function call or print statement)." };
  }

  const steps = rawSteps.map((s, i) => ({
    line:      s.line  ?? 1,
    note:      s.note  ?? `Step ${i + 1}`,
    // Backend sends stack as array newest-first [{fn, vars, depth, returning?}]
    stack:     Array.isArray(s.stack) && s.stack.length > 0
                 ? s.stack
                 : [{ fn: "<module>", vars: s.vars || {}, depth: 0 }],
    depth:     s.depth ?? 0,
    // Sorting/search viz fields (not used for TryIt, but keeps shape consistent)
    arr:       null,
    searchIdx: -1,
    found:     -1,
    hi:        -1,
    hj:        -1,
    swapped:   -1,
  }));

  return {
    title:    data.title    || "Custom Program",
    language: data.language || "Python",
    steps,
    output:   data.output   || "",
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function analyzeCodeWithAI(code, language) {
  if (!code?.trim()) {
    return { error: "Please write some code first." };
  }

  try {
    const controller = new AbortController();
    // Give backend 15 seconds (tracing can take a moment for recursive code)
    const tid = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE}/api/trace`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code: code.trim(), language }),
      signal:  controller.signal,
    });

    clearTimeout(tid);

    if (!res.ok) {
      // Try to get error detail from FastAPI
      let detail = `Backend error (HTTP ${res.status})`;
      try {
        const body = await res.json();
        detail = body?.detail || detail;
      } catch { /* ignore */ }
      return { error: detail };
    }

    const data = await res.json();
    return parseBackendResponse(data);

  } catch (err) {
    if (err.name === "AbortError") {
      return { error: "Request timed out. The backend may be slow or not running. Make sure uvicorn is running: cd Backend && uvicorn main:app --reload --port 8000" };
    }
    // Network / CORS / connection refused
    return {
      error: "Cannot reach backend. Start it with:\n  cd Backend\n  uvicorn main:app --reload --port 8000\n\nThen refresh this page.",
    };
  }
}
