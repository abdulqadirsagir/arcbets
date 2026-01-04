// Deploy ARCS Betting System
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("=" .repeat(70));
  console.log("⚠️  WARNING: This deploys V1 contracts (DEPRECATED)");
  console.log("⚠️  Use deploy-treasury-model.js for V2 deployment");
  console.log("⚠️  See CURRENT_V2_ADDRESSES.md for current contracts");
  console.log("=" .repeat(70));
  console.log("🚀 Deploying ARCS Betting System V1 to Arc Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from address:", deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "USDC\n");

  // ============ 1. Deploy ARCSToken ============
  console.log("=" .repeat(60));
  console.log("1️⃣  Deploying ARCSToken...");
  console.log("=" .repeat(60));
  
  const ARCSToken = await hre.ethers.getContractFactory("ARCSToken");
  const arcsToken = await ARCSToken.deploy();
  await arcsToken.waitForDeployment();
  const arcsTokenAddress = await arcsToken.getAddress();
  
  console.log("✅ ARCSToken deployed to:", arcsTokenAddress);
  console.log();

  // ============ 2. Deploy DepositVault ============
  console.log("=" .repeat(60));
  console.log("2️⃣  Deploying DepositVault...");
  console.log("=" .repeat(60));
  
  const DepositVault = await hre.ethers.getContractFactory("DepositVault");
  const depositVault = await DepositVault.deploy(arcsTokenAddress);
  await depositVault.waitForDeployment();
  const depositVaultAddress = await depositVault.getAddress();
  
  console.log("✅ DepositVault deployed to:", depositVaultAddress);
  console.log();

  // ============ 3. Deploy HouseRiskVault ============
  console.log("=" .repeat(60));
  console.log("3️⃣  Deploying HouseRiskVault...");
  console.log("=" .repeat(60));
  
  const houseWallet = deployer.address; // Use deployer as house wallet for now
  const HouseRiskVault = await hre.ethers.getContractFactory("HouseRiskVault");
  const houseVault = await HouseRiskVault.deploy(
    arcsTokenAddress, 
    depositVaultAddress,  // NEW: Pass DepositVault address
    houseWallet
  );
  await houseVault.waitForDeployment();
  const houseVaultAddress = await houseVault.getAddress();
  
  console.log("✅ HouseRiskVault deployed to:", houseVaultAddress);
  console.log("🏠 House wallet:", houseWallet);
  console.log();

  // ============ 4. Deploy or Get PriceOracle ============
  console.log("=" .repeat(60));
  console.log("4️⃣  Price Oracle...");
  console.log("=" .repeat(60));
  
  let oracleAddress = process.env.ORACLE_ADDRESS;
  
  if (!oracleAddress) {
    console.log("⚠️  No existing oracle found, deploying new one...");
    const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
    const oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();
    oracleAddress = await oracle.getAddress();
    console.log("✅ PriceOracle deployed to:", oracleAddress);
  } else {
    console.log("✅ Using existing PriceOracle:", oracleAddress);
  }
  console.log();

  // ============ 5. Deploy BettingEngineARCS ============
  console.log("=" .repeat(60));
  console.log("5️⃣  Deploying BettingEngineARCS...");
  console.log("=" .repeat(60));
  
  const BettingEngineARCS = await hre.ethers.getContractFactory("BettingEngineARCS");
  const bettingEngine = await BettingEngineARCS.deploy(
    arcsTokenAddress,
    houseVaultAddress,
    oracleAddress
  );
  await bettingEngine.waitForDeployment();
  const bettingEngineAddress = await bettingEngine.getAddress();
  
  console.log("✅ BettingEngineARCS deployed to:", bettingEngineAddress);
  console.log();

  // ============ 6. Deploy SystemSolvency ============
  console.log("=" .repeat(60));
  console.log("6️⃣  Deploying SystemSolvency...");
  console.log("=" .repeat(60));
  
  const SystemSolvency = await hre.ethers.getContractFactory("SystemSolvency");
  const systemSolvency = await SystemSolvency.deploy(
    arcsTokenAddress,
    depositVaultAddress,
    houseVaultAddress,
    bettingEngineAddress
  );
  await systemSolvency.waitForDeployment();
  const systemSolvencyAddress = await systemSolvency.getAddress();
  
  console.log("✅ SystemSolvency deployed to:", systemSolvencyAddress);
  console.log();

  // ============ 7. Configure Permissions ============
  console.log("=" .repeat(60));
  console.log("7️⃣  Configuring Permissions...");
  console.log("=" .repeat(60));
  
  // Authorize DepositVault to mint/burn ARCS
  console.log("⏳ Authorizing DepositVault to mint/burn ARCS...");
  let tx = await arcsToken.authorizeContract(depositVaultAddress, true);
  await tx.wait();
  console.log("✅ DepositVault authorized");
  
  // Authorize BettingEngine to transfer ARCS
  console.log("⏳ Authorizing BettingEngine to transfer ARCS...");
  tx = await arcsToken.authorizeContract(bettingEngineAddress, true);
  await tx.wait();
  console.log("✅ BettingEngine authorized");
  
  // Authorize HouseVault to receive ARCS
  console.log("⏳ Authorizing HouseVault...");
  tx = await arcsToken.authorizeContract(houseVaultAddress, true);
  await tx.wait();
  console.log("✅ HouseVault authorized");
  
  // Authorize BettingEngine in HouseVault for payouts
  console.log("⏳ Authorizing BettingEngine in HouseVault...");
  tx = await houseVault.authorizeBettingContract(bettingEngineAddress, true);
  await tx.wait();
  console.log("✅ BettingEngine authorized in HouseVault");
  
  // Set HouseVault address in DepositVault for tracking redemptions
  console.log("⏳ Setting HouseVault address in DepositVault...");
  tx = await depositVault.setHouseVault(houseVaultAddress);
  await tx.wait();
  console.log("✅ HouseVault address set in DepositVault");
  console.log();

  // ============ 8. Optional: Fund House Pool ============
  console.log("=" .repeat(60));
  console.log("8️⃣  Funding House Risk Pool (Optional)...");
  console.log("=" .repeat(60));
  
  const houseFunding = hre.ethers.parseEther("50"); // 50 USDC
  console.log("💰 Depositing", hre.ethers.formatEther(houseFunding), "USDC to house pool...");
  
  tx = await houseVault.depositHouseCapital({ value: houseFunding });
  await tx.wait();
  console.log("✅ House pool funded with", hre.ethers.formatEther(houseFunding), "USDC");
  console.log();

  // ============ 9. Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract Addresses:\n");
  console.log("ARCSToken:        ", arcsTokenAddress);
  console.log("DepositVault:     ", depositVaultAddress);
  console.log("HouseRiskVault:   ", houseVaultAddress);
  console.log("PriceOracle:      ", oracleAddress);
  console.log("BettingEngineARCS:", bettingEngineAddress);
  console.log("SystemSolvency:   ", systemSolvencyAddress);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 Add these to your .env file:");
  console.log("=".repeat(60));
  console.log(`
ARCS_TOKEN_ADDRESS=${arcsTokenAddress}
DEPOSIT_VAULT_ADDRESS=${depositVaultAddress}
HOUSE_VAULT_ADDRESS=${houseVaultAddress}
ORACLE_ADDRESS=${oracleAddress}
BETTING_ENGINE_ADDRESS=${bettingEngineAddress}
SYSTEM_SOLVENCY_ADDRESS=${systemSolvencyAddress}
  `);
  
  console.log("=".repeat(60));
  console.log("📋 Next Steps:");
  console.log("=".repeat(60));
  console.log("1. Update .env file with contract addresses");
  console.log("2. Compile contracts: npx hardhat compile");
  console.log("3. Update frontend/lib/contracts.ts with new ABIs");
  console.log("4. Start oracle service: npm run oracle-service");
  console.log("5. Start frontend: npm run dev");
  console.log("6. Test deposit/bet/redeem flow");
  console.log("7. Test house ARCS redemption (admin only)\n");
  
  console.log("✨ System is ready to use!");
  console.log("🆕 NEW FEATURE: House can now redeem ARCS via redeemHouseARCS()\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
