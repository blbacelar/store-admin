# Quick Reference: Vercel Environment Variables

Copy these values from your `credentials.json` file to Vercel:

## 1. SPREADSHEET_ID
**Where to find it**: In your Google Sheets URL
```
https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SPREADSHEET_ID]/edit
```

## 2. GOOGLE_SERVICE_ACCOUNT_EMAIL
**Where to find it**: In `credentials.json` → `client_email`
```json
{
  "client_email": "your-service-account@project-id.iam.gserviceaccount.com"
}
```

## 3. GOOGLE_PRIVATE_KEY
**Where to find it**: In `credentials.json` → `private_key`

**⚠️ IMPORTANT**: 
- Copy the ENTIRE key including headers
- Keep the `\n` characters (don't replace with actual line breaks)
- It should look like this:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...(many more characters)...abc123\n-----END PRIVATE KEY-----\n
```

## How to Add in Vercel

1. Go to: https://vercel.com/[your-username]/[your-project]/settings/environment-variables
2. Click "Add New"
3. For each variable:
   - Name: (variable name from above)
   - Value: (paste the value)
   - Environment: Select all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your application

## Verification

After setting variables, you can verify them in your Vercel deployment logs:
- The app will log "Using environment variables for Google auth" if successful
- Or "Using credentials.json for Google auth" if falling back to local file
