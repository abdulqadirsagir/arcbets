#!/bin/bash
# GCP VM Setup Script for Oracle Service
# Run this script on your GCP VM after initial setup

set -e

echo "=========================================="
echo "Oracle Service GCP VM Setup"
echo "=========================================="
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x (LTS)
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally (process manager)
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create app directory
echo "📁 Creating application directory..."
mkdir -p ~/arcsettle-oracle
cd ~/arcsettle-oracle

# Setup is complete!
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository (see GCP_SETUP_PRIVATE_REPO.md)"
echo "2. Navigate to backend: cd ~/arcsettle-oracle/backend"
echo "3. Install dependencies: npm install"
echo "4. Create .env file with your credentials"
echo "5. Start service with PM2"
echo ""
echo "See backend/GCP_SETUP_PRIVATE_REPO.md for detailed instructions"
echo "=========================================="
