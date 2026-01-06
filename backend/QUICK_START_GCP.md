# 🚀 Quick Start: Deploy Oracle Service to GCP

## TL;DR - 10 Minute Setup

### 1. Create VM (5 minutes)
```
GCP Console → Compute Engine → Create Instance
- Name: arcsettle-oracle-service
- Type: e2-micro (Free tier eligible)
- OS: Ubuntu 22.04 LTS
- Disk: 10 GB
→ CREATE
```

### 2. Connect & Setup (5 minutes)
```bash
# Click SSH button in GCP Console, then run:

# Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
cd ~
git clone YOUR_GITHUB_REPO_URL arcsettle-oracle
cd arcsettle-oracle/backend
npm install

# Create .env file (paste your credentials)
nano .env

# Start service
pm2 start oracle-service.config.js
pm2 save
pm2 startup  # Run the command it outputs

# Check it's working
pm2 logs
```

### 3. Verify (1 minute)
- Check logs show "Successfully updated on-chain oracle"
- Check frontend - prices should update in 5-10 minutes
- Check Supabase - new records in price_history table

**Done! Service now runs 24/7 automatically.**

---

## Need Full Details?
See [GCP_DEPLOYMENT_GUIDE.md](../GCP_DEPLOYMENT_GUIDE.md) for comprehensive step-by-step instructions with screenshots and troubleshooting.

## Quick Commands

```bash
# View status
pm2 status

# View logs
pm2 logs arcsettle-oracle

# Restart
pm2 restart arcsettle-oracle

# Update code
cd ~/arcsettle-oracle/backend
git pull
npm install
pm2 restart arcsettle-oracle
```

## Cost
- **Free Tier**: $0/month (e2-micro in eligible regions)
- **Non-Free Tier**: ~$8/month

## Support
Check logs first: `pm2 logs arcsettle-oracle --err`
