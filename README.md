# EcoSync

This project scans a fridge photo, detects ingredients using Google Gemini AI, and generates recipes.

## Setup

1. Get Google AI Studio API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add the API key to Supabase Secrets:
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add: `GEMINI_API_KEY = (get from aistudio.google.com)`

## Where to plug in your data

- `src/pages/Index.tsx`: contains the fridge ingredient list and recipe generation flow.
- `src/components/SmartFridge.tsx`: handles manual ingredient input and image scanning.
- `supabase/functions/scan-fridge/index.ts`: sends fridge photos to Google Gemini AI and returns detected ingredients.
- `supabase/functions/generate-recipes/index.ts`: sends selected ingredients and user preferences to Google Gemini AI and returns recipes.

## Deploy

### Option 1: Vercel (Frontend only)
- Run `npm install` and `npm run build` locally.
- Deploy frontend to Vercel.
- Set `GEMINI_API_KEY` in Vercel environment variables.
- Update API URLs in frontend to point to your deployed Cloudflare Workers.

### Option 2: Cloudflare Workers (Full deployment)
1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler auth login`
3. Deploy scan-fridge worker:
   ```bash
   cd cloudflare
   wrangler deploy scan-fridge.js
   ```
4. Deploy generate-recipes worker:
   ```bash
   wrangler deploy generate-recipes.js
   ```
5. Update frontend API URLs to your deployed worker URLs.
6. Deploy frontend to Cloudflare Pages or another host.

### Option 3: Supabase (Current setup)
- Deploy to Supabase with Edge Functions.
- Set `GEMINI_API_KEY` in Supabase project settings.
