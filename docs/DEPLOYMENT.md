# Deploying to Vercel + Supabase Auth

## 1. Supabase: enable email auth

1. Open your project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Email**
3. Enable **Email** provider
4. For development, you can disable **Confirm email** under **Authentication → Providers → Email** (optional — speeds up testing)
5. Go to **Authentication → URL configuration** and set:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs** (add all of these):
     ```
     http://localhost:5173/**
     https://your-app.vercel.app/**
     ```

Replace `your-app.vercel.app` with your real Vercel domain after the first deploy.

### Google sign-in (optional)

1. **Supabase → Authentication → Providers → Google** — enable and copy the callback URL
2. **Google Cloud Console → Credentials → OAuth client ID** (Web application)
   - Authorized JavaScript origins: `http://localhost:5173`, your Vercel URL
   - Authorized redirect URIs: the Supabase callback URL
3. Paste **Client ID** and **Client Secret** into Supabase Google provider settings

## 2. Supabase: run SQL migrations

In **SQL Editor**, run in order:

1. `supabase/notes.sql` — table + columns
2. `supabase/auth.sql` — per-user Row Level Security policies

## 3. Deploy to Vercel

### Option A: Vercel dashboard (recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — keep these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |
6. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Add env vars when prompted, or in the Vercel dashboard under **Settings → Environment Variables**.

## 4. After first deploy

1. Copy your Vercel URL (e.g. `https://personal-dashboard-abc123.vercel.app`)
2. In Supabase → **Authentication → URL configuration**:
   - Set **Site URL** to your Vercel URL
   - Add `https://personal-dashboard-abc123.vercel.app/**` to **Redirect URLs**
3. Redeploy if you changed env vars

## 5. Test sign-in

1. Open your Vercel URL
2. You should see the sign-in page
3. Click **Sign up**, create an account
4. Sign in → dashboard loads
5. Edit notes — they save per user via `user_id` + RLS

## Local development

```bash
cp .env.example .env.local
# add your Supabase URL + anon key
npm run dev
```

Use `http://localhost:5173` in Supabase redirect URLs for local testing.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sign-up works but sign-in fails | Check if email confirmation is required in Supabase |
| Notes not saving after login | Run `supabase/auth.sql` |
| Blank page on Vercel | Check build logs; confirm env vars are set |
| Auth redirect loop | Add your exact Vercel URL to Supabase redirect URLs |
