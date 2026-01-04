const hre = require("hardhat");

async function main() {
  console.log("=" .repeat(70));
  console.log("⚠️  WARNING: This deploys BinaryOptions (OLD SYSTEM)");
  console.log("⚠️  Use deploy-treasury-model.js for current ARCS V2 system");
  console.log("⚠️  See CURRENT_V2_ADDRESSES.md for current contracts");
  console.log("=" .repeat(70));
  console.log("Starting deployment to Arc testnet...\\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Mock USDC (or use existing testnet USDC)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy Price Oracle
  console.log("\nDeploying PriceOracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("PriceOracle deployed to:", oracleAddress);

  // Deploy Binary Options Contract
  console.log("\nDeploying BinaryOptions...");
  const houseWallet = deployer.address; // Can be changed later
  const BinaryOptions = await hre.ethers.getContractFactory("BinaryOptions");
  const binaryOptions = await BinaryOptions.deploy(
    usdcAddress,
    oracleAddress,
    houseWallet
  );
  await binaryOptions.waitForDeployment();
  const binaryOptionsAddress = await binaryOptions.getAddress();
  console.log("BinaryOptions deployed to:", binaryOptionsAddress);

  // Initialize with some prices
  console.log("\nInitializing oracle with current prices...");
  const assets = ["ETH", "BTC", "SOL"];
  const prices = [
    hre.ethers.parseUnits("3500", 8),  // ETH: $3,500
    hre.ethers.parseUnits("95000", 8), // BTC: $95,000
    hre.ethers.parseUnits("180", 8)    // SOL: $180
  ];
  
  const tx = await oracle.updatePrices(assets, prices);
  await tx.wait();
  console.log("Oracle initialized with prices");

  // Deposit initial liquidity to house pool
  console.log("\nDepositing initial liquidity to house pool...");
  const initialLiquidity = hre.ethers.parseUnits("100000", 6); // 100,000 USDC
  
  // Approve and deposit
  const approveTx = await usdc.approve(binaryOptionsAddress, initialLiquidity);
  await approveTx.wait();
  
  const depositTx = await binaryOptions.depositToHouse(initialLiquidity);
  await depositTx.wait();
  console.log("Deposited 100,000 USDC to house pool");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MockUSDC:          ", usdcAddress);
  console.log("PriceOracle:       ", oracleAddress);
  console.log("BinaryOptions:     ", binaryOptionsAddress);
  console.log("House Wallet:      ", houseWallet);
  console.log("=".repeat(60));
  console.log("\nAdd these addresses to your .env file:");
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  console.log(`ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`BINARY_OPTIONS_ADDRESS=${binaryOptionsAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
