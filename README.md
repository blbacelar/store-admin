# Store Product Automator

A local Admin Dashboard to manage products in a Google Sheet.

## Features
- **Scrape Product**: Paste a URL to automatically fetch Title, Price, and Image.
- **Google Sheets Integration**: Add and Delete products directly from the dashboard.
- **Premium UI**: Dark mode, glassmorphism, and responsive design.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Google Credentials**:
   - Place your Service Account key file named `credentials.json` in the root directory.
   - Share your Google Sheet with the email inside `credentials.json`.

3. **Environment Config**:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your Sheet ID to `.env.local`.

4. **Run**:
   ```bash
   npm run dev
   ```

## Tech Stack
- Next.js 14+
- Puppeteer
- Google APIs
- Vanilla CSS (Premium Design)
