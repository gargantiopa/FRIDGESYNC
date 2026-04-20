# EcoSync

This project scans a fridge photo, detects ingredients using Google Gemini AI, and generates recipes.

## Setup

1. Get Google AI Studio API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add the API key to Supabase Secrets:
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add: `GEMINI_API_KEY = YOUR_API_KEY_HERE`

## Where to plug in your data

- `src/pages/Index.tsx`: contains the fridge ingredient list and recipe generation flow.
- `src/components/SmartFridge.tsx`: handles manual ingredient input and image scanning.
- `supabase/functions/scan-fridge/index.ts`: sends fridge photos to Google Gemini AI and returns detected ingredients.
- `supabase/functions/generate-recipes/index.ts`: sends selected ingredients and user preferences to Google Gemini AI and returns recipes.

## Deploy

### Prerequisites
1. Set up environment variables by copying `.env.example` to `.env` and filling in your values.
2. Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Option 1: Supabase (Recommended)
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref kbsjlqpttzwezbzhfarc`
4. Set secret: `supabase secrets set GEMINI_API_KEY=your_api_key`
5. Deploy functions: `npm run deploy:supabase`
6. Deploy frontend to Vercel/Netlify or Supabase hosting.

### Option 2: Cloudflare (Full deployment)
1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler auth login`
3. Set secret: `wrangler secret put GEMINI_API_KEY`
4. Deploy workers: `npm run deploy:cloudflare`
5. Deploy frontend to Cloudflare Pages:
   - Connect your GitHub repo to Cloudflare Pages
   - Set build command: `bun run build`
   - Set build output directory: `dist`
   - Set deploy command: `npx wrangler pages deploy dist` (or leave blank for auto-detection)
   - Set build output directory: `dist`
   - Set environment variables in Pages settings

### Option 3: Hybrid (Vercel + Cloudflare)
- Deploy frontend to Vercel as in Option 1.
- Deploy API to Cloudflare Workers as in Option 2.
- Update frontend API URLs to point to Cloudflare Workers.
