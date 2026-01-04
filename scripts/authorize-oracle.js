require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('🔐 Authorizing Oracle Wallet...\n');

  // Connect with deployer wallet (owner)
  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
  const deployerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Connect with oracle wallet to get its address
  const oracleWallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
  
  console.log('Deployer Address:', deployerWallet.address);
  console.log('Oracle Address:', oracleWallet.address);
  console.log('Oracle Contract:', process.env.ORACLE_ADDRESS);
  console.log();

  // Oracle contract ABI
  const oracleABI = [
    "function setPriceUpdater(address newUpdater) external",
    "function priceUpdater() external view returns (address)",
    "function owner() external view returns (address)"
  ];

  // Connect to oracle contract as owner
  const oracleContract = new ethers.Contract(
    process.env.ORACLE_ADDRESS,
    oracleABI,
    deployerWallet
  );

  // Check current owner and updater
  const currentOwner = await oracleContract.owner();
  const currentUpdater = await oracleContract.priceUpdater();
  
  console.log('Current Owner:', currentOwner);
  console.log('Current Price Updater:', currentUpdater);
  console.log();

  // Set the oracle wallet as the price updater
  console.log('Setting oracle wallet as price updater...');
  const tx = await oracleContract.setPriceUpdater(oracleWallet.address);
  console.log('Transaction sent:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('Transaction confirmed in block:', receipt.blockNumber);
  console.log();

  // Verify the change
  const newUpdater = await oracleContract.priceUpdater();
  console.log('✅ New Price Updater:', newUpdater);
  
  if (newUpdater.toLowerCase() === oracleWallet.address.toLowerCase()) {
    console.log('✅ Oracle wallet successfully authorized!');
  } else {
    console.log('❌ Authorization failed!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
