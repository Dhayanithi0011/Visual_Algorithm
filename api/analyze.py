from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

SYSTEM_PROMPT = """You are an expert code execution analyzer for a DSA learning platform.
The user will give you a code snippet in any language (Python, JavaScript, Java, C, C++, etc.).

Your job:
1. Check if the code has syntax or logical errors.
2. If there are errors, return ONLY this JSON (no extra text, no markdown):
   {"error": "clear short error message describing exactly what is wrong"}

3. If the code is valid and runnable, simulate its execution step by step and return ONLY this JSON:
   {
     "title": "what algorithm/program this is",
     "language": "detected language",
     "steps": [
       {
         "line": <1-based line number being executed>,
         "note": "educational explanation of what this step does and WHY",
         "vars": {"varName": "value"},
         "depth": <call stack depth, 0 = top level>
       }
     ]
   }

Rules:
- Return ONLY raw JSON. No backticks, no markdown, no preamble.
- Max 60 steps. Educational notes explaining WHY, not just WHAT.
- vars reflect state AFTER this step. Output shown as: → Output: value
- Keep each note under 120 characters."""


class handler(BaseHTTPRequestHandler):

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)

            code = data.get("code", "").strip()
            language = data.get("language", "Python")

            if not code:
                return self._json(400, {"error": "No code provided."})

            api_key = os.environ.get("GEMINI_API_KEY", "")
            if not api_key:
                return self._json(500, {"error": "Server configuration error: GEMINI_API_KEY not set."})

            prompt = f"{SYSTEM_PROMPT}\n\nLanguage: {language}\n\nCode:\n{code}"

            payload = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
            }).encode("utf-8")

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_body = resp.read().decode("utf-8")
            except urllib.error.HTTPError as e:
                return self._json(502, {"error": f"AI service error: {e.code}"})
            except urllib.error.URLError:
                return self._json(502, {"error": "Could not reach AI service."})

            gemini_data = json.loads(resp_body)
            raw = gemini_data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Strip markdown fences
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1]
            if raw.endswith("```"):
                raw = raw.rsplit("```", 1)[0]
            raw = raw.strip()

            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                return self._json(200, {"error": "Could not parse AI response. Please check your code."})

            return self._json(200, parsed)

        except Exception as e:
            return self._json(500, {"error": f"Server error: {str(e)}"})

    def log_message(self, format, *args):
        pass
