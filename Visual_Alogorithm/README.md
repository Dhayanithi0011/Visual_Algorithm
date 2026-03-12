# VisuAlgo — Real-Time Code Visualizer + AI Quiz

A full-stack college Tech Day project combining:
- **Code Visualizer**: Step through Python/JS code and watch memory, call stacks, and sorting animations live.
- **AI Quiz**: Upload quiz results and get a concept dependency graph + personalized learning path.

---

## Project Structure

```
visualgo-project/
├── src/
│   ├── App.jsx               # Root component, page routing
│   ├── App.css               # Global styles, CSS variables
│   ├── main.jsx              # Entry point
│   ├── components/
│   │   ├── Navbar.jsx        # Top navigation bar
│   │   └── Navbar.css
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Home.css
│   │   ├── Visualizer.jsx    # Code visualizer (step-through)
│   │   ├── Visualizer.css
│   │   ├── LearningPath.jsx  # AI Quiz + learning path
│   │   ├── LearningPath.css
│   │   ├── Dashboard.jsx     # Progress dashboard
│   │   └── Dashboard.css
│   └── services/
│       └── firebase.js       # Firebase config (fill in your keys)
├── backend/
│   ├── main.py               # FastAPI server
│   └── requirements.txt
├── index.html
├── package.json
└── vite.config.js
```

---

## Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

**Stack:** React 18 + Vite, react-icons, Bootstrap 5

---

## Backend Setup (FastAPI)

```bash
cd backend

# Install Python deps
pip install -r requirements.txt

# Run API server
uvicorn main:app --reload --port 8000
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

## Firebase Setup

1. Go to https://console.firebase.google.com
2. Create a new project called "visualgo"
3. Add a Web App
4. Copy the config object into `src/services/firebase.js`
5. Enable Firestore Database (for saving sessions)
6. Enable Authentication if needed

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/run | Execute Python code, return step trace |
| POST | /api/analyze-gaps | Analyze quiz scores, return blind spots + path |
| GET | /api/topics | List available concept topics |

---

## Tech Day Demo Flow

1. Open the **Visualizer** — select "Factorial" — press Run & Visualize
2. Step through with controls, show call stack growing and shrinking
3. Switch to "Bubble Sort" — show animated bars swapping
4. Open **Quiz** — select "ML Quiz Result" — show concept map
5. Show blind spots highlighted in red + personalized learning path
6. Open **Dashboard** — show progress tracking

---

## Future Enhancements (Stretch Goals)

- Connect Visualizer to FastAPI `/api/run` for real Python execution
- Add Monaco Editor for real code editing
- Add "Explain This Step" AI tutor via OpenAI API
- Firebase auth for user accounts
- Shareable visualization URLs
