# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Cloud-based password manager ("Şifre Kasası") with a Node.js/Express backend and React/Vite frontend. See `README.md` for full feature list.

### Services

| Service | Port | Dev command | Directory |
|---------|------|-------------|-----------|
| Backend API (Express + SQLite) | 3001 | `npm run dev` | `/workspace` (root) |
| Web Frontend (Vite + React) | 5173 | `npm run dev` | `/workspace/web` |

### Running the app

1. Start the backend first: `npm run dev` from the project root (port 3001).
2. Start the web frontend: `cd web && npm run dev` (port 5173). The Vite proxy forwards `/api` requests to the backend automatically.
3. Open `http://localhost:5173` in a browser.

SQLite database (`sfr.db`) is created automatically on first backend startup — no external database setup needed.

### Notes

- No ESLint, TypeScript, or test framework is configured in this project.
- No git hooks or pre-commit hooks.
- The `argon2` native dependency requires C++ build tools (`python3`, `make`, `g++`), which are pre-installed in the VM.
- The backend uses `node --watch` for hot reloading in dev mode.
- Desktop (Electron) and iOS (SwiftUI) sub-projects are optional and not needed for web development.
- Delete `sfr.db` to reset the database to a clean state.
