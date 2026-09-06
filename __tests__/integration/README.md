                 INTEGRATION TEST

Fake Request object
       │
       ▼
┌───────────────────────┐
│   REAL POST() route   │  ← code we're testing
└───────────────────────┘
       │
       ├── fs.access() ───────► MOCK
       │
       ├── exec("yt-dlp") ────► MOCK
       │
       ├── exec("ffmpeg") ────► MOCK
       │
       └── generateClips() ───► MOCK
       │
       ▼
Real Response object
       │
       ▼
   Assertions
   