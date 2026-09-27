# AgroSense — Frontend

The AgroSense web app frontend: crop recommendation, soil restoration, leaf disease detection, prediction history, Pro upgrades and mandi price lookups, built for farmers.

Built with [TanStack Start](https://tanstack.com/start) (React) + Tailwind CSS + shadcn/ui. Talks to the AgroSense Flask API — see `AGENTS.md` for the backend integration conventions used throughout this codebase.

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don't have it.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Copy `.env.example` to `.env` and set `VITE_API_URL` to your backend's URL (e.g. `http://localhost:5000` locally, or your deployed Railway/Render URL).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — lint the codebase
- `npm run format` — format with Prettier
