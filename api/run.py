from http.server import BaseHTTPRequestHandler
import json
import sys
import io


def safe_execute_python(code: str) -> dict:
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

    return {"steps": steps, "output": stdout_capture.getvalue(), "error": None}


class handler(BaseHTTPRequestHandler):

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)
            code = data.get("code", "")
            language = data.get("language", "python")

            if language != "python":
                resp = json.dumps({"error": "Only Python supported."}).encode()
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self._cors_headers()
                self.end_headers()
                self.wfile.write(resp)
                return

            result = safe_execute_python(code)
            resp = json.dumps(result).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(resp)

        except Exception as e:
            resp = json.dumps({"error": str(e)}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(resp)

    def log_message(self, format, *args):
        pass
