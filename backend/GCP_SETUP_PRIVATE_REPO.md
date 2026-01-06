# 🚀 GCP Setup for Private GitHub Repository

## Prerequisites

You'll need a **GitHub Personal Access Token** to clone your private repo on the VM.

### Create GitHub Personal Access Token (1 minute)

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `GCP VM Oracle Service`
4. Set expiration: `90 days` (or longer)
5. Select scopes: **`repo`** (Full control of private repositories)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN** - you won't see it again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step-by-Step Setup on GCP VM

### 1. Create VM in GCP Console

```
Name: arcsettle-oracle-service
Machine Type: e2-micro
OS: Ubuntu 22.04 LTS
Disk: 10 GB
→ CREATE
```

### 2. Click "SSH" to Connect

Once VM is running, click the **SSH** button. A terminal will open.

### 3. Run These Commands

Copy and paste these commands **one section at a time**:

#### Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x
```

#### Install PM2 Process Manager
```bash
sudo npm install -g pm2
pm2 --version
```

#### Install Git
```bash
sudo apt-get install -y git
```

#### Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

#### Clone Your Private Repository
```bash
cd ~

# Replace YOUR_GITHUB_TOKEN with the token you created above
git clone https://YOUR_GITHUB_TOKEN@github.com/abdulqadirsagir/arcsettle.git arcsettle-oracle

# Example (DON'T USE THIS - use your actual token):
# git clone https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/abdulqadirsagir/arcsettle.git arcsettle-oracle
```

**⚠️ IMPORTANT:** Replace `YOUR_GITHUB_TOKEN` with your actual token from step 1!

#### Navigate and Install Dependencies
```bash
cd arcsettle-oracle/backend
npm install
```

This will take 1-2 minutes to install all packages.

### 4. Create .env File

```bash
nano .env
```

Paste your environment variables:

```env
ARC_RPC_URL=https://rpc-testnet.arcscan.net
ORACLE_PRIVATE_KEY=your_actual_private_key
ORACLE_ADDRESS=your_actual_oracle_contract_address
SUPABASE_URL=your_actual_supabase_url
SUPABASE_SECRET_KEY=your_actual_supabase_secret
COINGECKO_API_KEY=your_coingecko_key_if_you_have_one
BETTING_ENGINE_ADDRESS=your_betting_engine_address
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### 5. Test the Service (Optional but Recommended)

```bash
node oracle-service.js
```

**Look for:**
- ✅ "Oracle Service started successfully"
- ✅ "Fetched prices: BTC: $93000..."
- ✅ "Successfully updated on-chain oracle"

If you see errors, **STOP** and check your .env values.

Press `Ctrl + C` to stop the test.

### 6. Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the service
pm2 start oracle-service.config.js

# Check status
pm2 status
```

**Should show:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ mode    │ ↺       │ status   │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ arcsettle-oracle     │ fork    │ 0       │ online   │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

### 7. View Live Logs

```bash
pm2 logs arcsettle-oracle
```

You should see price updates every 5 minutes.

Press `Ctrl + C` to exit logs (service keeps running).

### 8. Configure Auto-Start on Boot

```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# IMPORTANT: Copy and run the command it outputs
# It will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u USERNAME --hp /home/USERNAME
```

**Copy the `sudo env...` command from the output and run it.**

### 9. Verify Everything

```bash
# Check PM2 status
pm2 status

# Check recent logs
pm2 logs arcsettle-oracle --lines 20
```

### 10. Check Your Frontend

Wait 5-10 minutes, then:
1. Go to your Vercel frontend
2. Check if price timestamps are updating
3. Should show current time instead of "1:08:15 PM"

---

## ✅ You're Done!

Your oracle service is now:
- ✅ Running 24/7
- ✅ Updating prices every 5 minutes
- ✅ Auto-restarts on crashes
- ✅ Survives VM reboots

---

## 📊 Useful Commands

```bash
# SSH back into VM anytime
gcloud compute ssh arcsettle-oracle-service --zone=us-central1-a

# Check service status
pm2 status

# View live logs
pm2 logs arcsettle-oracle

# Restart service
pm2 restart arcsettle-oracle

# Stop service
pm2 stop arcsettle-oracle

# Update code from GitHub
cd ~/arcsettle-oracle/backend
git pull
npm install
pm2 restart arcsettle-oracle
```

---

## 🚨 Troubleshooting

### Can't Clone Repository
```bash
# Error: Repository not found
# → Check your GitHub token has 'repo' scope
# → Make sure token hasn't expired
# → Verify the repository URL is correct
```

### Service Won't Start
```bash
# Check error logs
pm2 logs arcsettle-oracle --err

# Common issues:
# 1. Wrong .env values
# 2. Missing dependencies - run: npm install
# 3. Network issues
```

### Prices Not Updating
```bash
# Check if service is running
pm2 status  # Should show "online"

# Check recent logs
pm2 logs arcsettle-oracle --lines 50

# Verify cron is working (should see updates every 5 min)
```

---

## 🔐 Security Note

Your GitHub token is now in the Git config on the VM. For better security:

```bash
# After first clone, you can remove credentials from Git config
cd ~/arcsettle-oracle
git remote set-url origin https://github.com/abdulqadirsagir/arcsettle.git

# For future updates, you'll need to authenticate again
# Or use SSH keys (more secure, but more setup)
```

---

## 💰 Cost

- **e2-micro VM**: $0/month (Free Tier) or ~$8/month
- **Network egress**: Usually <$1/month
- **Total**: ~$0-9/month

---

## Need Help?

1. Check PM2 logs: `pm2 logs arcsettle-oracle --err`
2. Verify .env file: `cat .env`
3. Test RPC connection: `curl https://rpc-testnet.arcscan.net`
4. Check if service is running: `pm2 status`
