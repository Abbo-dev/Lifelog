# LifeLog (Hnotepad)

Calm note + routine tracker with optional Premium cloud sync.

## Setup

1) Install deps

`npm install`

2) Create `.env`

Copy `.env.example` → `.env` and fill your Firebase values.

3) Run the app

`npm run dev`

## Firebase Rules

- Firestore rules live in `firestore.rules`
- Storage rules live in `storage.rules`

Deploy them from the Firebase console or via the Firebase CLI.

## Premium (Paddle) backend (optional)

To auto-unlock Premium after Paddle checkout, run `server/index.js`.

1) Copy `server/.env.example` → `server/.env` and fill:
   - Paddle API key + webhook secret
   - Paddle price IDs (monthly/annual)
   - Firebase Admin service account JSON

2) Run:

`npm run server`

3) Point the client at your server:

Set `VITE_API_BASE_URL` in `.env` (example: `http://localhost:4242`).
