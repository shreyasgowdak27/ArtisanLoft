# ArtisanLoft

[![Backend FastAPI CI](https://github.com/shreyasgowdak27/ArtisanLoft/actions/workflows/backend-fastapi-ci.yml/badge.svg?branch=main)](https://github.com/shreyasgowdak27/ArtisanLoft/actions/workflows/backend-fastapi-ci.yml)

Furniture storefront with a React frontend, FastAPI API, Supabase Auth and Postgres, and Redis backed rate limits.

## Live app

- Frontend: [artisanloft.vercel.app](https://artisanloft.vercel.app)
- API: [artisan-loft-api.onrender.com](https://artisan-loft-api.onrender.com)
- Health: [artisan-loft-api.onrender.com/health](https://artisan-loft-api.onrender.com/health)

## Tech stack

- Backend: Python, FastAPI, SQLAlchemy, Alembic, and asyncpg.
- Frontend: React 18, React Router, Axios, and Tailwind CSS.
- Database and authentication: Supabase Postgres and Supabase Auth.
- Rate limiting: Redis from Upstash.
- Hosting: Render for the API and Vercel for the frontend.
- CI: GitHub Actions runs the backend tests on pushes and pull requests to `main`.
- Uptime monitoring: UptimeRobot.

## Features

- Browse furniture collections and product details.
- Sign up and log in through Supabase Auth.
- Add products to a cart, adjust quantities, and remove items.
- Place orders, use the demo payment flow, and view order history and receipts.
- Submit a contact form with input validation and spam protection.
- Rate limit API requests by client IP.

## Architecture

The React app calls the FastAPI API. Supabase provides Postgres and user authentication. FastAPI verifies Supabase access tokens and stores product, cart, contact, and order data in Postgres. The rate limiter uses Upstash Redis when configured and an in process counter otherwise.

Rate limits use the client IP. Product reads, `/me`, and cart or order writes check their limit before authentication or route handling. Contact submissions allow 3 requests per hour. `/me` allows 30 requests per minute. Cart and order writes share one 30 requests per minute bucket. Reads share a 120 requests per minute bucket. Limits are fixed window. If Redis is unavailable, requests continue without rate enforcement. `/health` routes and `OPTIONS` requests are exempt.

## Run locally

### Prerequisites

- Git
- Python 3.12
- Node.js 18 or newer with npm
- A Supabase account to create a new project

### Clone and configure Supabase

```bash
git clone https://github.com/shreyasgowdak27/ArtisanLoft.git
cd ArtisanLoft
```

Create a **new Supabase project** for this local setup. In its dashboard, find the project URL, API keys, and Postgres connection string. Use the transaction pooler connection details for `DATABASE_URL`, with the SQLAlchemy URL scheme shown in `backend-fastapi/.env.example`.

Copy both example files:

```bash
cp backend-fastapi/.env.example backend-fastapi/.env
cp frontend/.env.example frontend/.env.local
```

Replace the example values with your project values. Keep service keys and database credentials private. Do not commit `.env` or `.env.local`.

| Variable | Purpose and where to get it |
| --- | --- |
| `DATABASE_URL` | Backend Postgres connection. Get the transaction pooler connection details from the new Supabase project's database settings. Keep the `postgresql+asyncpg://` scheme. |
| `SUPABASE_URL` | Backend project URL used to find the Auth signing keys. Copy the project URL from Supabase API settings. |
| `SUPABASE_ANON_KEY` | Backend's configured Supabase public key. Copy the anon key from Supabase API settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend's configured service role key. Copy it from Supabase API settings and keep it private. |
| `JWT_SECRET` | Required backend setting retained by the current configuration. Generate a random value of at least 32 characters; Supabase JWT verification uses the project's JWKS endpoint. |
| `JWT_EXPIRE_MINUTES` | Legacy token lifetime setting. The example value is `60`; the current API verifies Supabase tokens. |
| `CORS_ORIGINS` | Comma separated frontend origins allowed by the API. For local use, keep `http://localhost:3000`. |
| `FRONTEND_URL` | Frontend origin setting. For local use, keep `http://localhost:3000`. |
| `ENV` | Backend environment mode. Use `development` locally. |
| `PORT` | Local API port used by the container configuration. The example value is `8000`. |
| `REDIS_URL` | Optional Redis connection for shared rate limits. Leave blank locally to use the in process counter. For hosted use, get the TLS connection URL from Upstash. |
| `UNSPLASH_ACCESS_KEY` | Optional key for the image fetching utility. Get it from Unsplash Developers if you use that utility. |
| `REACT_APP_API_URL` | API base URL used by React. For local use, set it to `http://localhost:8000`. |
| `REACT_APP_SUPABASE_URL` | Supabase project URL used by React. Copy the same URL as `SUPABASE_URL`. |
| `REACT_APP_SUPABASE_ANON_KEY` | Public Supabase anon key used by React. Copy the same anon key as `SUPABASE_ANON_KEY`. |
| `REACT_APP_CONTACT_EMAIL` | Email displayed on the contact page. Use the address you want visitors to see. |

### Start the backend

```bash
cd backend-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`. Verify the API at [http://localhost:8000/health](http://localhost:8000/health); a healthy response is `{"status":"ok"}`.

## Deployment

The API is deployed to Render using `backend-fastapi/Dockerfile`; the frontend is hosted on Vercel. Set `ENV=production` in Render so local origins are removed from CORS. Set `REDIS_URL` to the Upstash TLS connection URL (`rediss://...`) to share rate limit counters across API instances. Redis is optional, and the API fails open if Redis is unavailable.

## Demo video

Demo: [add Drive link]
