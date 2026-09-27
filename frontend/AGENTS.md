# AgroSense — Agent Notes

## AgroSense conventions

- All backend calls go through the shared axios instance in `src/lib/api.ts` (base URL from `VITE_API_URL`), so the token header and 401 handling live in one place.
- Auth state lives in `src/lib/auth.tsx` (localStorage JWT); protected pages set `ssr: false` and wrap their component in `<Protected>` because the session is only readable in the browser.
