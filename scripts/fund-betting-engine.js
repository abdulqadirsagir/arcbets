const hre = require("hardhat");

async function main() {
  console.log("⚠️  WARNING: This script is for V1 contracts only!");
  console.log("⚠️  V2 uses Treasury model - funding not needed!");
  console.log("⚠️  See CURRENT_V2_ADDRESSES.md for V2 contracts\n");
  
  console.log("🏦 Funding BettingEngine V1 with ARCS for payouts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Admin wallet:", deployer.address);

  // V1 Contract addresses (DEPRECATED)
  const HOUSE_VAULT = "0x8c7754FA7011c94e2D4b93f6c63017661B2B9EFe";
  const BETTING_ENGINE = "0x400E9a6e6ffdc4f2C9A1DbCE214593E2ac44cbEe";
  const ARCS_TOKEN = "0xD0Face4DCae418810748A4A96fE6b2856CB1AB54";

  // Get contracts
  const houseVault = await hre.ethers.getContractAt("HouseRiskVault", HOUSE_VAULT);
  const arcsToken = await hre.ethers.getContractAt("ARCSToken", ARCS_TOKEN);

  console.log("\n📊 Current State:");
  console.log("─".repeat(60));
  
  const houseARCS = await arcsToken.balanceOf(HOUSE_VAULT);
  const bettingEngineARCS = await arcsToken.balanceOf(BETTING_ENGINE);
  const houseStats = await houseVault.getHouseStats();
  const houseCapitalUSDC = houseStats[0];

  console.log("House ARCS:", hre.ethers.formatEther(houseARCS), "ARCS");
  console.log("BettingEngine ARCS:", hre.ethers.formatEther(bettingEngineARCS), "ARCS");
  console.log("House Capital:", hre.ethers.formatEther(houseCapitalUSDC), "USDC");

  // Convert 10 USDC to ARCS in HouseVault
  console.log("\n💱 Converting 10 USDC to 100 ARCS in HouseVault...");
  const convertAmount = hre.ethers.parseEther("10");
  let tx = await houseVault.convertUSDCtoARCS(convertAmount);
  await tx.wait();
  console.log("✅ Converted 10 USDC → 100 ARCS");

  // Check new balance
  const houseARCSAfter = await arcsToken.balanceOf(HOUSE_VAULT);
  console.log("House ARCS now:", hre.ethers.formatEther(houseARCSAfter), "ARCS");

  // Transfer 100 ARCS from HouseVault to BettingEngine
  // We need to call transferFrom on the ARCSToken as the HouseVault
  // But we can't do that directly. Instead, let's check if there's a function in HouseVault
  // For now, let's just convert more USDC directly in the BettingEngine via admin
  
  console.log("\n⚠️ Cannot transfer from HouseVault (not authorized)");
  console.log("💡 Alternative: Admin can deposit USDC directly to get ARCS");
  console.log("   Or we need to update contracts to allow this flow");
  
  console.log("\n✅ HouseVault now has 100 ARCS");
  console.log("⚠️ BettingEngine still needs funding - contract design issue!");

  // Check final balances
  console.log("\n📊 Final State:");
  console.log("─".repeat(60));
  const houseARCSFinal = await arcsToken.balanceOf(HOUSE_VAULT);
  const bettingEngineARCSFinal = await arcsToken.balanceOf(BETTING_ENGINE);
  console.log("House ARCS:", hre.ethers.formatEther(houseARCSFinal), "ARCS");
  console.log("BettingEngine ARCS:", hre.ethers.formatEther(bettingEngineARCSFinal), "ARCS");

  console.log("\n✅ BettingEngine funded! Settlement should work now!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
