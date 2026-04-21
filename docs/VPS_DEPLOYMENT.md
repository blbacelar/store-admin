# VPS Deployment Guide for Amazon Scraper

This guide will help you deploy the Amazon scraper on a VPS (Virtual Private Server) to bypass serverless limitations and improve bot detection evasion.

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- At least 2GB RAM, 2 CPU cores recommended
- Domain name (optional but recommended)

## Step 1: Initial VPS Setup

### Connect to your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
```

### Install Chrome dependencies for Puppeteer
```bash
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## Step 2: Clone and Setup Application

### Clone your repository
```bash
cd /var/www
sudo git clone https://github.com/blbacelar/store-admin.git amazon-scraper
cd amazon-scraper
sudo chown -R $USER:$USER /var/www/amazon-scraper
```

### Install dependencies
```bash
npm install
```

### Setup environment variables
```bash
cp .env.example .env
nano .env
```

Add your environment variables:
```env
DATABASE_URL="your-mongodb-connection-string"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://your-vps-ip:3000"
NODE_ENV="production"

# Add any other required variables
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Build the application
```bash
npm run build
```

## Step 3: Configure Puppeteer for VPS

Since you're on a VPS, you can use the stealth plugin! Update your `browserPool.ts` to always use stealth:

```typescript
// In src/app/lib/browserPool.ts
// Remove the NODE_ENV check and always use puppeteer-extra with stealth
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

// Use puppeteerExtra.launch() for all environments
```

## Step 4: Start Application with PM2

### Start the application
```bash
pm2 start npm --name "amazon-scraper" -- start
```

### Save PM2 configuration
```bash
pm2 save
pm2 startup
# Follow the instructions from the output
```

### Monitor the application
```bash
pm2 logs amazon-scraper  # View logs
pm2 status              # Check status
pm2 restart amazon-scraper  # Restart app
```

## Step 5: Setup Nginx Reverse Proxy (Optional but Recommended)

### Install Nginx
```bash
sudo apt install -y nginx
```

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/amazon-scraper
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your VPS IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/amazon-scraper /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 6: Setup SSL with Let's Encrypt (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 7: Enable Stealth Plugin on VPS

Since you're not in a serverless environment, update `browserPool.ts`:

```typescript
import { Browser, Page } from 'puppeteer';
import { logger } from './logger';

// Always use stealth plugin on VPS
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

class BrowserPool {
    // ... existing code ...
    
    async getBrowser(): Promise<Browser> {
        // ... existing initialization code ...
        
        try {
            logger.debug('Launching browser with stealth plugin on VPS');
            
            this.browser = await puppeteerExtra.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                ],
            });
            
            // ... rest of code ...
        }
    }
}
```

## Step 8: Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Maintenance Commands

### View logs
```bash
pm2 logs amazon-scraper
pm2 logs amazon-scraper --lines 100  # Last 100 lines
```

### Restart application
```bash
pm2 restart amazon-scraper
```

### Update application
```bash
cd /var/www/amazon-scraper
git pull origin main
npm install
npm run build
pm2 restart amazon-scraper
```

### Monitor resources
```bash
pm2 monit
htop  # Install with: sudo apt install htop
```

## Troubleshooting

### Chrome/Puppeteer issues
If you get Chrome errors, install additional dependencies:
```bash
sudo apt install -y chromium-browser
```

### Memory issues
Increase swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Port already in use
```bash
sudo lsof -i :3000  # Find process using port 3000
pm2 delete amazon-scraper
pm2 start npm --name "amazon-scraper" -- start
```

## Performance Optimization

### Enable PM2 cluster mode
```bash
pm2 delete amazon-scraper
pm2 start npm --name "amazon-scraper" -i max -- start
```

### Configure log rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Security Best Practices

1. **Use a non-root user** for running the application
2. **Enable firewall** (UFW) and only open necessary ports
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Use environment variables** for sensitive data
5. **Enable SSL/HTTPS** with Let's Encrypt
6. **Regular backups** of your database and configuration

## Next Steps

After deployment:
1. Test the scraper with Amazon URLs
2. Monitor logs for any errors
3. Set up monitoring/alerting (optional: use services like UptimeRobot)
4. Configure automatic backups

## Benefits of VPS Deployment

✅ Full control over browser configuration
✅ Can use stealth plugin without build issues
✅ Better for handling bot detection
✅ More stable than serverless for scraping
✅ Can add proxy rotation if needed
✅ Persistent browser sessions possible
