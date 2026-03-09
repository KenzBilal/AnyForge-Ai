# Deployment & Setup Guide

AnyForge-AI is designed to be completely stateless, meaning it can be deployed seamlessly to platforms like Render, Railway, Vercel, or Fly.io with zero persistent disk requirements. 

## Prerequisites
1. **Groq API Key**: To power the blazing fast LLM extractions.
2. **Supabase Account**: You will need both the standard `SUPABASE_URL` and the secret `SUPABASE_SERVICE_ROLE_KEY` (The backend runs with elevated privileges to manage client quotas).

---

## 1. Local Development Setup

### Backend (FastAPI)
Navigate to the root and build the python dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` in the root:
```env
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
ADMIN_API_KEY=your-secret-admin-key
```

Run the API:
```bash
uvicorn main:app --reload
```

### Frontend (React & Vite)
From a separate terminal window:
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

Run the dashboard:
```bash
npm run dev
```

---

## 2. Production Deployment

### Option A: Railway
This repository contains a `railway.toml` specifically targeting the new 10/10 structure. It automatically changes into the `backend/` directory, installs dependencies, and boots the Uvicorn application on port 8000. 

To deploy:
1. Link your GitHub repository in Railway.
2. Add the four required backend environment variables (`GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`).
3. Deploy!

### Option B: Render
The project also comes with a predefined `render.yaml`. Render can use this file to dynamically build the pipeline (Building python dependencies automatically). Simply connect the repo and supply your Env Vars inside the Render Dashboard.

### Option C: Vercel (Frontend Component)
Deploy the React frontend easily using Vercel. 
1. The **Root Directory** inside the Vercel dashboard must be explicitly set to `frontend/`. 
2. Vercel will auto-detect Vite and apply the static build `npm run build` and output command `dist`.
3. Configure the environment variables `VITE_API_BASE_URL` (Pointing to your deployed Railway/Render URL) and your Supabase credentials.
