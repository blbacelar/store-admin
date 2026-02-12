# EasyPanel Deployment Guide

EasyPanel is a great tool that runs on top of Docker. It makes deploying applications very easy.

## 1. Prepare Your Project

Ensure you have the following files in your project (I have already created them for you):
- `Dockerfile`: Instructions for EasyPanel to build your app with Chrome dependencies.
- `src/app/lib/browserPool.ts`: Updated to support VPS mode.

## 2. Push Your Code

Push your code to GitHub (or your Git provider).

```bash
git add .
git commit -m "Add Dockerfile and VPS config"
git push
```

## 3. Configure EasyPanel

1.  Login to your **EasyPanel**.
2.  Create a **New Project** (e.g., `amazon-scraper`).
3.  Click **+ Service** -> **App**.
4.  **Source**:
    - Select your GitHub Repository: `blbacelar/store-admin`.
    - Branch: `main` (or your working branch).
5.  **Build**:
    - EasyPanel should automatically detect the `Dockerfile`. If it asks for "Build Method", select **Docker**.
    - **Build Path**: Set this to `.` (a single dot).
    - **Dockerfile Path** (or just **File**): Set this to `Dockerfile`.
6.  **Environment Variables**:
    Go to the **Environment** tab and add the following:

    ```env
    DATABASE_URL=your-mongodb-connection-string
    NEXTAUTH_SECRET=your-secret-key
    NEXTAUTH_URL=https://your-app-domain.com
    NODE_ENV=production
    DEPLOYMENT_TYPE=vps
    ```

    > **Important**: `DEPLOYMENT_TYPE=vps` is critical. It tells the app to use the full Chrome browser instead of the serverless version.

7.  **Deploy**:
    - Click **Deploy**.
    - Watch the logs. It might take a few minutes to build the first time.

## 4. Verification

Once deployed, your app should be running at the domain EasyPanel assigns (or the one you configured).

### Troubleshooting
- **Logs**: Check the logs in EasyPanel.
- **Browser Issues**: If you see errors about "Shared libraries" or "Chrome not found", ensure `DEPLOYMENT_TYPE=vps` is set correctly.

## 5. How to Use the Scraper

Since your application is now running on your VPS, you can use it just like you would locally.

1.  **Open your App**: Go to `https://n8n-thelittlebigentrepreneur.3jpdfv.easypanel.host` (or your configured domain).
2.  **Login**: Sign in with your account.
3.  **Trigger Scrape**:
    - Navigate to the scraping section of your dashboard.
    - Enter an Amazon URL.
    - The request will be handled by your VPS using the "Stealth" browser mode.

### API Usage
You can also trigger it via API if you have an authenticated session:
```bash
curl -X POST https://your-domain.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://amazon.com/dp/B0..."}'
```

## 6. How to Use Your Custom Domain (GoDaddy)

To use `admin.thelittlebigentrepreneur.com`:

### Step A: Configure GoDaddy (DNS)
1.  Log in to your **GoDaddy** account.
2.  Go to **DNS Management** for `thelittlebigentrepreneur.com`.
3.  Add a new record:
    - **Type**: `A`
    - **Name**: `admin`
    - **Value**: `YOUR_VPS_IP_ADDRESS` (The same IP you use to SSH into your server).
    - **TTL**: Default (1 Hour).
4.  Save the record.

### Step B: Configure EasyPanel
1.  Go to your service (`thelittlebigentrepreneur`) in EasyPanel.
2.  Go to the **Domains** tab.
3.  Click **+ Add Domain**.
4.  Enter: `admin.thelittlebigentrepreneur.com`.
5.  Make sure the **Port** is set to `3000`.
6.  Enable **HTTPS** (EasyPanel will automatically get an SSL certificate).
7.  Click **Save**.

### Step C: Update NEXTAUTH_URL (Critical)
1.  Go to the **Environment** tab in EasyPanel.
2.  Find `NEXTAUTH_URL`.
3.  Change it to your new domain:
    ```env
    NEXTAUTH_URL=https://admin.thelittlebigentrepreneur.com
    ```
4.  Click **Save & Deploy**.

Wait a few minutes for the DNS to propagate and the SSL certificate to be issued. Then you can access your app at your new domain!

## 7. Update Google Cloud Auth (Required)

Since you changed your domain to `admin.thelittlebigentrepreneur.com`, you must update your Google Cloud Console to allow logins from this new URL.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services** > **Credentials**.
3.  Click on the **OAuth 2.0 Client ID** you created for this project.
4.  Update the following fields:

    **Authorized JavaScript origins:**
    - Add: `https://admin.thelittlebigentrepreneur.com`

    **Authorized redirect URIs:**
    - Add: `https://admin.thelittlebigentrepreneur.com/api/auth/callback/google`

5.  Click **Save**.

> **Note**: It may take 5-10 minutes for these changes to propagate. If you see a "redirect_uri_mismatch" error immediately, just wait a few minutes and try again.


## 8. Build Issues (Next.js 16 / Turbopack)

If you see an error about `Turbopack` not having a config:
1. I have removed the invalid `turbo` config from `next.config.ts`.
2. Next.js 16 might still complain. If it does, go to EasyPanel -> Environment and add:
   `NEXT_PRIVATE_TURBOPACK=false` 
   or modify `package.json` build script to `next build --webpack`.

But usually, just removing the invalid `turbo` key is enough.
