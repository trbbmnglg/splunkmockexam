# Splunk MockTest

AI-powered mock exam generator for Splunk certifications. Generates dynamic, adaptive practice exams using multiple LLM providers with self-correcting validation, RAG grounding, and spaced repetition.

**Live:** [splunkmockexam.gtaad-innovations.com](https://splunkmockexam.gtaad-innovations.com)

---

## Supported Certifications

| Certification | Level | Questions |
|--------------|-------|-----------|
| Splunk Core Certified User | Entry | 20 |
| Splunk Core Certified Power User | Intermediate | 25 |
| Splunk Cloud Certified Admin | Professional | 20 |
| Splunk Enterprise Certified Admin | Professional | 20 |
| Splunk Enterprise Security Certified Admin | Professional | 20 |
| Splunk IT Service Intelligence Certified Admin | Professional | 20 |
| Splunk Observability Cloud Certified Admin | Professional | 20 |

## Architecture

```
React SPA (Vite + Tailwind CSS)
├── Cloudflare Pages (hosting + CDN)
├── Cloudflare Workers (API backend)
│   ├── D1 (SQLite — profiles, wrong answers, flags, seen concepts)
│   └── Vectorize (RAG document embeddings)
└── LLM Providers
    ├── Groq (Llama 3.3 70B) — default, free tier included
    ├── Perplexity (Sonar Pro) — live web search grounding
    ├── Google Gemini (1.5 Flash) — schema-enforced JSON
    └── OpenRouter (Qwen 2.5 72B) — alternative provider
```

## Agentic Features

### Question Generation Pipeline

```
Build Prompt → LLM Generation → Self-Correcting Validation → Randomize → Serve
     │                                    │
     │ Injects:                           │ Up to 6 cycles:
     │ • Blueprint distribution           │ • 6 quality rules
     │ • Adaptive context (weak topics)   │ • Regenerate failures
     │ • RAG passages (Splunk docs)       │ • Merge replacements
     │ • Seen concepts (dedup)            │ • Threshold: ≤10% failure
     │ • User flag warnings               │
     └────────────────────────────────────┘
```

### Adaptive Learning System

Tracks per-topic performance across sessions:

- **Score history** — rolling window of last 7 session scores per topic
- **Trend detection** — improving / stable / declining (based on rolling average comparison)
- **Topic graduation** — mastered when 85%+ on 5 consecutive scores; receives minimum 1 question
- **Weighted distribution** — weak topics get 1.4–1.8x base weight; strong topics get 0.6–0.8x
- **Exam readiness score** — weighted against official blueprint percentages

### Self-Correcting Validator

Multi-cycle validation agent that checks generated questions against 6 rules:

1. Answer must be exact character-for-character match of one option
2. No duplicate concepts across questions
3. Options must be grammatically parallel (within ~15 words length difference)
4. No "All of the above" / "None of the above"
5. Difficulty must match certification level
6. Question must be complete and unambiguous

Failed questions are regenerated on the same topic with a different concept and merged back. Cycles scale with exam size: 4 (default), 5 (40+ questions), 6 (60+ questions).

### Answer Explanation Agent

RAG-grounded explanations with depth escalation:

| Times Missed | Depth | Content |
|-------------|-------|---------|
| 1st | Basic | Confirm answer, explain why your choice was wrong |
| 2nd | Detailed | Underlying mechanism, contrast choices, real-world consequences |
| 3rd+ | Deep | First-principles explanation, analogy, address specific misconception |

Retrieves relevant Splunk doc passage via Vectorize before generating. Falls back to LLM-only if RAG unavailable.

### Cross-Session Dedup

Questions are hashed (SHA-256) and stored per user. On subsequent sessions, seen concepts are injected into the prompt as hard exclusions. Prevents repetitive drilling across sessions.

### Question Flagging

Users can flag up to 3 questions per session with a reason (wrong level, off-topic, incorrect answer, ambiguous). When a question accumulates 3+ flags from different users, the pattern is injected into future generation prompts as a quality warning.

### Wrong Answer Bank & Review Mode

Missed questions are stored in a spaced repetition bank. Review mode:

1. Fetches top 15 wrong answers ranked by `times_missed`
2. Identifies 3 weakest topics
3. AI-generates fresh questions on those weak topics (with dedup)
4. Validates new questions through the same pipeline
5. Combines with original wrong answers, shuffles, and serves

## Privacy & Security

- **Explicit opt-in** — consent modal covers GDPR, PDPA, CCPA, EU AI Act
- **API keys stay client-side** — never transmitted to our servers
- **Privacy token** — 256-bit random token, SHA-256 hashed, signed payloads with 5-minute replay protection
- **QR profile transfer** — AES-GCM encrypted userId with 24-hour expiry
- **Collision detection** — receiving device prompts user if existing data found
- **Data controls** — download all data, delete all data, toggle tracking
- **CSP headers** — strict Content-Security-Policy with whitelisted API endpoints
- **HSTS** — `Strict-Transport-Security` with preload
- **Input sanitization** — multi-pass HTML/script/event handler stripping

## Quick Start

### Prerequisites

- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com)) — or use the built-in shared key

