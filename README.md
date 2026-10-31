# Executive Advisory: frontend

The web interface of the **AI Executive Advisory System**. Users sign in, ask specialist AI advisors questions about company
documents, and manage the document library. Administrators also manage users, follow the upload automations and read the
audit log.

It is a React single-page app built with Vite. It talks to the FastAPI backend in [`../backend`](../backend) through `/api`
on the same origin, so the session cookie stays `SameSite=Strict` and no CORS is needed.

## Features

| Page | Route | Who | What it does |
|---|---|---|---|
| Sign in | `/login` | everyone | Email and password, show/hide password, session-expired notice, theme switch |
| Overview | `/` | signed in | Role-aware dashboard: document and question counts, recent questions, recent documents; for administrators also users, security events of the last 24 hours and automation runs |
| Ask the advisors | `/ask` | signed in | Chat with the Finance Advisor, the HR & Management Advisor or the Knowledge Assistant, or let the system route automatically. Answers show citations, calculations, conflicts between documents and missing information |
| Documents | `/documents` | signed in | Search and filter by category and access level, upload (PDF, Word, text; up to 10 MB) with live processing steps, download; administrators can reclassify and delete |
| Automations | `/admin/automations` | administrator | Upload pipeline runs with their five steps; refreshes while a run is in progress |
| Users & roles | `/admin/users` | administrator | Add users, change roles, disable or enable accounts |
| Audit log | `/admin/audit` | administrator | Security and activity events, filtered by group (security, sign-in, documents, AI, users) |

The interface opens in a warm ivory light theme. The switch in the top bar turns on dark mode and remembers the choice.

## Tech stack

- [React 19](https://react.dev) and [React Router 7](https://reactrouter.com)
- [Vite 8](https://vite.dev) for the dev server and the production build
- [Lucide](https://lucide.dev) icons
- Inter and Fraunces fonts, self-hosted through [Fontsource](https://fontsource.org), so no font CDN is needed
- Plain CSS with design tokens for both themes; no UI framework and no state library (React context is enough)

## Getting started

**Requirements:** Node.js 20.19 or newer, and the backend running on port 8000 (see the [root README](../README.md)).

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards every `/api` request to `http://127.0.0.1:8000`
(see [`vite.config.js`](vite.config.js)). The demo accounts are described in the root README.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally |

### Production build

```bash
npm run build
```

The backend serves `frontend/dist` itself, so after a build the UI and the API both run at http://localhost:8000 on one
origin. Client-side routes such as `/documents` fall back to `index.html`.

### Configuration

| Variable | Default | Use |
|---|---|---|
| `VITE_API_URL` | empty (same origin) | Set it only when the UI is hosted on a different domain from the API, for example `https://api.example.com`. The backend then needs `CORS_ORIGINS` and `COOKIE_SAMESITE=none` over HTTPS. |

## Project structure

```
frontend/
  index.html             HTML entry point
  vite.config.js         dev server on port 5173 and the /api proxy to the backend
  public/favicon.svg
  src/
    main.jsx             entry: router, providers, theme chosen before the first paint
    App.jsx              routes and the RequireAuth / RequireAdmin guards
    api.js               fetch wrapper: CSRF header, JSON and FormData bodies, errors, 401 handling
    auth.jsx             AuthProvider (session state, login, logout) and ToastProvider
    ui.jsx               shared helpers and small components: useApi, useTheme, badges, modal, dates
    theme.css            colour tokens for both themes, typography, app shell, theme switch
    components.css       cards, buttons, fields, badges, tables, dialogs
    pages.css            page layouts
    components/
      Layout.jsx         sidebar, top bar and user card
      AnswerCard.jsx     an advisor's answer: sources, calculations, conflicts, missing information
      UploadModal.jsx    upload form and the live automation progress
    pages/
      Login.jsx  Dashboard.jsx  Ask.jsx  Documents.jsx  Automations.jsx  Users.jsx  Audit.jsx
```

## How sign-in and security work in the UI

- **The session lives in an HttpOnly cookie.** JavaScript never reads or stores it, so an XSS bug cannot steal the session.
- **The CSRF token is kept in memory only.** `api.js` sends it as `X-CSRF-Token` on every request that changes data
  (POST, PATCH, DELETE). Other websites cannot read it, so forged requests are rejected.
- **After a page refresh** the memory is empty, so `AuthProvider` calls `GET /api/auth/me`. The cookie restores the
  user and a fresh CSRF token, without anything sensitive in `localStorage`.
- **Any 401 response signs the user out** with a notice, for example after 30 minutes of inactivity.
- **Role checks in the UI are for convenience only.** `RequireAdmin` hides the administrator pages, but the API enforces
  every rule itself and returns 403 to standard users.
- `localStorage` holds a single value: the theme preference (`aea-theme`).

The diagram below shows the session restore on page load. Every workflow is documented as a sequence diagram in
[`../imgs`](../imgs), and the wireframes, diagrams and production notes are collected in
[`AI_Executive_Advisory_UI_and_Backend_Design.docx`](../imgs/AI_Executive_Advisory_UI_and_Backend_Design.docx).

![App load or refresh: the UI restores the session through GET /api/auth/me](../imgs/06_app_load_or_refresh.png)

## Troubleshooting

- **"Cannot reach the server. Please check that the API is running."** Start the backend on port 8000 first.
- **Port 5173 is already in use.** Run `npm run dev -- --port 5174`.
- **The backend runs on another port.** Change the proxy target in `vite.config.js`.
- **"Administrator access required" on a page.** You are signed in as a standard user; the Automations, Users & roles
  and Audit log pages need an administrator account.

## Related

- [`../README.md`](../README.md): the whole project, the backend, the demo accounts and the security design.
