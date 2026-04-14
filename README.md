# IKKL – IIEST Kho-Kho League

Official platform for IKKL 1.0, the inaugural inter-college Kho-Kho tournament at IIEST Shibpur.

## Structure

```
ikkl-frontend/   # Public-facing React site
ikkl-admin/      # Admin panel (React)
ikkl-backend/    # Node.js + Express + MongoDB API
```

## Stack

- **Frontend / Admin**: React 18, Vite, Tailwind CSS v4, Framer Motion, Socket.IO client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth, Cloudinary

## Setup

### Backend
```bash
cd ikkl-backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Required `.env` keys:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ikkl
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend
```bash
cd ikkl-frontend
cp .env.example .env
npm install
npm run dev
```

### Admin
```bash
cd ikkl-admin
cp .env.example .env
npm install
npm run dev
```

`.env` for both frontend apps:
```
VITE_API_URL=http://localhost:3000/api
```

## Admin Login

Default credentials (seeded on first run):
- Email: `admin@ikkl`
- Password: `ikkl`

## Features

- Live match scores with real-time Socket.IO updates
- Match timer with play/pause, editable duration, visible on scorecard
- Inning tracking (2 innings per match)
- Points table with NRR calculation
- Team management with Cloudinary logo upload
- Fullscreen scorecard mode (press `F`)
- Score animation toasts on live updates
- JWT-secured admin panel
