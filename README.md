# CodeGEN

<p align="center">
  <b>Practice. Compete. Collaborate.</b><br/>
  A full-stack coding platform with problems, contests, duels, team battles, and real-time interactions.
</p>

---

## Overview

CodeGEN is a coding practice platform inspired by online judges. It combines a modern coding interface with competitive and collaborative modes, including:

- Daily-style coding problem solving
- Contest participation
- 1v1 real-time duels
- Team management and team battles
- Submissions tracking and profile stats
- Real-time events using Socket.IO

## Key Features

### Core Learning
- Solve coding problems by difficulty and slug-based routing
- Work inside editor pages designed for coding workflows
- Track personal submissions and performance over time

### Competitive Modes
- Join coding contests
- Play 1v1 duel sessions
- Participate in team battles

### Collaboration and Community
- Team creation and management
- Collaborative editor flows
- Live updates powered by WebSocket events

### User Experience
- Authentication with JWT
- Protected user flows (profile, submissions, team pages)
- Responsive React frontend with route-based navigation

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, React Router, Axios, Monaco Editor, Socket.IO Client |
| Backend | Node.js, Express, Mongoose, Socket.IO, JWT, bcrypt |
| Database | MongoDB (Atlas or local) |

---

## Project Structure

```text
CodeGEN/
  client/                     # React frontend
    src/
      pages/                 # Screens (Problems, Contests, Duel, Teams, etc.)
      components/            # Reusable UI/editor components
      context/               # Auth context and shared state
      utils/                 # API and socket helpers
  server/                     # Express backend
    routes/                  # REST endpoints (auth, problems, contests, etc.)
    models/                  # Mongoose schemas
    index.js                 # App + DB + Socket.IO bootstrap
    socket.js                # Socket event handlers
    seed-problems.js         # Seed script for sample problems
```

---

## Quick Start

### 1) Prerequisites

- Node.js 18+ (recommended)
- npm
- MongoDB (local install or Atlas connection string)

### 2) Clone and install dependencies

```bash
git clone <your-repository-url>
cd CodeGEN

cd server
npm install

cd ../client
npm install
```

### 3) Configure backend environment

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/leetclone
PORT=5000
JWT_SECRET=replace_with_a_strong_secret
CLIENT_ORIGIN=http://localhost:3000
```

### 4) Start development servers

Backend:

```bash
cd server
npm start
```

Frontend (new terminal):

```bash
cd client
npm start
```

### 5) Open the app

- Frontend: `http://localhost:3000`
- Backend health route: `http://localhost:5000/`

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection URI (Atlas or local) | `mongodb://localhost:27017/leetclone` |
| `PORT` | No | Backend server port | `5000` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `super_secret_key` |
| `CLIENT_ORIGIN` | No | Allowed frontend origin for CORS and Socket.IO | `http://localhost:3000` |

---

## API Route Groups

The backend mounts these primary route groups:

- `/auth`
- `/problems`
- `/submissions`
- `/judge`
- `/contests`
- `/teams`
- `/duels`
- `/users`
- `/stats`
- `/team-battles`

> Root route (`/`) returns `API is running`.

---

## Seed Sample Problems

You can populate the database with starter problems:

```bash
cd server
node seed-problems.js
```

This script clears existing problems and inserts curated sample entries.

---

## Scripts

### Server (`server/package.json`)

- `npm start` - Run Express API server
- `npm test` - Placeholder (currently not configured)

### Client (`client/package.json`)

- `npm start` - Run React development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject CRA config (irreversible)

---

## Configuration Notes

- Frontend API base URL is configured in `client/src/utils/api.js` (`http://localhost:5000` by default).
- CORS origin is controlled by `CLIENT_ORIGIN`.
- On startup, backend attempts `MONGO_URI` first and may fall back to local MongoDB in specific Atlas connection-failure scenarios.

---

## Troubleshooting

### Frontend cannot connect to backend
- Make sure backend is running on `PORT=5000`
- Confirm `client/src/utils/api.js` points to your active backend URL
- Verify `CLIENT_ORIGIN` matches your frontend host

### MongoDB connection errors
- Check `MONGO_URI` in `server/.env`
- If using Atlas, ensure your IP is allowed and credentials are valid
- Test local MongoDB fallback with `mongodb://localhost:27017/leetclone`

### Auth token issues
- Confirm `JWT_SECRET` is set and not empty
- Clear browser session storage and re-login if token format changes

---



---



1. Create a feature branch
2. Make focused changes
3. Test locally (`client` + `server`)
4. Open a pull request with clear context and screenshots (if UI changes)

---


