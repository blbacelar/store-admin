# Deploying to Vercel

This guide will help you deploy the Amazon Product Automator to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your Google Service Account credentials from `credentials.json`
3. Your Google Sheets ID

## Step-by-Step Deployment

### 1. Prepare Your Credentials

Open your `credentials.json` file and extract the following values:
- `client_email` → This will be `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → This will be `GOOGLE_PRIVATE_KEY`

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
2. Import your GitHub repository: `blbacelar/amazon-scraper`
3. Configure your project settings
4. Click "Deploy"

### 3. Configure Environment Variables

After deployment, add the following environment variables in your Vercel project settings:

1. Go to your project dashboard on Vercel
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:

**SPREADSHEET_ID**
- Value: Your Google Sheets ID (from the URL)
- Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

**GOOGLE_SERVICE_ACCOUNT_EMAIL**
- Value: The `client_email` from your `credentials.json`
- Example: `my-service-account@project-id.iam.gserviceaccount.com`

**GOOGLE_PRIVATE_KEY**
- Value: The `private_key` from your `credentials.json`
- **Important**: Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **Important**: Keep the `\n` characters as-is (don't replace them with actual line breaks)
- Example:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
  ```

### 4. Redeploy

After adding the environment variables:
1. Go to the **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache"
5. Click **Redeploy**

## Important Notes

### Google Sheets Permissions

Make sure your Google Sheet is shared with the service account email:
1. Open your Google Sheet
2. Click **Share**
3. Add the service account email (from `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
4. Give it **Editor** permissions

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
2. Try adding a product
3. Check if it appears in your Google Sheet
4. Test the archive and delete functionality

## Troubleshooting

### "No Google credentials found" Error
- Make sure all environment variables are set correctly
- Check that `GOOGLE_PRIVATE_KEY` includes the full key with headers
- Verify the `\n` characters are preserved (not converted to actual line breaks)

### "Permission denied" Error
- Ensure the Google Sheet is shared with the service account email
- Verify the service account has Editor permissions

### Puppeteer Timeout
- Consider using a lighter scraping method
- Upgrade to Vercel Pro for longer timeouts
- Use an external scraping service

## Local Development

For local development, you can continue using `credentials.json`:
1. Keep `credentials.json` in your project root
2. Make sure it's in `.gitignore`
3. The app will automatically use it if environment variables are not set

## Security Best Practices

- ✅ Never commit `credentials.json` to Git
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel's environment variables for production
- ✅ Rotate your service account keys periodically
- ✅ Use different service accounts for dev/prod if possible
