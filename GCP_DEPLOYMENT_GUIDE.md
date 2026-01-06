# 🚀 Google Cloud Platform Deployment Guide for Oracle Service

This guide will help you deploy the ArcSettle Oracle Service to a Google Cloud Platform VM.

## 📋 Prerequisites

- Google Cloud Platform account
- Access to your GitHub repository
- Environment variables ready (from `.env` file)
- GCP Project created

---

## 🎯 Step 1: Create a GCP VM Instance

### 1.1 Navigate to Compute Engine

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **Compute Engine** → **VM Instances**
4. Click **"CREATE INSTANCE"**

### 1.2 Configure VM Settings

**Basic Configuration:**
```
Name: arcsettle-oracle-service
Region: us-central1 (or your preferred region close to users)
Zone: us-central1-a (or any zone in your region)
```

**Machine Configuration:**
```
Series: E2
Machine Type: e2-micro (0.25-1 vCPU, 1 GB memory)
  
  ⚠️ NOTE: e2-micro is eligible for GCP Free Tier
  - Perfect for oracle service (very low resource usage)
  - Costs ~$7-8/month if not on free tier
  - Can upgrade later if needed
```

**Boot Disk:**
```
Operating System: Ubuntu
Version: Ubuntu 22.04 LTS
Boot disk type: Standard persistent disk
Size: 10 GB (minimum, sufficient for oracle service)
```

**Firewall:**
```
☐ Allow HTTP traffic (not needed)
☐ Allow HTTPS traffic (not needed)

Note: Oracle service only makes OUTBOUND connections
      No inbound ports needed
```

**Advanced Options → Networking:**
- Leave as default (Ephemeral external IP is fine)
- Later we can reserve a static IP if needed

### 1.3 Create the Instance

1. Click **"CREATE"** at the bottom
2. Wait 30-60 seconds for VM to boot up
3. You'll see a green checkmark when ready

---

## 🔐 Step 2: Connect to Your VM

### Option A: Using Browser SSH (Easiest)

1. In the VM Instances list, click **"SSH"** button next to your VM
2. A browser window will open with a terminal
3. ✅ You're now connected!

### Option B: Using gcloud CLI (Advanced)

```bash
gcloud compute ssh arcsettle-oracle-service --zone=us-central1-a
```

---

## ⚙️ Step 3: Set Up the VM Environment

### 3.1 Run the Automated Setup Script

Once connected via SSH, run these commands:

```bash
# Download the setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/backend/setup-gcp-vm.sh

# Make it executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

**What this script does:**
- Updates Ubuntu packages
- Installs Node.js 20.x LTS
- Installs PM2 (process manager)
- Installs Git
- Creates application directory

### 3.2 Clone Your Repository

```bash
# Navigate to app directory
cd ~/arcsettle-oracle

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Navigate to backend
cd backend

# Install dependencies
npm install
```

---

## 🔑 Step 4: Configure Environment Variables

### 4.1 Create .env File

```bash
# Create .env file
nano .env
```

### 4.2 Add Your Configuration

Paste your environment variables (you should have these from local development):

```env
# Arc Testnet Configuration
ARC_RPC_URL=https://rpc-testnet.arcscan.net
ORACLE_PRIVATE_KEY=your_private_key_here
ORACLE_ADDRESS=your_deployed_oracle_contract_address

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

# CoinGecko API (optional, but recommended for higher rate limits)
COINGECKO_API_KEY=your_coingecko_api_key

# Optional: Add these if not in code
BETTING_ENGINE_ADDRESS=your_betting_engine_address
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- Keep the private key secure (never commit to Git)
- The VM will use these for updates

### 4.3 Save and Exit

- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### 4.4 Verify .env File

```bash
# Check file exists and has content
ls -lah .env
cat .env
```

---

## 🚀 Step 5: Start the Oracle Service with PM2

### 5.1 Create Logs Directory

```bash
mkdir -p ~/arcsettle-oracle/backend/logs
```

### 5.2 Test the Service First (Optional but Recommended)

```bash
# Run once manually to verify everything works
node oracle-service.js
```

**What to look for:**
- ✅ "Oracle Service started successfully"
- ✅ "Fetched prices: BTC: $XXXXX, ETH: $XXXX, SOL: $XXX"
- ✅ "Updated Supabase with X price records"
- ✅ "Successfully updated on-chain oracle"

If you see errors, stop here and troubleshoot before proceeding.

Press `Ctrl + C` to stop the test run.

### 5.3 Start with PM2

```bash
# Start the service with PM2
pm2 start oracle-service.config.js

# Check status
pm2 status

# View logs
pm2 logs arcsettle-oracle
```

**Expected Output:**
```
┌─────┬────────────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ mode        │ ↺       │ status  │ cpu      │
├─────┼────────────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ arcsettle-oracle       │ fork        │ 0       │ online  │ 0%       │
└─────┴────────────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### 5.4 Configure PM2 to Start on Boot

```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# You'll get a command to run with sudo - copy and run it
# It will look something like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u USERNAME --hp /home/USERNAME
```

This ensures the oracle service automatically starts if the VM reboots.

---

## 📊 Step 6: Monitor the Service

### 6.1 PM2 Monitoring Commands

```bash
# Check service status
pm2 status

# View live logs
pm2 logs arcsettle-oracle

# View last 100 lines of logs
pm2 logs arcsettle-oracle --lines 100

# Monitor CPU and memory
pm2 monit

