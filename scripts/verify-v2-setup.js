const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying V2 Setup...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Treasury/Deployer:", deployer.address);

  // V2 Contract addresses
  const ARCS_TOKEN_V2 = "0x7f326a2c29B8dF38E162AC99E63Bfa3d8860aF4e";
  const DEPOSIT_VAULT_V2 = "0x1412DA1926A1831D53B77Be8C841DAcf7C7E646C";
  const BETTING_ENGINE_V2 = "0x3E2D445b11D988Ac411a324a6b73A9A925f5D1AC";

  // Get contracts
  const arcsToken = await hre.ethers.getContractAt("ARCSTokenV2", ARCS_TOKEN_V2);
  const depositVault = await hre.ethers.getContractAt("DepositVaultV2", DEPOSIT_VAULT_V2);
  const bettingEngine = await hre.ethers.getContractAt("BettingEngineARCSV2", BETTING_ENGINE_V2);

  console.log("\n📊 Treasury Status:");
  console.log("─".repeat(60));
  
  const treasuryBalance = await arcsToken.balanceOf(deployer.address);
  console.log("Treasury ARCS:", hre.ethers.formatEther(treasuryBalance), "ARCS");
  
  const totalSupply = await arcsToken.totalSupply();
  console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "ARCS");

  console.log("\n🔐 Approvals:");
  console.log("─".repeat(60));
  
  const depositVaultAllowance = await arcsToken.allowance(deployer.address, DEPOSIT_VAULT_V2);
  console.log("DepositVault allowance:", hre.ethers.formatEther(depositVaultAllowance), "ARCS");
  
  const bettingEngineAllowance = await arcsToken.allowance(deployer.address, BETTING_ENGINE_V2);
  console.log("BettingEngine allowance:", hre.ethers.formatEther(bettingEngineAllowance), "ARCS");

  console.log("\n📋 Contract Configuration:");
  console.log("─".repeat(60));
  
  const depositVaultTreasury = await depositVault.treasury();
  console.log("DepositVault treasury:", depositVaultTreasury);
  console.log("Matches deployer?", depositVaultTreasury === deployer.address ? "✅" : "❌");
  
  const bettingEngineTreasury = await bettingEngine.treasury();
  console.log("BettingEngine treasury:", bettingEngineTreasury);
  console.log("Matches deployer?", bettingEngineTreasury === deployer.address ? "✅" : "❌");

  console.log("\n✅ V2 Setup Verification Complete!");
  console.log("\n💡 Ready to test:");
  console.log("1. Start frontend: cd frontend && npm run dev");
  console.log("2. Start oracle: npm run oracle-service");
  console.log("3. Test deposit → bet → settle → redeem flow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
