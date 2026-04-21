# Deploying to Vercel

This guide will help you deploy the Store Automator to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A MongoDB connection string
3. Your application secrets for NextAuth

## Step-by-Step Deployment

### 1. Prepare Your Configuration

Confirm the application works locally with the same core variables you plan to use in Vercel:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `blbacelar/store-automator`
3. Configure your project settings
4. Click "Deploy"

### 3. Configure Environment Variables

After deployment, add the following environment variables in your Vercel project settings:

1. Go to your project dashboard on Vercel
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:

**DATABASE_URL**
- Value: Your MongoDB connection string
- Example: `mongodb+srv://user:password@cluster.mongodb.net/store-admin?retryWrites=true&w=majority`

**NEXTAUTH_SECRET**
- Value: A long random secret used to sign sessions
- Example: generate with `openssl rand -base64 32`

**NEXTAUTH_URL**
- Value: The full public URL of the deployed app
- Example: `https://your-project.vercel.app`

### 4. Redeploy

After adding the environment variables:
1. Go to the **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache"
5. Click **Redeploy**

## Important Notes

### Authentication

This project currently uses email/password authentication through NextAuth credentials provider. There is no active Google login or Google Sheets service-account dependency in the runtime path.

### Puppeteer on Vercel

Vercel has some limitations with Puppeteer:
- **Serverless Function Timeout**: Free tier has a 10-second timeout
- **Memory Limits**: May need to upgrade for heavy scraping

If you encounter issues with Puppeteer, consider:
1. Upgrading to Vercel Pro for longer timeouts
2. Using a headless browser service like Browserless.io
3. Moving scraping to a separate service

### Testing Your Deployment

1. Visit your Vercel URL
2. Sign in with a valid user account
3. Try adding a product
4. Test edit, archive, and delete flows

## Troubleshooting

### Missing environment variables
- Make sure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are configured in Vercel
- Redeploy after changing environment variables

### Database connection issues
- Verify `DATABASE_URL` points to the correct MongoDB cluster
- Confirm the Vercel deployment IPs are allowed by your database provider if network restrictions are enabled

### Puppeteer Timeout
- Consider using a lighter scraping method
- Upgrade to Vercel Pro for longer timeouts
- Use an external scraping service

## Local Development

For local development, use a local `.env.local` file with the same three required variables used in production.

## Security Best Practices

- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel's environment variables for production
- ✅ Rotate `NEXTAUTH_SECRET` only with a planned session reset
- ✅ Use separate database credentials for development and production when practical
