# Quick Reference: Vercel Environment Variables

To deploy the app, set these environment variables in Vercel.

## 1. DATABASE_URL
**Description**: Your MongoDB connection string.
**Format**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

**Where to find it**:
1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Copy the connection string and replace `<password>` with your database user password.

## 2. NEXTAUTH_SECRET
**Description**: Secret used to sign and verify NextAuth sessions.
**Suggested generation**:
```bash
openssl rand -base64 32
```

## 3. NEXTAUTH_URL
**Description**: Public base URL of your deployed app.
**Example**: `https://your-project.vercel.app`

## How to Add in Vercel

1. Go to: https://vercel.com/[your-username]/[your-project]/settings/environment-variables
2. Click "Add New"
3. Add `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`
4. Set each one for Production, Preview, and Development as needed
5. Redeploy your application after saving changes
