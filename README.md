# Mangalam Weekly Achievement & Incentive

Single-page tool (index.html) plus one API function (api/store.js) that keeps every login's figures in Neon.

## Deploy
1. Create a repo under VPHR-ML (e.g. `weekly-achievement`) and push these three items: `index.html`, `api/store.js`, `package.json`.
2. Import the repo in Vercel. No build command, no framework preset.
3. Create a Neon database and add its connection string in Vercel as `DATABASE_URL` (exact name).
4. Redeploy. The table `mip_store` is created on the first request.

The page detects the API automatically. Opened as a plain file it falls back to this browser only (demo mode).

## First run
Sign in as CEO (password 123) → Settings → change the CEO password. Then Projects & buildings → change each project and cluster-head password.

## Security note
Passwords are checked in the browser and the API has no authentication. Anyone with the URL who knows how can read the data, including the staff salary list. Keep the URL internal; before relying on it for payroll, move login to the API (server-side password check and role-based responses).
