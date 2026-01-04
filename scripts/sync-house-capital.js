/**
 * Sync House Capital Tracking
 * 
 * This script syncs the house vault's actual USDC balance with its tracked capital.
 * 
 * USE CASE:
 * When you send USDC directly to the house vault address (0x4C049aE19D73736c3115C02e0a7C841ca60566a1),
 * the balance arrives but isn't tracked internally. Run this script to sync it.
 * 
 * USAGE:
 * npx hardhat run scripts/sync-house-capital.js --network arc-testnet
 * 
 * WHAT IT DOES:
 * 1. Checks actual USDC balance in house vault
 * 2. Checks tracked capital in contract state
 * 3. If there's a difference, deposits it to sync tracking
 * 4. Updates frontend display automatically
 */
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("═".repeat(70));
  console.log("⚠️  WARNING: This script is for V1 contracts only!");
  console.log("⚠️  V2 uses Treasury model - no house vault!");
  console.log("⚠️  See CURRENT_V2_ADDRESSES.md for V2 contracts");
  console.log("═".repeat(70));
  console.log("🏦 HOUSE CAPITAL SYNC TOOL (V1)");
  console.log("═".repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📍 Operator:", deployer.address);
  
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Operator Balance:", hre.ethers.formatEther(deployerBalance), "USDC");

  const houseVaultAddress = process.env.HOUSE_VAULT_ADDRESS;
  if (!houseVaultAddress) {
    console.error("❌ HOUSE_VAULT_ADDRESS not found in .env file!");
    process.exit(1);
  }
  
  console.log("🏦 House Vault:", houseVaultAddress);

  // Get the vault contract
  const HouseRiskVault = await hre.ethers.getContractFactory("HouseRiskVault");
  const vault = HouseRiskVault.attach(houseVaultAddress);

  console.log("\n" + "─".repeat(70));
  console.log("📊 CHECKING CURRENT STATE...");
  console.log("─".repeat(70));

  // Get actual balance
  const nativeBalance = await hre.ethers.provider.getBalance(houseVaultAddress);
  console.log("\n✓ Actual USDC in Vault:", hre.ethers.formatEther(nativeBalance), "USDC");
  
  // Get tracked capital
  const trackedCapital = await vault.houseCapitalUSDC();
  console.log("✓ Tracked Capital:     ", hre.ethers.formatEther(trackedCapital), "USDC");
  
  // Calculate difference
  const difference = nativeBalance - trackedCapital;
  console.log("\n" + "═".repeat(70));
  
  if (difference > 0n) {
    console.log("⚠️  MISMATCH DETECTED!");
    console.log("═".repeat(70));
    console.log("\n🔧 Untracked USDC Found:", hre.ethers.formatEther(difference), "USDC");
    console.log("\n💡 This happens when USDC is sent directly to the vault address");
    console.log("   without calling depositHouseCapital() function.");
    
    console.log("\n" + "─".repeat(70));
    console.log("🚀 SYNCING NOW...");
    console.log("─".repeat(70));
    
    console.log("\n⏳ Depositing", hre.ethers.formatEther(difference), "USDC to sync tracking...");
    
    try {
      // Use the new syncCapitalTracking function (no USDC transfer needed)
      const tx = await vault.syncCapitalTracking();
      console.log("📝 Transaction Hash:", tx.hash);
      console.log("🔗 View on Explorer: https://testnet.arcscan.app/tx/" + tx.hash);
      
      console.log("\n⏳ Waiting for confirmation...");
      await tx.wait();
      console.log("✅ Transaction Confirmed!");

      // Verify the sync
      const newTrackedCapital = await vault.houseCapitalUSDC();
      const newNativeBalance = await hre.ethers.provider.getBalance(houseVaultAddress);
      
      console.log("\n" + "═".repeat(70));
      console.log("✅ SYNC COMPLETE!");
      console.log("═".repeat(70));
      console.log("\n📊 Updated State:");
      console.log("   Actual Balance:  ", hre.ethers.formatEther(newNativeBalance), "USDC");
      console.log("   Tracked Capital: ", hre.ethers.formatEther(newTrackedCapital), "USDC");
      console.log("   Status:          ", newNativeBalance === newTrackedCapital ? "✅ IN SYNC" : "❌ STILL OUT OF SYNC");
      
      console.log("\n💡 Frontend will now show the correct house capital!");
      
    } catch (error) {
      console.error("\n❌ Error during sync:", error.message);
      
      if (error.message.includes("insufficient funds")) {
        console.log("\n💡 TIP: Add USDC to your operator wallet for gas fees");
        console.log("   Operator address:", deployer.address);
      }
      
      process.exit(1);
    }
    
  } else if (difference < 0n) {
    console.log("⚠️  WARNING: Tracked capital exceeds actual balance!");
    console.log("═".repeat(70));
    console.log("\nTracked Capital:", hre.ethers.formatEther(trackedCapital), "USDC");
    console.log("Actual Balance: ", hre.ethers.formatEther(nativeBalance), "USDC");
    console.log("Deficit:        ", hre.ethers.formatEther(-difference), "USDC");
    console.log("\n⚠️  This indicates USDC was withdrawn without proper accounting.");
    console.log("   Manual investigation required!");
    
  } else {
    console.log("✅ PERFECT SYNC!");
    console.log("═".repeat(70));
    console.log("\n🎉 House capital is already in sync!");
    console.log("   Balance:", hre.ethers.formatEther(nativeBalance), "USDC");
    console.log("\n💡 No action needed. Frontend shows correct values.");
  }
  
  console.log("\n" + "═".repeat(70));
  console.log("📋 QUICK REFERENCE");
  console.log("═".repeat(70));
  console.log("\n💰 To add more house capital:");
  console.log("   1. Send USDC to:", houseVaultAddress);
  console.log("   2. Run this script: npx hardhat run scripts/sync-house-capital.js --network arc-testnet");
  console.log("\n✨ Done!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
