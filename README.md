<p align="center">
  <img src="public/pwa-512.png" alt="LifeLog logo" width="100" height="100" />
</p>

<h1 align="center">LifeLog</h1>

<p align="center">
  A calm, focused note-taking &amp; routine-tracking app.<br />
  Free forever on one device — upgrade for cloud sync, backups, and premium workflows.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/firebase-11-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/tailwindcss-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/paddle-billing-000000?logo=paddle&logoColor=white" alt="Paddle Billing" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## ✨ Overview

**LifeLog** is a modern, offline-first note-taking web app designed for daily planning and personal productivity. It combines a rich text editor, smart organization tools, and gentle reminders into a single, distraction-free dashboard.

> **Status:** Actively developed · Core features are stable · Premium billing integration works end-to-end via Paddle

<p align="center">
  <img src="src/assets/preview.png" alt="LifeLog dashboard preview" width="800" />
</p>

---

## 🚀 Features

### Free (forever)

| Feature | Details |
|---------|---------|
| **Rich text editor** | Bold, italic, headings, lists, task checklists, links, inline images, text color, highlights — powered by [Tiptap](https://tiptap.dev) |
| **Tags + custom colors** | Create unlimited tags with per-tag color pickers for quick visual scanning |
| **Pins & due dates** | Pin important notes to the top; set due dates with optional browser reminders |
| **Smart folders** | Auto-filtered views: by tag, pinned, due today, due soon, or has a due date |
| **Grid & list views** | Toggle between grid and list layouts; sort by modified, created, title, or due date |
| **Starter templates** | One-click templates for daily logs, meeting notes, task dumps, weekly reviews, and project plans |
| **Keyboard shortcuts** | `Ctrl/Cmd+K` to search · `Alt+N` to create a new note |
| **Dark mode** | System-aware light/dark theme with smooth transitions |
| **Focus mode** | Distraction-free writing mode that hides chrome |
| **Offline-first** | Notes are stored locally in the browser — no account required |
| **PWA-ready** | Installable as a Progressive Web App with service worker caching |

### Premium ($7.99/mo or ~$79.55/yr)

| Feature | Details |
|---------|---------|
| **Cloud sync** | Real-time Firestore sync across all devices with offline cache |
| **Version history** | Automatic backups on every save with one-click restore |
| **Memory map** | Visual, interactive SVG map of your notes clustered by tag |
| **Recurring notes** | Schedule daily, weekly, or monthly note auto-creation from templates |
| **Export toolkit** | Print to PDF · Download as Markdown |
| **Shareable links** | Generate read-only public links; unshare anytime |
| **Image uploads** | Drag-and-drop or browse images (auto-optimized to WebP, max 10 MB) |
| **Import to cloud** | One-click migration of local notes to Firestore |
| **Note locking** | Passcode-protect sensitive notes |
| **Tag drag & drop** | Drag tags across notes for bulk organization |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 5, React Router 7 |
| **UI** | [HeroUI](https://heroui.com) (components), Tailwind CSS 3, Framer Motion |
| **Editor** | Tiptap (ProseMirror) with custom extensions |
| **Backend** | Firebase (Auth, Firestore, Storage, Hosting) |
| **Billing** | Paddle (subscriptions) via Express.js API server |
| **Deployment** | Firebase Hosting (frontend) + Render Free Tier (billing API) |

---

## 📂 Project Structure

```
├── public/                  # PWA assets, manifest, service worker
├── server/
│   ├── app.js               # Express billing API (Paddle checkout, webhooks, portal)
│   ├── app.test.js           # Node test runner tests
│   ├── index.js             # Server entry point
│   └── lib/                 # Server utilities
├── src/
│   ├── assets/              # SVG icons, preview screenshot
│   ├── components/
│   │   ├── App.jsx          # Main notes dashboard (grid, list, memory map)
│   │   ├── Auth.jsx         # Sign in / Sign up flows
│   │   ├── Content.jsx      # Landing page / marketing site
│   │   ├── HomeModal.jsx    # Note create/edit modal
│   │   ├── NoteList.jsx     # Note cards (grid, list, trash, preview, history)
│   │   ├── Pricing.jsx      # Pricing page with Paddle checkout
│   │   ├── Profile.jsx      # User dashboard, calendar, settings, data export/import
│   │   ├── RichTextEditor.jsx # Tiptap editor with toolbar
│   │   ├── ShareNote.jsx    # Public shared note viewer
│   │   └── ...              # Navbar, Footer, Privacy, Terms, 404, theme toggle
│   ├── contexts/            # AuthContext (user, plan, premium status)
│   ├── extensions/          # Custom Tiptap node extensions (ImageNode)
│   ├── hooks/               # useBillingStatus, useFocusMode, useReminders
│   ├── services/            # notesMigration, billingPortal API helpers
│   ├── utils/               # localStorage wrappers, tag colors, note locking,
│   │                        # note portability (JSON/MD export/import), recurring notes,
│   │                        # HTML sanitization, password validation
│   ├── firebase.js          # Firebase client SDK initialization
│   └── main.jsx             # App entry point with providers
├── firestore.rules          # Firestore security rules
├── storage.rules            # Cloud Storage security rules
├── firebase.json            # Firebase Hosting configuration
├── render.yaml              # Render.com one-click deploy blueprint
├── .env.example             # Required environment variables
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 20
- A [Firebase](https://firebase.google.com) project with Authentication, Firestore, and Storage enabled

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/lifelog.git
cd lifelog
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 3. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 💳 Premium Billing (Optional)

The billing server handles Paddle checkout sessions, webhook events, and the customer billing portal. You only need this if you're enabling paid subscriptions.

### 1. Configure the server

```bash
cp server/.env.example server/.env
```

Fill in your Paddle API key, webhook secret, price IDs, and Firebase Admin service account.

### 2. Start the billing API

```bash
npm run server
```

Runs on `http://localhost:4242` by default.

### 3. Point the client to the server

In `.env`:

```env
VITE_API_BASE_URL=http://localhost:4242
```

---

## 🌐 Zero-Cost Deployment

Deploy the full stack without paying for infrastructure:

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Firebase Hosting | Free tier |
| Billing API | Render.com Free Web Service | Free tier |
| Database | Firestore (Firebase) | Free tier |
| Auth | Firebase Authentication | Free tier |
| Storage | Firebase Cloud Storage | Free tier |

### Deploy backend to Render

This repo includes a `render.yaml` blueprint for one-click setup:

1. Push the repo to GitHub
2. In Render → **New Blueprint** → select your repo
3. Set the required environment variables (see `render.yaml` for the full list)
4. Deploy — copy your Render URL (e.g. `https://lifelog-billing-api.onrender.com`)

### Deploy frontend to Firebase

```bash
# Set VITE_API_BASE_URL to your Render URL in .env
npm run build
firebase deploy --only hosting
```

### Configure Paddle webhooks

In your Paddle dashboard, set the webhook destination to:

```
https://<your-render-domain>/webhook/paddle
```

Subscribe to:
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`

### Switch to live Paddle

When ready for production billing:
- Replace sandbox keys/price IDs with live values
- Set `PADDLE_API_BASE_URL=https://api.paddle.com`
- Update webhook destination in Paddle live environment

---

## 🔒 Security

- **Firestore rules** enforce per-user read/write access — see [`firestore.rules`](firestore.rules)
- **Storage rules** restrict uploads to authenticated owners with size and type limits — see [`storage.rules`](storage.rules)
- **Paddle webhooks** are verified server-side with HMAC signatures
- **Rate limiting** is configured for checkout, portal, and webhook endpoints
- **Passwords** follow configurable validation rules (min length, complexity)

---

## 🧪 Testing

Run the billing API tests:

```bash
npm test
```

Uses Node.js built-in test runner (`node --test`).

---

## 🗺️ Roadmap

- [ ] Collaborative shared notes (real-time editing)
- [ ] Mobile app (React Native or Capacitor)
- [ ] AI-powered note suggestions & summarization
- [ ] Kanban board view
- [ ] Calendar integrations (Google Calendar, iCal)
- [ ] Browser extension for quick capture
- [ ] Multi-language support (i18n)
- [ ] End-to-end encryption for locked notes

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ☕ and calm intention.
</p>
