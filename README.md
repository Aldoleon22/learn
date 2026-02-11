# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Profile + Content MySQL (API)

This project now includes a small Express API for persisting the user profile and all learning content in MySQL.

Setup:
- Copy `.env.server.example` to `.env.server` and fill in your MySQL credentials.
- Create the database in MySQL (e.g. `code_master`).
- Optionally run `server/schema.sql` if you prefer manual setup; the server also creates tables automatically.
- Seed content from the current JS files: `npm run seed:content`
- To enable AI content generation, set `GROQ_API_KEY` in `.env.server`.

Run:
- Terminal 1: `npm run dev` (Vite frontend, port 5173)
- Terminal 2: `npm run server` (API, port 3001)

The Vite dev server proxies `/api/*` to the API.
