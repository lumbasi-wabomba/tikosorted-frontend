# TikoSorted frontend

React + Vite.

## Run it

```bash
npm install
cp .env.example .env.local   # set VITE_BACKEND_URL to your backend
npm run dev
```

In development, the app calls `/api/...` and the Vite dev server forwards those
calls to `VITE_BACKEND_URL` (or `http://localhost:3000` by default). In the
Docker image, `VITE_BACKEND_URL` is read when the Nginx container starts and
written to `config.js`, so it is not embedded in the Vite bundle.

## Where things are

- `src/utils/api.js`: every backend call (see `API.md` for what each sends and returns)
- `src/hooks/`: load data for pages (`useRequest.js` is the shared loading/error helper)
- `src/pages/`: one file per screen, routes are in `src/App.js`
- `src/components/`: small reusable pieces
- `src/styles/`: CSS
