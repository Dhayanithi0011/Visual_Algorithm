# backend/main.py
# Run with: uvicorn main:app --reload --port 8000

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import io
import ast
import traceback

app = FastAPI(title="VisuAlgo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──────────────────────────────────────────────────────────────

class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"  # python | javascript


class GapAnalysisRequest(BaseModel):
    topic: str           # e.g. "machine-learning"
    scores: dict         # { concept_id: score_0_to_100 }


# ── Helpers ─────────────────────────────────────────────────────────────

CONCEPT_GRAPHS = {
    "machine-learning": [
        {"id": "linear_algebra",    "label": "Linear Algebra",        "deps": []},
        {"id": "probability",       "label": "Probability Theory",    "deps": ["linear_algebra"]},
        {"id": "statistics",        "label": "Statistics",            "deps": ["probability"]},
        {"id": "calculus",          "label": "Calculus / Derivatives","deps": []},
        {"id": "gradient_descent",  "label": "Gradient Descent",      "deps": ["calculus","linear_algebra"]},
        {"id": "logistic_reg",      "label": "Logistic Regression",   "deps": ["probability","statistics"]},
        {"id": "ml",                "label": "Machine Learning",      "deps": ["gradient_descent","logistic_reg"]},
    ],
    "data-structures": [
        {"id": "pointers",    "label": "Pointers & References", "deps": []},
        {"id": "arrays",      "label": "Arrays",                "deps": []},
        {"id": "recursion",   "label": "Recursion",             "deps": ["arrays"]},
        {"id": "linked_list", "label": "Linked Lists",          "deps": ["pointers"]},
        {"id": "trees",       "label": "Trees & BST",           "deps": ["linked_list","recursion"]},
        {"id": "graphs",      "label": "Graphs (BFS/DFS)",      "deps": ["trees"]},
        {"id": "dp",          "label": "Dynamic Programming",   "deps": ["recursion","arrays"]},
    ],
}


def safe_execute_python(code: str) -> dict:
    """
    Executes Python code safely using sys.settrace for step capture.
    Returns list of step dicts: {line, locals_snapshot, event}.
    """
    steps = []
    local_scope = {}

    def tracer(frame, event, arg):
        if frame.f_code.co_filename == "<string>":
            snapshot = {
                "line": frame.f_lineno,
                "event": event,
                "locals": {k: repr(v) for k, v in frame.f_locals.items()},
                "fn": frame.f_code.co_name,
            }
            steps.append(snapshot)
        return tracer

    stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_capture

    try:
        compiled = compile(code, "<string>", "exec")
        sys.settrace(tracer)
        exec(compiled, local_scope)
        sys.settrace(None)
    except Exception as e:
        sys.settrace(None)
        return {"error": str(e), "steps": steps, "output": stdout_capture.getvalue()}
    finally:
        sys.stdout = old_stdout

    return {
        "steps": steps,
        "output": stdout_capture.getvalue(),
        "error": None,
    }


# ── Routes ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "VisuAlgo API is running"}


@app.post("/api/run")
def run_code(req: RunCodeRequest):
    """Execute code and return step-by-step trace."""
    if req.language != "python":
        raise HTTPException(status_code=400, detail="Only Python supported in MVP.")
    result = safe_execute_python(req.code)
    return result


@app.post("/api/analyze-gaps")
def analyze_gaps(req: GapAnalysisRequest):
    """Given topic + scores dict, return blind spots and learning path."""
    graph = CONCEPT_GRAPHS.get(req.topic)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Topic '{req.topic}' not found.")

    scores = req.scores
    blind_spots = [c for c in graph if scores.get(c["id"], 0) < 50]

    # Topological sort for learning path (weakest first, respecting deps)
    visited = set()
    order = []

    def visit(cid):
        if cid in visited:
            return
        visited.add(cid)
        node = next((c for c in graph if c["id"] == cid), None)
        if not node:
            return
        for dep in node["deps"]:
            visit(dep)
        if scores.get(cid, 0) < 65:
            order.append(node)

    for c in graph:
        visit(c["id"])

    return {
        "topic": req.topic,
        "blind_spots": blind_spots,
        "learning_path": order[:6],
        "overall_score": round(sum(scores.values()) / len(scores)) if scores else 0,
    }


@app.get("/api/topics")
def list_topics():
    return {"topics": list(CONCEPT_GRAPHS.keys())}
