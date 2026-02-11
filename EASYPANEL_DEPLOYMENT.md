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
