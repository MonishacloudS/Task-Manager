# Advanced Task Manager App

Full-stack Task Manager built with React + Node.js + Express + SQLite.

## Features Implemented

- Add, complete, delete, and filter tasks (All, Completed, Pending)
- Task persistence:
  - Server database persistence (SQLite)
  - Client cache persistence using Local Storage (`useLocalStorage` hook)
- Authentication APIs:
  - Register
  - Login
  - Logout
- React Context API for global auth and task state
- Performance optimization with `React.memo`, `useCallback`, and `useMemo`
- Form validation to prevent empty task submissions
- Theme toggle (Light/Dark mode)
- Animated task interactions via CSS transitions
- Responsive, mobile-first UI
- Drag-and-drop task reordering (`@hello-pangea/dnd`, drop-in replacement for `react-beautiful-dnd`)

## Tech Stack

- Frontend: React + Vite + Axios
- Backend: Node.js + Express
- Database: SQLite
- Auth: JWT + bcryptjs

## Project Structure

- `client/` - React frontend
- `server/` - Express API + SQLite database

## Setup

### 1) Backend

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

### 2) Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Tasks (Protected with Bearer token)

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PUT /api/tasks/reorder/all`
- `DELETE /api/tasks/:id`

## Submission (GitHub)

1. Create a personal GitHub repository.
2. Push this project to your repository.
3. Share the GitHub repository link as your submission.
