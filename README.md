# EcommerceSPA

Simple full-stack demo with:
- Backend: Node.js + Express + SQLite (`backend/`, port 4000)
- Frontend: React + Vite (`frontend/`, port 5173)

## Prerequisites
- Node.js 18+ installed and on PATH
- npm 10+
- Windows PowerShell or CMD

## First-time setup
```powershell
# Backend deps
cd C:\Users\whynew.in\Desktop\EcommerceSPA\backend
cmd /c "npm install"

# Frontend deps
cd C:\Users\whynew.in\Desktop\EcommerceSPA\frontend
cmd /c "npm install"
```

## Run (development)
Open two terminals.

### Terminal 1 – Backend API (http://localhost:4000)
```powershell
cd C:\Users\whynew.in\Desktop\EcommerceSPA\backend
node server.js
```
Expected output: `API listening on http://localhost:4000`.

### Terminal 2 – Frontend (http://localhost:5173)
```powershell
cd C:\Users\whynew.in\Desktop\EcommerceSPA\frontend
# Use npx so we don’t need a global vite
cmd /c "npx vite --port 5173"
```
Open http://localhost:5173 in your browser.

## Project structure
```
EcommerceSPA/
  backend/
    server.js
    package.json
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      api.js
      auth.js
      cartLocal.js
      pages/
        Items.jsx
        Cart.jsx
        Login.jsx
        Signup.jsx
      styles.css
```

## Environment and data
- The backend creates `ecommerce.db` (SQLite) in `backend/` on first run and seeds items.
- Change `JWT_SECRET` in `backend/server.js` for production.

## API quick reference
- POST `/api/auth/signup` { email, password } → { token }
- POST `/api/auth/login` { email, password } → { token }
- GET `/api/items` with optional `category`, `minPrice`, `maxPrice`, `q`
- POST `/api/items` (Bearer token)
- PUT `/api/items/:id` (Bearer token)
- DELETE `/api/items/:id` (Bearer token)
- GET `/api/cart` (Bearer token)
- POST `/api/cart` (Bearer token) { itemId, qty }
- PUT `/api/cart/:itemId` (Bearer token) { qty }
- DELETE `/api/cart/:itemId` (Bearer token)

## Troubleshooting (Windows)
- PowerShell blocks npm scripts
  - Prefix commands with `cmd /c "..."` as shown or run:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```
- ETARGET / missing modules
  ```powershell
  rd /s /q node_modules
  del package-lock.json
  cmd /c "npm cache clean --force"
  cmd /c "npm install"
  ```
- Vite JSON/BOM error
  - Ensure `frontend/package.json` is UTF-8 without BOM (recreate file contents if needed), then reinstall.
- No styles
  - Ensure `frontend/src/styles.css` exists and `frontend/src/main.jsx` imports:
    ```js
    import './styles.css';
    ```

## Stop/exit
- Stop a running server: Ctrl + C (answer Y if asked)
- Close terminal session: `exit`

## Build (optional)
```powershell
cd C:\Users\whynew.in\Desktop\EcommerceSPA\frontend
cmd /c "npm run build"
cmd /c "npm run preview"
```

## License
MIT