### Development

```bash
npm install
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
VITE_GROQ_TOKEN=your_groq_api_key      # Default free-tier key
VITE_QR_SECRET=your_qr_secret          # For QR code encryption
VITE_FEEDBACK_EMAIL=your@email.com      # Feedback webhook recipient
```

### Build

```bash
npm run build
```

Output goes to `dist/` — deploy to Cloudflare Pages or any static host.

### Deployment (Cloudflare Pages)

1. Connect your GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables in Pages settings:
   - `VITE_GROQ_TOKEN`
   - `VITE_QR_SECRET`
   - `VITE_FEEDBACK_EMAIL`

## Project Structure

```
src/
├── App.jsx                    # Root component, state orchestration
├── main.jsx                   # Entry point, QR transfer handling
├── index.css                  # Tailwind + custom animations
│
├── components/                # UI components (14 files)
│   ├── ConfigScreen.jsx       # Exam configuration panel
│   ├── ExamScreen.jsx         # Active exam UI
│   ├── ResultsScreen.jsx      # Results, review, actions tabs
│   ├── WrongAnswerCard.jsx    # Per-question review with AI explainer + flag
│   ├── MenuScreen.jsx         # Certification selection grid
│   ├── ConsentModal.jsx       # Privacy consent (GDPR/PDPA/CCPA)
│   ├── PrivacySettingsModal.jsx # Data download/delete/tracking
│   ├── ShareProfileModal.jsx  # QR code generation
│   ├── FeedbackModal.jsx      # AI-validated user feedback
│   └── ...                    # ErrorModal, LoadingScreen, etc.
│
├── hooks/                     # Custom React hooks (5 files)
│   ├── useExamSession.js      # Full exam lifecycle state machine
│   ├── useExamTimer.js        # Countdown timer hook
│   ├── useAdaptiveProfile.js  # Profile prewarming + usage tracking
│   ├── useKeyboard.js         # Keyboard navigation
│   └── examSessionHelpers.js  # Pure helper functions
│
└── utils/                     # Business logic (20 files)
    ├── api.js                 # Barrel re-export (backwards compat)
    ├── apiConfig.js           # Env vars, schema, trace factory
    ├── apiFetch.js            # fetchWithRetry (exponential backoff)
    ├── apiGenerate.js         # Multi-provider question generation
    ├── apiValidate.js         # Answer matching, docSource filtering, parsing
    │
    ├── agentAdaptive.js       # Barrel re-export (backwards compat)
    ├── adaptiveStorage.js     # userId + localStorage helpers
    ├── adaptiveProfile.js     # Profile CRUD, graduation, readiness
    ├── adaptiveRemote.js      # D1 operations (wrong answers, seen concepts)
    ├── adaptiveContext.js     # Adaptive prompt injection
    │
    ├── agentValidator.js      # Self-correcting validation pipeline
    ├── agentExplainer.js      # RAG-grounded answer explanations
    ├── buildAgenticPrompt.js  # Full prompt assembly
    ├── questionFlags.js       # User flag submission + prompt injection
    │
    ├── constants.js           # Blueprints, topics, named constants
    ├── helpers.js             # Shared utilities (normalize, shuffle, etc.)
    ├── baseUrl.js             # API base URL (dev/prod)
    ├── privacyToken.js        # Cryptographic privacy token system
    └── qrCrypto.js            # AES-GCM QR code encryption/decryption
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Icons | Lucide React |
| QR Code | react-qr-code |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Vector Search | Cloudflare Vectorize |
| LLM Providers | Groq, Perplexity, Google Gemini, OpenRouter |
| Encryption | Web Crypto API (AES-GCM, SHA-256, PBKDF2) |

## License

MIT — see [LICENSE](LICENSE)
