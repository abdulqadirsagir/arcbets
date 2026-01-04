const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 DEPLOYING TREASURY MODEL (V2) - ARCS Gaming Token System");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "USDC\n");

  // Treasury is the deployer wallet (holds all ARCS)
  const TREASURY = deployer.address;
  
  // Use existing PriceOracle
  const PRICE_ORACLE = "0xa97B0b72234EF7aE9934D836581B4771fc3D3247";
  
  console.log("🏦 Treasury wallet:", TREASURY);
  console.log("🔮 Price Oracle:", PRICE_ORACLE, "(existing)\n");

  // ============ 1. Deploy ARCSTokenV2 ============
  console.log("=".repeat(70));
  console.log("1️⃣  Deploying ARCSTokenV2 (Fixed Supply: 1 Billion ARCS)...");
  console.log("=".repeat(70));
  
  const ARCSTokenV2 = await hre.ethers.getContractFactory("ARCSTokenV2");
  const arcsToken = await ARCSTokenV2.deploy();
  await arcsToken.waitForDeployment();
  const arcsTokenAddress = await arcsToken.getAddress();
  
  console.log("✅ ARCSTokenV2 deployed to:", arcsTokenAddress);
  console.log("📊 Total supply: 1,000,000,000 ARCS");
  console.log("🏦 All ARCS held in treasury:", TREASURY);
  console.log();

  // ============ 2. Deploy DepositVaultV2 ============
  console.log("=".repeat(70));
  console.log("2️⃣  Deploying DepositVaultV2...");
  console.log("=".repeat(70));
  
  const DepositVaultV2 = await hre.ethers.getContractFactory("DepositVaultV2");
  const depositVault = await DepositVaultV2.deploy(arcsTokenAddress, TREASURY);
  await depositVault.waitForDeployment();
  const depositVaultAddress = await depositVault.getAddress();
  
  console.log("✅ DepositVaultV2 deployed to:", depositVaultAddress);
  console.log();

  // ============ 3. Deploy BettingEngineARCSV2 ============
  console.log("=".repeat(70));
  console.log("3️⃣  Deploying BettingEngineARCSV2...");
  console.log("=".repeat(70));
  
  const BettingEngineARCSV2 = await hre.ethers.getContractFactory("BettingEngineARCSV2");
  const bettingEngine = await BettingEngineARCSV2.deploy(
    arcsTokenAddress,
    PRICE_ORACLE,
    TREASURY
  );
  await bettingEngine.waitForDeployment();
  const bettingEngineAddress = await bettingEngine.getAddress();
  
  console.log("✅ BettingEngineARCSV2 deployed to:", bettingEngineAddress);
  console.log();

  // ============ 4. Configure Approvals ============
  console.log("=".repeat(70));
  console.log("4️⃣  Configuring Treasury Approvals...");
  console.log("=".repeat(70));
  
  // Treasury (deployer) approves DepositVault to transfer ARCS
  console.log("⏳ Approving DepositVault to transfer ARCS from treasury...");
  let tx = await arcsToken.approve(depositVaultAddress, hre.ethers.MaxUint256);
  await tx.wait();
  console.log("✅ DepositVault approved");
  
  // Treasury (deployer) approves BettingEngine to transfer ARCS
  console.log("⏳ Approving BettingEngine to transfer ARCS from treasury...");
  tx = await arcsToken.approve(bettingEngineAddress, hre.ethers.MaxUint256);
  await tx.wait();
  console.log("✅ BettingEngine approved");
  console.log();

  // ============ 5. Fund DepositVault with USDC ============
  console.log("=".repeat(70));
  console.log("5️⃣  Funding DepositVault with House Capital...");
  console.log("=".repeat(70));
  
  const fundAmount = hre.ethers.parseEther("20"); // 20 USDC
  console.log("⏳ Sending 20 USDC to DepositVault...");
  tx = await deployer.sendTransaction({
    to: depositVaultAddress,
    value: fundAmount
  });
  await tx.wait();
  console.log("✅ DepositVault funded with 20 USDC (for user redemptions)");
  console.log();

  // ============ DEPLOYMENT SUMMARY ============
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE - TREASURY MODEL V2");
  console.log("=".repeat(70) + "\n");

  console.log("📋 Contract Addresses:");
  console.log("─".repeat(70));
  console.log("ARCSTokenV2:         ", arcsTokenAddress);
  console.log("DepositVaultV2:      ", depositVaultAddress);
  console.log("BettingEngineARCSV2: ", bettingEngineAddress);
  console.log("PriceOracle:         ", PRICE_ORACLE, "(existing)");
  console.log();

  console.log("💰 Treasury (Deployer):", TREASURY);
  console.log("   ARCS Balance:        1,000,000,000 ARCS (1 billion)");
  console.log("   Approved for:        DepositVault & BettingEngine");
  console.log();

  console.log("🏦 DepositVault:");
  console.log("   USDC Balance:        20 USDC (house capital for redemptions)");
  console.log();

  console.log("=".repeat(70));
  console.log("📝 SAVE THESE ADDRESSES:");
  console.log("=".repeat(70));
  console.log(`
export ARCS_TOKEN_V2=${arcsTokenAddress}
export DEPOSIT_VAULT_V2=${depositVaultAddress}
export BETTING_ENGINE_V2=${bettingEngineAddress}
export TREASURY=${TREASURY}
export ORACLE=${PRICE_ORACLE}
  `);

  console.log("=".repeat(70));
  console.log("📋 Next Steps:");
  console.log("=".repeat(70));
  console.log("1. Update .env with new contract addresses");
  console.log("2. Update frontend/lib/contracts.ts");
  console.log("3. Restart frontend: npm run dev");
  console.log("4. Test deposit → bet → settlement → redeem");
  console.log("5. Settlement should work now! 🎉");
  console.log();

  console.log("✨ Treasury model deployed! Ready to test!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
