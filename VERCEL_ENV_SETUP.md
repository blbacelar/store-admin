# Quick Reference: Vercel Environment Variables

To deploy your Amazon Automator with MongoDB, you need to set the following environment variables in Vercel.

## 1. DATABASE_URL
**Description**: Your MongoDB connection string.
**Format**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

**Where to find it**: 
1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Copy the connection string and replace `<password>` with your database user password.

## How to Add in Vercel

1. Go to: https://vercel.com/[your-username]/[your-project]/settings/environment-variables
2. Click "Add New"
3. Enter:
   - **Key**: `DATABASE_URL`
   - **Value**: (your connection string)
   - **Environment**: Select all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your application
