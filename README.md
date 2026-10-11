# MediVoice 💊🔊

**Your medicine, explained simply.**

MediVoice is an accessibility-first web app that reads the label on a medicine bottle or
prescription, explains it in plain language (and Hindi), and can read the instructions out
loud — built for elderly and visually-impaired users.

Snap one or more photos of a label → Google Gemini reads them together → you get a clear,
large-print explanation with dosage steps, severity-coded warnings and an expiry badge →
tap **Read Out Loud** to hear it in English or Hindi.

---

## Features

- **Multi-photo scanning** — upload or capture up to 5 photos of a label (front, back, leaflet). Gemini reads them together.
- **Plain-language results** — medication name, "also called", what it's for, how to take it, and things to watch out for.
- **Severity-coded warnings** — critical warnings are highlighted so they are hard to miss.
- **Expiry badge** — instantly shows whether the medicine is expired, expiring soon, or valid.
- **Low-confidence flag** — warns when a label was hard to read so users double-check with a pharmacist.
- **Hindi translation** — one tap to translate results (drug/brand names kept in Latin).
- **Text-to-speech** — ElevenLabs reads the summary aloud, in English or Hindi.
- **Saved history** — every scan is stored and listed under the History tab.
- **Settings** — default language, auto read-out-loud, text size (accessibility scaling), light/dark theme, and clear history.
- **Secure by default** — locked-down CORS and a passcode guard on costly AI endpoints.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, Vite 5, Tailwind CSS 3 |
| Backend    | Python, FastAPI, Uvicorn |
| Database   | SQLite via SQLAlchemy 2 |
| AI (vision + translation) | Google Gemini (`google-genai`) |
| Voice      | ElevenLabs SDK |

---

## Architecture

```
┌────────────────────────┐        ┌──────────────────────────────┐
│   React + Vite (5173)  │        │      FastAPI (8000)          │
│                        │  HTTP  │                              │
│  Scan / History /      ├───────►│  POST /api/scan-medicine     │
│  Settings tabs         │        │  POST /api/translate         │
│  X-Demo-Passcode hdr   │        │  POST /speak                 │
│                        │◄───────┤  GET /api/scans …            │
└────────────────────────┘        └───────┬───────────┬──────────┘
                                           │           │
                                    ┌──────▼───┐  ┌────▼──────────┐
                                    │  SQLite  │  │ Gemini /      │
                                    │ (scans)  │  │ ElevenLabs    │
                                    └──────────┘  └───────────────┘
```

---

## Project structure

```
medivoice/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, /speak, /api/health
│   │   ├── config.py          # settings (env-driven)
│   │   ├── security.py        # X-Demo-Passcode dependency
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models.py          # MedicationScan table
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── gemini_client.py   # Gemini vision + Hindi translation
│   │   └── routers/
│   │       ├── scan.py        # /api/scan-medicine, /api/translate
│   │       └── scans.py       # /api/scans ...
│   ├── data/                  # SQLite database (git-ignored)
│   ├── .env.example           # environment template
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── src/
    │   ├── App.jsx            # nav tabs: Scan / History / Settings
    │   ├── api/client.js      # API wrapper (adds passcode header)
    │   ├── context/SettingsContext.jsx
    │   ├── lib/settings.js    # defaults + persistence + apply
    │   └── components/
    │       ├── ScanCard.jsx      # upload + webcam
    │       ├── ResultCard.jsx    # results + TTS + Hindi toggle
    │       ├── HistoryList.jsx
    │       ├── SettingsPage.jsx
    │       └── Loader.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## Getting started

### Prerequisites

- **Python 3.11+** (developed on 3.14)
- **Node.js 18+** and npm
- A **Google Gemini API key** — https://aistudio.google.com/app/apikey
- An **ElevenLabs API key** — https://elevenlabs.io → profile → API Keys

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
# source .venv/bin/activate

python -m pip install -r requirements.txt

# create your env file and fill in the keys
cp .env.example .env

python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

> The frontend talks to `http://localhost:8000` (see `src/api/client.js`).

---

