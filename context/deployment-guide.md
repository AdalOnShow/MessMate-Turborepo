# MessMate Deployment Guide

## Overview

This guide covers deploying MessMate to production:

- **Web (Next.js):** Vercel
- **API (NestJS):** Vercel (Serverless)
- **Database:** Neon PostgreSQL

**Total Cost: Free** (Vercel Hobby + Neon Free Tier)

---

## Prerequisites

1. GitHub account with the MessMate repository
2. Vercel account (free tier available)
3. Neon account (free tier available)

---

## Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (IPv4 pooler)
4. Run migrations locally:
   ```bash
   cd packages/database
   pnpm prisma migrate deploy
   ```
5. The connection string should look like:
   ```
   postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Set Up Vercel (Web App)

1. Go to [vercel.com](https://vercel.com) and create an account
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Project Name:** `messmate-web`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm turbo build --filter=web`
   - **Output Directory:** `.next`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
   ```
6. Click "Deploy"

---

## Step 3: Set Up Vercel (API)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository (same repo)
4. Configure the project:
   - **Project Name:** `messmate-api`
   - **Framework Preset:** Other
   - **Root Directory:** `apps/api`
   - **Build Command:** `cd ../.. && pnpm turbo build --filter=api`
   - **Output Directory:** `dist`
5. Add environment variables:
   ```
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   JWT_ACCESS_SECRET=your-64-char-hex-secret
   JWT_REFRESH_SECRET=your-64-char-hex-secret
   CORS_ORIGIN=https://messmate-web.vercel.app
   BCRYPT_SALT_ROUNDS=10
   NODE_ENV=production
   VERCEL=1
   ```
6. Go to Settings → Functions and set:
   - **Function Region:** Select closest to your users
   - **Max Duration:** 30 seconds
7. Click "Deploy"

---

## Step 4: Generate JWT Secrets

Generate secure random secrets for JWT:

```bash
# Generate 64-character hex strings
openssl rand -hex 64
```

Run this twice to generate two different secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## Step 5: Update Web App CORS

After API is deployed, update the web app's environment variable:

1. Go to Vercel → messmate-web → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to your API URL:
   ```
   NEXT_PUBLIC_API_URL=https://messmate-api.vercel.app
   ```
3. Redeploy the web app

---

## Step 6: Set Up CI/CD with GitHub Actions

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret                  | Description                  |
| ----------------------- | ---------------------------- |
| `TURBO_TOKEN`           | Turborepo remote cache token |
| `VERCEL_TOKEN`          | Vercel deployment token      |
| `VERCEL_ORG_ID`         | Vercel organization ID       |
| `VERCEL_PROJECT_ID_WEB` | Vercel web project ID        |
| `VERCEL_PROJECT_ID_API` | Vercel API project ID        |

### Required Variables

Add these variables to your GitHub repository (Settings → Secrets → Actions → Variables):

| Variable     | Description         |
| ------------ | ------------------- |
| `TURBO_TEAM` | Turborepo team name |

### Getting Tokens

**Turborepo:**

```bash
npx turbo login
npx turbo link
```

**Vercel:**

1. Go to Vercel Settings → Tokens
2. Create a new token
3. For each project (web and API):
   - Go to Project Settings → General
   - Copy "Project ID"
4. For Org ID:
   - Go to Vercel Dashboard → Settings → General
   - Copy "Team ID" (or "Personal Account ID")

---

## Step 7: Environment Variables Summary

### Root `.env` (shared)

```bash
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### Web App (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://messmate-api.vercel.app
```

### API (Vercel)

```bash
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
JWT_ACCESS_SECRET=your-64-char-hex-secret
JWT_REFRESH_SECRET=your-64-char-hex-secret
CORS_ORIGIN=https://messmate-web.vercel.app
BCRYPT_SALT_ROUNDS=10
NODE_ENV=production
VERCEL=1
```

---

## Step 8: Verify Deployment

1. Check Vercel deployment logs for both projects
2. Test the API health endpoint:
   ```bash
   curl https://messmate-api.vercel.app
   ```
3. Test authentication:
   ```bash
   curl -X POST https://messmate-api.vercel.app/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","password":"password123"}'
   ```
4. Test the web app:
   - Open `https://messmate-web.vercel.app` in browser
   - Try signing up/signing in

---

## Vercel Free Tier Limits

| Feature              | Limit               |
| -------------------- | ------------------- |
| Bandwidth            | 100 GB/month        |
| Build minutes        | 6,000 minutes/month |
| Serverless functions | 100 GB-hours/month  |
| Projects             | Unlimited           |
| Domains              | Unlimited           |

**Note:** For a personal project, the free tier is more than sufficient.

---

## Troubleshooting

### Build Failures

- Ensure `pnpm install --frozen-lockfile` works locally
- Check that all environment variables are set in Vercel

### CORS Errors

- Verify `CORS_ORIGIN` matches your web app URL exactly
- Include `https://` protocol
- Make sure both projects are in the same Vercel team/account

### Database Connection Issues

- Verify Neon database is running
- Check connection string format
- Ensure `sslmode=require` is present
- Neon free tier pauses after inactivity — visit Neon dashboard to wake it

### API Cold Starts

- Serverless functions have cold start latency (~1-2 seconds)
- First request may be slower
- Subsequent requests are fast

### Authentication Issues

- Verify JWT secrets are set and identical across deployments
- Check token expiry settings
- Ensure `VERCEL=1` is set in API environment

---

## Cost Summary

| Service      | Tier  | Cost                  |
| ------------ | ----- | --------------------- |
| Vercel (Web) | Hobby | Free                  |
| Vercel (API) | Hobby | Free                  |
| Neon         | Free  | Free (0.5 GB storage) |
| **Total**    |       | **Free**              |

---

## Next Steps

1. Set up custom domain on Vercel
2. Configure Vercel Analytics for monitoring
3. Set up Vercel Cron Jobs for scheduled tasks (if needed)
4. Configure backup strategy for Neon database
