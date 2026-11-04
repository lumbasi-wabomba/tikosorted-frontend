# TikoSorted frontend

React + Vite.

## Run it

```bash
npm install
cp .env.example .env.local   # set VITE_BACKEND_URL to your backend
npm run dev
```

The app calls `/api/...`; the dev server forwards those calls to `VITE_BACKEND_URL`.
For production, serve the built files (`npm run build`) from the same domain as the API.

## Where things are

- `src/utils/api.js`: every backend call (see `API.md` for what each sends and returns)
- `src/hooks/`: load data for pages (`useRequest.js` is the shared loading/error helper)
- `src/pages/`: one file per screen, routes are in `src/App.js`
- `src/components/`: small reusable pieces
- `src/styles/`: CSS