## Environment variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `GEMINI_MODEL` | | `gemini-3.8-flash` | Gemini model id |
| `ELEVENLABS_API_KEY` | ✅ (for voice) | — | ElevenLabs API key |
| `DEMO_PASSCODE` | | `MEDIVOICE2026` | Shared secret required in the `X-Demo-Passcode` header |
| `ALLOWED_ORIGINS` | | `http://localhost:5173,https://medivoice.example.com` | Comma-separated CORS origins (no `*`) |
| `DATABASE_URL` | | `sqlite:///./data/medivoice.db` | Database location |
| `MAX_UPLOAD_MB` | | `10` | Max size per uploaded image |

> ⚠️ **Never commit `.env`.** It is git-ignored. `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`
> are real secrets — rotate them if they are ever exposed.

---

## API reference

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET`  | `/api/health` | — | Service status |
| `POST` | `/api/scan-medicine` | 🔒 | Scan 1–5 label images (multipart `files`) |
| `POST` | `/api/translate` | 🔒 | Translate a result to Hindi |
| `POST` | `/speak` | 🔒 | Text → MP3 audio (`{ "text": "..." }`) |
| `GET`  | `/api/scans` | — | List saved scans (`?limit=&offset=`) |
| `GET`  | `/api/scans/{id}` | — | Get one saved scan |
| `DELETE` | `/api/scans` | 🔒 | Delete **all** saved scans |
| `DELETE` | `/api/scans/{id}` | — | Delete one saved scan |

🔒 = requires header `X-Demo-Passcode: <DEMO_PASSCODE>`.

**Example — scan a label**

```bash
curl -X POST http://localhost:8000/api/scan-medicine \
  -H "X-Demo-Passcode: MEDIVOICE2026" \
  -F "files=@label.jpg"
```

**Example — read result aloud**

```bash
curl -X POST http://localhost:8000/speak \
  -H "X-Demo-Passcode: MEDIVOICE2026" \
  -H "Content-Type: application/json" \
  -d '{"text":"Take one tablet after food"}' \
  --output voice.mp3
```

---

## Security notes

- **No wildcard CORS.** Only origins in `ALLOWED_ORIGINS` are accepted.
- **Passcode guard** (`X-Demo-Passcode`) protects the expensive AI endpoints
  (`/api/scan-medicine`, `/api/translate`, `/speak`) and the destructive clear-all endpoint.
- **Constant-time comparison** (`secrets.compare_digest`) for the passcode.
- Image uploads are validated (type, size, decodability) before use.

> **Honest caveat:** the demo passcode is embedded in the frontend bundle, so it is visible
> to anyone who inspects the app. It is an abuse deterrent for a demo, **not real
> authentication**. For production, move it server-side behind a session and rotate it.

---

## Accessibility

- Large, high-contrast text that scales via **Settings → Text size**.
- Optional **auto read-out-loud** for users who cannot read the screen.
- Hindi output and Hindi speech.
- Severity-coded warnings and a low-confidence flag.
- Keyboard-focus outlines and reduced-motion support.

---

## Hackathon notes

**How we built it.** A Python/FastAPI backend sends 1–5 label photos to Google Gemini's
vision model, which returns structured JSON (validated against a Pydantic schema) with the
medicine name, purpose, dosage, warnings and expiry. Scans are stored in SQLite via
SQLAlchemy and translated to Hindi on demand with a second Gemini call. The React + Vite +
Tailwind frontend handles camera/upload, an accessible results card, history and settings,
with ElevenLabs text-to-speech behind a **Read Out Loud** button. We hardened it for the demo
with restricted CORS and a passcode guard.

**Challenges.** Gemini model churn (retired models returning 404 until we settled on the
working one); a locked-down Windows environment that blocked new binaries and npm postinstall
scripts; a Windows Long-Path error that broke the ElevenLabs SDK install; and prompt-tuning
Gemini to read multiple photos together and translate to Hindi while keeping drug names in
Latin.

**Accomplishments.** A true end-to-end flow — snap photos → read together → clear explanation
with severity-coded warnings and expiry → one tap to hear it in English or Hindi — built for
elderly and visually-impaired users, and shipped with a real security pass instead of
exposed keys.

**What we learned.** Getting reliable structured output from Gemini with schema validation
and retries; streaming TTS audio into the browser; how much accessibility detail (text size,
confidence warnings, severity colors) matters; and the difference between a demo passcode and
real authentication.

---

## Disclaimer

MediVoice explains the information printed on a medicine label. It is **not medical advice**.
Always follow your doctor or pharmacist.