# View detailed info
pm2 info arcsettle-oracle
```

### 6.2 Check Price Updates on Frontend

1. Wait 5-10 minutes
2. Go to your Vercel frontend
3. Check if prices are updating
4. Timestamps should show current time

### 6.3 Check Supabase Database

1. Go to Supabase dashboard
2. Navigate to Table Editor → `price_history`
3. You should see new records every 5 minutes

---

## 🛠️ Step 7: Useful PM2 Commands

### Service Control

```bash
# Restart service
pm2 restart arcsettle-oracle

# Stop service
pm2 stop arcsettle-oracle

# Delete from PM2
pm2 delete arcsettle-oracle

# Restart all PM2 processes
pm2 restart all
```

### Log Management

```bash
# Clear logs
pm2 flush

# Rotate logs (if they get too big)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Update Code

```bash
cd ~/arcsettle-oracle/backend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart service
pm2 restart arcsettle-oracle
```

---

## 🔒 Step 8: Security Best Practices

### 8.1 Set Up Firewall (Optional)

```bash
# Install ufw
sudo apt-get install ufw

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 8.2 Secure Your Private Key

```bash
# Restrict .env file permissions
chmod 600 ~/arcsettle-oracle/backend/.env

# Only owner can read/write
ls -l ~/arcsettle-oracle/backend/.env
```

### 8.3 Keep System Updated

```bash
# Update packages regularly
sudo apt-get update
sudo apt-get upgrade -y

# Reboot if kernel was updated
sudo reboot
```

---

## 💰 Step 9: Cost Optimization

### GCP Free Tier

- **e2-micro** VM is eligible for free tier:
  - 1 non-preemptible e2-micro VM per month
  - 30 GB standard persistent disk
  - Limited to certain regions (us-west1, us-central1, us-east1)

### If Not on Free Tier

- **e2-micro cost**: ~$7-8/month
- **Egress (network)**: Usually under $1/month for oracle service
- **Total**: ~$8-9/month

### Additional Cost Savings

```bash
# Create a startup script to shutdown during maintenance windows
# (Advanced - only if you want to save costs during known downtime)
```

---

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check logs
pm2 logs arcsettle-oracle --err

# Common issues:
# 1. Wrong .env values - verify each one
# 2. Missing dependencies - run npm install
# 3. Network issues - check internet connection
```

### Prices Not Updating

```bash
# Check if service is running
pm2 status

# Check recent logs
pm2 logs arcsettle-oracle --lines 50

# Verify cron is working
# Should see "Fetching prices..." every 5 minutes
```

### Out of Memory

```bash
# Check memory usage
free -h

# If needed, add swap space
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### RPC Errors

```bash
# If you see "RPC error" in logs:
# 1. Check ARC_RPC_URL is correct
# 2. Verify network is accessible
# 3. Check if Arc testnet is online

# Test RPC endpoint
curl -X POST $ARC_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📈 Step 10: Optional Enhancements

### 10.1 Set Up Monitoring Alerts

Use GCP Cloud Monitoring to get alerts when VM goes down:

1. Go to **Monitoring** in GCP Console
2. Create alert policy for VM uptime
3. Add your email for notifications

### 10.2 Reserve Static IP (Optional)

```bash
# In GCP Console:
# VPC Network → External IP Addresses → Reserve Static Address
# Then assign to your VM
```

### 10.3 Set Up Automated Backups

```bash
# Schedule daily snapshots of your VM disk
# In GCP Console:
# Compute Engine → Snapshots → Create Snapshot Schedule
```

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] VM is running in GCP Console
- [ ] Can SSH into VM successfully
- [ ] Node.js and PM2 are installed
- [ ] Repository is cloned
- [ ] .env file is configured correctly
- [ ] `npm install` completed without errors
- [ ] Service runs manually with `node oracle-service.js`
- [ ] PM2 shows service as "online"
- [ ] PM2 startup is configured (survives reboot)
- [ ] Logs show successful price fetching
- [ ] Supabase shows new price records
- [ ] Frontend displays updated timestamps
- [ ] Prices update every 5 minutes

---

## 📞 Getting Help

If you encounter issues:

1. Check PM2 logs: `pm2 logs arcsettle-oracle --err`
2. Verify .env variables are correct
3. Test RPC connection manually
4. Check Supabase credentials
5. Verify VM has internet access

---

## 🎉 Success!

Once everything is set up, your oracle service will:

✅ Run 24/7 automatically
✅ Update prices every 5 minutes
✅ Restart automatically if it crashes
✅ Survive VM reboots
✅ Keep your betting platform functional

**Estimated Setup Time:** 20-30 minutes
**Monthly Cost:** $0 (with free tier) or ~$8-9/month

---

## Quick Reference Commands

```bash
# SSH into VM
gcloud compute ssh arcsettle-oracle-service --zone=us-central1-a

# Check service status
pm2 status

# View logs
pm2 logs arcsettle-oracle

# Restart service
pm2 restart arcsettle-oracle

# Update code
cd ~/arcsettle-oracle/backend && git pull && npm install && pm2 restart arcsettle-oracle

# Check VM resource usage
htop  # or: top
```

---

**Need to make changes to the oracle service code?**

1. Make changes in your local repository
2. Commit and push to GitHub
3. SSH into VM
4. Run: `cd ~/arcsettle-oracle/backend && git pull && pm2 restart arcsettle-oracle`

That's it! Your prices will now update continuously 24/7. 🚀
