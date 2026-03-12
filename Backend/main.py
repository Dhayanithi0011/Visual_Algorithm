# backend/main.py
# Run with: uvicorn main:app --reload --port 8000
# Zero external API deps — uses Python's built-in sys.settrace for "Try It" feature

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys, io, ast, textwrap, traceback, re

app = FastAPI(title="VisuAlgo API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────────────

class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"

class TraceRequest(BaseModel):
    code: str
    language: str = "Python"

class GapAnalysisRequest(BaseModel):
    topic: str
    scores: dict

# ── Concept graphs for gap analysis ─────────────────────────────────────────

CONCEPT_GRAPHS = {
    "machine-learning": [
        {"id": "linear_algebra",   "label": "Linear Algebra",         "deps": []},
        {"id": "probability",      "label": "Probability Theory",     "deps": ["linear_algebra"]},
        {"id": "statistics",       "label": "Statistics",             "deps": ["probability"]},
        {"id": "calculus",         "label": "Calculus / Derivatives", "deps": []},
        {"id": "gradient_descent", "label": "Gradient Descent",       "deps": ["calculus","linear_algebra"]},
        {"id": "logistic_reg",     "label": "Logistic Regression",    "deps": ["probability","statistics"]},
        {"id": "ml",               "label": "Machine Learning",       "deps": ["gradient_descent","logistic_reg"]},
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

# ── Smart educational note builder ──────────────────────────────────────────

def get_source_line(code_lines: list[str], lineno: int) -> str:
    """Return the stripped source line (1-based)."""
    if 1 <= lineno <= len(code_lines):
        return code_lines[lineno - 1].strip()
    return ""

def build_note(event: str, fn: str, ln: int, src: str,
               local_vars: dict, ret_val, depth: int,
               output_so_far: list[str]) -> str:
    """
    Produce a rich, educational step note based on what Python is doing.
    """
    s = src.strip()

    # ── call ──────────────────────────────────────────────────────────────
    if event == "call":
        if fn == "<module>":
            return "▶ Program starts. Python reads and executes top-level code."
        args = ", ".join(f"{k}={v}" for k, v in local_vars.items()
                         if not k.startswith("_"))
        prefix = f"📞 Call {fn}({args}). Stack depth = {depth}."
        # Add educational context for known patterns
        if "factorial" in fn:
            n = local_vars.get("n", "?")
            if str(n) == "0":
                return prefix + " n=0 → base case will trigger next."
            return prefix + f" Computes {n}! = {n} × ({n}-1)! recursively."
        if "fib" in fn:
            n = local_vars.get("n", "?")
            return prefix + f" Computing Fibonacci({n})."
        if "hanoi" in fn:
            n = local_vars.get("n") or local_vars.get("disks", "?")
            return prefix + f" Moving {n} disk(s)."
        if "search" in fn:
            return prefix + " Searching for target in array."
        if "sort" in fn or "partition" in fn:
            return prefix + " Sorting sub-array."
        if "insert" in fn:
            return prefix + " Inserting value into data structure."
        if "bfs" in fn or "dfs" in fn:
            return prefix + " Graph traversal starting."
        return prefix

    # ── return ─────────────────────────────────────────────────────────────
    if event == "return":
        rv = repr(ret_val) if ret_val is not None else "None"
        if fn == "<module>":
            out = ", ".join(output_so_far[-2:]) if output_so_far else ""
            return f"✅ Program complete." + (f" Final output: {out}" if out else "")
        prefix = f"↩ {fn}() returns {rv}. Pop frame from call stack."
        if "factorial" in fn:
            return prefix + " Unwinding recursion — multiplying on the way back up."
        if "fib" in fn:
            return prefix + " Fibonacci sub-result ready to combine."
        return prefix

    # ── line ───────────────────────────────────────────────────────────────
    if event == "line":
        if not s:
            return f"▶ Line {ln}."

        # def / class definition
        if s.startswith("def "):
            name = re.match(r"def\s+(\w+)", s)
            return f"📝 Define function '{name.group(1) if name else ''}'. Not executed yet — just stored."
        if s.startswith("class "):
            name = re.match(r"class\s+(\w+)", s)
            return f"📝 Define class '{name.group(1) if name else ''}'. Blueprint created."

        # if / elif / else
        if s.startswith("if ") or s.startswith("elif "):
            cond = re.match(r"(?:if|elif)\s+(.+?):", s)
            cond_s = cond.group(1) if cond else s
            # Try to evaluate meaning
            if "== 0" in s or "== 1" in s or "<= 1" in s or "is None" in s:
                return f"❓ Check base case: {cond_s}. If true, recursion stops here."
            if ">" in s or "<" in s or "==" in s:
                return f"❓ Compare: {cond_s}. Branch based on result."
            return f"❓ Check: {cond_s}."
        if s.startswith("else:") or s == "else":
            return "↪ Else branch — condition was false, taking alternate path."

        # return statement
        if s.startswith("return"):
            expr = s[6:].strip()
            if "+" in expr and ("fib" in expr or "factorial" in expr):
                return f"🔙 Compute {expr} and return. This combines recursive results."
            if "*" in expr:
                return f"🔙 Compute {expr} and return."
            if expr == "0" or expr == "1" or expr.lstrip("-").isdigit():
                return f"🔙 Return {expr}. Base case result."
            return f"🔙 Return {expr}."

        # for loop
        if s.startswith("for "):
            m = re.match(r"for\s+(\w+)\s+in\s+(.+?):", s)
            if m:
                var, iterable = m.group(1), m.group(2)
                val = local_vars.get(var, "?")
                return f"🔁 for {var} in {iterable}: current value {var}={val}."
            return f"🔁 {s}"

        # while loop
        if s.startswith("while "):
            cond = re.match(r"while\s+(.+?):", s)
            cond_s = cond.group(1) if cond else "condition"
            return f"🔁 while {cond_s}: checking if loop continues."

        # print statement
        if s.startswith("print("):
            out_val = output_so_far[-1] if output_so_far else "?"
            return f"📤 print() → Output: {out_val}"

        # assignment
        if "=" in s and not s.startswith("==") and not s.startswith("if") and not s.startswith("while"):
            lhs = s.split("=")[0].strip().rstrip("+-*/")
            val = local_vars.get(lhs.split("[")[0], None)
            val_s = repr(val) if val is not None else ""

            # Detect swap
            if "," in lhs and "," in s.split("=", 1)[1]:
                return f"🔄 Swap: {s}. Exchange the two values."
            # Array/list access
            if "[" in lhs:
                base = lhs.split("[")[0]
                return f"📌 Set {lhs} = {val_s if val_s else s.split('=',1)[1].strip()}"
            # DP table update
            if "dp[" in s:
                return f"📊 DP table update: {s}. Store optimal subproblem solution."
            # Append
            if ".append(" in s:
                return f"➕ Append to list: {s}"
            # Pop
            if ".pop(" in s or ".popleft(" in s:
                return f"➖ Remove from collection: {s}"
            # General assignment
            rhs = s.split("=", 1)[1].strip() if "=" in s else s
            return f"📌 {lhs} = {val_s if val_s else rhs}"

        # function call as statement
        if s.endswith(")") or "(" in s:
            return f"▶ Execute: {s}"

        return f"▶ Line {ln}: {s}"

    return f"Step at line {ln}."


# ── Dangerous builtins to block ──────────────────────────────────────────────

BLOCKED = {
    "__import__", "open", "exec", "eval", "compile", "input",
    "globals", "locals", "vars", "dir", "getattr", "setattr",
    "delattr", "hasattr", "__subclasses__", "__bases__",
    "breakpoint", "exit", "quit",
}

def is_safe(code: str) -> tuple[bool, str]:
    """Quick safety check — block dangerous patterns."""
    dangerous_patterns = [
        r"\bos\b", r"\bsubprocess\b", r"\bsocket\b", r"\bshutil\b",
        r"\bpathlib\b", r"\bctypes\b", r"\bmultiprocessing\b",
        r"__import__", r"open\s*\(", r"\bexec\s*\(", r"\beval\s*\(",
        r"import\s+os", r"import\s+sys", r"import\s+subprocess",
    ]
    for p in dangerous_patterns:
        if re.search(p, code):
            return False, f"Blocked: '{p}' is not allowed for security reasons."
    return True, ""


# ── Core Python tracer ───────────────────────────────────────────────────────

MAX_STEPS = 120

def trace_python(code: str) -> dict:
    """
    Execute Python code under sys.settrace, producing educational step notes.
    Returns { title, language, steps: [{line, note, vars, stack, depth}] } or { error }.
    """
    # Safety check
    safe, reason = is_safe(code)
    if not safe:
        return {"error": reason}

    # Parse to check syntax first
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"error": f"SyntaxError on line {e.lineno}: {e.msg}"}

    # Detect algorithm title
    title = detect_title(code)

    code_lines = code.split("\n")
    steps: list[dict] = []
    call_stack: list[dict] = []
    output_lines: list[str] = []
    step_count = [0]

    # Intercept print output
    class CapturePrint(io.StringIO):
        def write(self, s):
            if s.strip():
                output_lines.append(s.rstrip("\n"))
            super().write(s)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<string>":
            return tracer
        if step_count[0] >= MAX_STEPS:
            return None  # stop tracing

        fn  = frame.f_code.co_name
        ln  = frame.f_lineno
        src = get_source_line(code_lines, ln)
        locs = {k: repr(v) for k, v in frame.f_locals.items()
                if not k.startswith("_") and k not in ("__builtins__", "__doc__", "__name__")}

        if event == "call":
            frame_info = {"fn": fn, "vars": locs, "depth": len(call_stack)}
            call_stack.append(frame_info)

        note = build_note(event, fn, ln, src, locs,
                          arg if event == "return" else None,
                          len(call_stack), list(output_lines))

        # Stack snapshot (newest first)
        stack_snap = list(reversed(call_stack))

        # If returning, annotate current top frame with return value
        if event == "return" and call_stack:
            call_stack[-1]["vars"]["↩ return"] = repr(arg)
            snap_with_ret = [dict(f) for f in reversed(call_stack)]
            snap_with_ret[0]["returning"] = True
            stack_snap = snap_with_ret

        steps.append({
            "line":  ln,
            "note":  note,
            "vars":  locs,
            "stack": stack_snap,
            "depth": max(0, len(call_stack) - 1),
        })
        step_count[0] += 1

        if event == "return" and call_stack:
            call_stack.pop()

        return tracer

    capture = CapturePrint()
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = capture
    sys.stderr = io.StringIO()

    try:
        compiled = compile(code, "<string>", "exec")
        sys.settrace(tracer)
        safe_globals = {
            "__builtins__": {
                k: v for k, v in __builtins__.items()
                if k not in BLOCKED
            } if isinstance(__builtins__, dict) else {
                k: getattr(__builtins__, k)
                for k in dir(__builtins__)
                if k not in BLOCKED and not k.startswith("__")
            },
        }
        exec(compiled, safe_globals)
        sys.settrace(None)
    except RecursionError:
        sys.settrace(None)
        return {"error": "RecursionError: maximum recursion depth exceeded. Try a smaller input (e.g. factorial(5) instead of factorial(20))."}
    except Exception as e:
        sys.settrace(None)
        tb = traceback.format_exc()
        # Extract the meaningful line
        err_line = str(e)
        match = re.search(r'line (\d+)', tb)
        ln_hint = f" (line {match.group(1)})" if match else ""
        return {"error": f"{type(e).__name__}: {err_line}{ln_hint}"}
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    output = capture.getvalue()

    # Add output to last step note if there is output
    if output.strip() and steps:
        steps[-1]["note"] += f" → Output: {output.strip().replace(chr(10), ', ')}"

    # Trim to max steps, keeping first and last
    if len(steps) > MAX_STEPS:
        steps = steps[:MAX_STEPS-1] + steps[-1:]

    return {
        "title":    title,
        "language": "Python",
        "steps":    steps,
        "output":   output.strip(),
    }


def detect_title(code: str) -> str:
    """Guess the algorithm/program name from the code."""
    c = code.lower()
    patterns = [
        (r"\bfactorial\b", "Factorial — Recursion"),
        (r"\bfib_memo\b|memo\[n\]", "Fibonacci — Dynamic Programming (Memoization)"),
        (r"\bfib\b.*\bfib\b", "Fibonacci — Recursion"),
        (r"\bmerge_sort\b|def merge\b", "Merge Sort"),
        (r"\bquick_sort\b|def partition\b", "Quick Sort"),
        (r"\bbubble_sort\b|arr\[j\].*arr\[j.1\]", "Bubble Sort"),
        (r"\bselection_sort\b|min_idx\b", "Selection Sort"),
        (r"\binsertion_sort\b|key\s*=\s*arr\[i\]", "Insertion Sort"),
        (r"\bbinary_search\b", "Binary Search"),
        (r"\bjump_search\b", "Jump Search"),
        (r"\blinear_search\b", "Linear Search"),
        (r"\bknapsack\b", "0/1 Knapsack — Dynamic Programming"),
        (r"\blcs\b|longest.*common", "Longest Common Subsequence — DP"),
        (r"\bhanoi\b", "Tower of Hanoi — Recursion"),
        (r"\blinked.?list\b|class\s+node\b", "Linked List"),
        (r"\bstack\b.*append|stack\.push", "Stack (LIFO)"),
        (r"\bqueue\b.*popleft|deque\b", "Queue (FIFO)"),
        (r"\bbst\b|binary.?search.?tree|def insert.*root", "Binary Search Tree"),
        (r"\bbfs\b|breadth.?first", "BFS — Breadth-First Search"),
        (r"\bdfs\b|depth.?first", "DFS — Depth-First Search"),
        (r"\bsum_arr\b", "Sum of Array — Recursion"),
    ]
    for pattern, label in patterns:
        if re.search(pattern, c):
            return label
    return "Custom Program"


# ── JavaScript step simulator (runs in backend, no external API) ─────────────

def simulate_js_steps(code: str) -> dict:
    """
    For JS/Java/C code: do smart pattern-matching simulation.
    Detects the algorithm and produces educational steps.
    Returns same format as trace_python.
    """
    title = detect_title_any(code)
    steps = []

    # We can't execute JS natively in Python, so we parse and produce
    # structural steps based on code analysis
    lines = code.split("\n")

    # Produce meaningful per-line steps by analyzing structure
    call_depth = 0
    in_function = False

    for i, line in enumerate(lines, 1):
        s = line.strip()
        if not s or s.startswith("//") or s.startswith("*") or s.startswith("/*"):
            continue

        # Detect events
        is_func_def = bool(re.match(r"(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*\{|static\s+\w+|public\s+static|void\s+\w+)", s))
        is_call     = "(" in s and not is_func_def and not s.startswith("//")
        is_return   = s.startswith("return ")
        is_if       = s.startswith("if ") or s.startswith("} else") or s.startswith("else ")
        is_for      = s.startswith("for ")
        is_while    = s.startswith("while ")
        is_assign   = "=" in s and not is_func_def and not is_if and not is_for and not is_while
        is_print    = "console.log" in s or "System.out" in s or "printf" in s

        note = build_note_any(s, i, call_depth, code)
        vars_snap = extract_vars_from_line(s)

        stack_frame = [{"fn": detect_current_fn(lines, i), "vars": vars_snap, "depth": call_depth}]

        steps.append({
            "line":  i,
            "note":  note,
            "vars":  vars_snap,
            "stack": stack_frame,
            "depth": call_depth,
        })

    if not steps:
        steps.append({"line": 1, "note": "▶ Program start.", "vars": {}, "stack": [], "depth": 0})

    return {"title": title, "language": "Code", "steps": steps[:MAX_STEPS]}


def detect_title_any(code: str) -> str:
    c = code.lower()
    patterns = [
        (r"factorial", "Factorial — Recursion"),
        (r"fib_?memo|memo\[n\]|memoiz", "Fibonacci — Memoization"),
        (r"\bfib\b.*\bfib\b|fibonacci", "Fibonacci — Recursion"),
        (r"mergesort|merge_sort|mergeSort", "Merge Sort"),
        (r"quicksort|quick_sort|quickSort|partition", "Quick Sort"),
        (r"bubblesort|bubble_sort|bubbleSort", "Bubble Sort"),
        (r"selectionsort|selection_sort|min_?idx", "Selection Sort"),
        (r"insertionsort|insertion_sort", "Insertion Sort"),
        (r"binarysearch|binary_search|binarySearch", "Binary Search"),
        (r"jumpsearch|jump_search", "Jump Search"),
        (r"linearsearch|linear_search", "Linear Search"),
        (r"knapsack", "0/1 Knapsack — DP"),
        (r"\blcs\b|longest.*common", "Longest Common Subsequence"),
        (r"hanoi|tower", "Tower of Hanoi"),
        (r"linkedlist|linked_list|\.next\b", "Linked List"),
        (r"\bstack\b.*push|\bstack\.push", "Stack (LIFO)"),
        (r"\bqueue\b.*shift|deque|\bqueue\b.*poll", "Queue (FIFO)"),
        (r"bst|binarysearchtree|binary.*tree", "Binary Search Tree"),
        (r"\bbfs\b|breadthfirst", "BFS — Breadth-First Search"),
        (r"\bdfs\b|depthfirst", "DFS — Depth-First Search"),
    ]
    for pattern, label in patterns:
        if re.search(pattern, c):
            return label
    return "Custom Program"


def build_note_any(src: str, ln: int, depth: int, full_code: str) -> str:
    s = src.strip()

    if re.match(r"(function\s+\w+|const\s+\w+\s*=\s*.*=>|static\s+\w+\s+\w+|public\s+static|void\s+main)", s):
        m = re.search(r"\b(\w+)\s*\(", s)
        name = m.group(1) if m else "function"
        return f"📝 Define function '{name}'. Not called yet — just declared."

    if s.startswith("return "):
        expr = s[7:].rstrip(";").strip()
        if "+" in expr and re.search(r"fib|fact", expr, re.I):
            return f"🔙 Return {expr}. Combine recursive results and unwind stack."
        return f"🔙 Return {expr}."

    if re.match(r"if\s*\(", s):
        cond = re.match(r"if\s*\((.+?)\)", s)
        cond_s = cond.group(1) if cond else s
        if re.search(r"===\s*0|===\s*1|<=\s*1|==\s*null|==\s*0", cond_s):
            return f"❓ Base case check: {cond_s}. If true, recursion stops here."
        return f"❓ Check condition: {cond_s}."

    if s.startswith("} else") or s.startswith("else "):
        return "↪ Else branch — previous condition was false."

    if re.match(r"for\s*\(", s):
        return f"🔁 For loop: {s[:60]}{'...' if len(s)>60 else ''}"

    if re.match(r"while\s*\(", s):
        cond = re.match(r"while\s*\((.+?)\)", s)
        return f"🔁 While {cond.group(1) if cond else 'condition'}: repeat while true."

    if "console.log" in s or "System.out.print" in s or "printf" in s:
        return f"📤 Print output: {s}"

    if "swap" in s.lower() or ("[" in s and "]" in s and "=" in s and "," in s):
        return f"🔄 Swap elements: {s}"

    if re.search(r"\w+\[.+\]\s*=", s):
        return f"📊 Array/table update: {s}"

    if "=" in s and not s.startswith("=="):
        lhs = s.split("=")[0].strip().rstrip("+-*/!")
        rhs = s.split("=", 1)[1].strip().rstrip(";")
        return f"📌 Assign: {lhs} = {rhs}"

    if re.search(r"\w+\s*\(", s):
        m = re.search(r"(\w+)\s*\(", s)
        return f"▶ Call {m.group(1) if m else 'function'}: {s[:60]}"

    return f"▶ Line {ln}: {s[:60]}{'...' if len(s)>60 else ''}"


def extract_vars_from_line(src: str) -> dict:
    """Try to extract variable name and literal value from an assignment."""
    s = src.strip().rstrip(";")
    m = re.match(r"(?:(?:let|const|var|int|long|float|double|char)\s+)?(\w+)\s*=\s*([^=].+)", s)
    if m:
        name, val = m.group(1), m.group(2).strip()
        if len(val) < 40:
            return {name: val}
    return {}


def detect_current_fn(lines: list[str], current_ln: int) -> str:
    """Walk backwards to find the enclosing function name."""
    for i in range(current_ln - 2, -1, -1):
        s = lines[i].strip()
        m = re.match(r"(?:function\s+(\w+)|(?:static\s+\w+\s+|public\s+static\s+\w+\s+|void\s+)(\w+)\s*\(|(\w+)\s*\(.*\)\s*\{)", s)
        if m:
            name = m.group(1) or m.group(2) or m.group(3)
            if name and name not in ("if", "for", "while", "else", "switch"):
                return name
    return "<module>"


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "VisuAlgo API v2 running — self-contained tracer, no external API needed"}


@app.post("/api/run")
def run_code(req: RunCodeRequest):
    """Validate Python code — returns {error} or {steps, output}."""
    if req.language.lower() != "python":
        return {"error": None, "steps": [], "output": ""}
    result = trace_python(req.code)
    # For validation purposes, just surface the error
    return {"error": result.get("error"), "steps": [], "output": result.get("output", "")}


@app.post("/api/trace")
def trace_code(req: TraceRequest):
    """
    Full step-by-step trace for any supported language.
    Python: real sys.settrace execution.
    JS/Java/C: AST-based structural simulation.
    Returns { title, language, steps, output } or { error }.
    """
    lang = req.language.strip()

    if lang == "Python":
        return trace_python(req.code)

    # For JS / Java / C — structural simulation (no external API)
    result = simulate_js_steps(req.code)
    return result


@app.post("/api/analyze-gaps")
def analyze_gaps(req: GapAnalysisRequest):
    graph = CONCEPT_GRAPHS.get(req.topic)
    if not graph:
        raise HTTPException(status_code=404, detail=f"Topic '{req.topic}' not found.")

    scores     = req.scores
    blind_spots = [c for c in graph if scores.get(c["id"], 0) < 50]

    visited, order = set(), []
    def visit(cid):
        if cid in visited: return
        visited.add(cid)
        node = next((c for c in graph if c["id"] == cid), None)
        if not node: return
        for dep in node["deps"]: visit(dep)
        if scores.get(cid, 0) < 65: order.append(node)
    for c in graph: visit(c["id"])

    return {
        "topic":          req.topic,
        "blind_spots":    blind_spots,
        "learning_path":  order[:6],
        "overall_score":  round(sum(scores.values()) / len(scores)) if scores else 0,
    }


@app.get("/api/topics")
def list_topics():
    return {"topics": list(CONCEPT_GRAPHS.keys())}
