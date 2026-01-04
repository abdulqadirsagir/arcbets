require('dotenv').config()
const hre = require('hardhat')

async function main() {
  console.log('🚀 Deploying Native USDC Binary Options to Arc Testnet...\n')

  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying with account:', deployer.address)
  
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', hre.ethers.formatEther(balance), 'USDC\n')

  // 1. Deploy Price Oracle
  console.log('📡 Deploying PriceOracle...')
  const PriceOracle = await hre.ethers.getContractFactory('PriceOracle')
  const oracle = await PriceOracle.deploy()
  await oracle.waitForDeployment()
  const oracleAddress = await oracle.getAddress()
  console.log('✅ PriceOracle deployed to:', oracleAddress)

  // 2. Deploy Native Binary Options (no USDC token address needed!)
  console.log('\n🎲 Deploying BinaryOptionsNative...')
  const houseWallet = deployer.address // Use deployer as house wallet
  
  const BinaryOptionsNative = await hre.ethers.getContractFactory('BinaryOptionsNative')
  const binaryOptions = await BinaryOptionsNative.deploy(
    oracleAddress,
    houseWallet
  )
  await binaryOptions.waitForDeployment()
  const binaryOptionsAddress = await binaryOptions.getAddress()
  console.log('✅ BinaryOptionsNative deployed to:', binaryOptionsAddress)

  // 3. Authorize Binary Options contract to update oracle
  console.log('\n🔐 Authorizing BinaryOptions contract...')
  const tx = await oracle.authorize(binaryOptionsAddress)
  await tx.wait()
  console.log('✅ BinaryOptions authorized')

  // 4. Seed house pool with native USDC
  console.log('\n💰 Seeding house pool with 10,000 USDC...')
  const depositAmount = hre.ethers.parseEther('10000') // 18 decimals for native USDC
  const depositTx = await binaryOptions.depositToHouse({ value: depositAmount })
  await depositTx.wait()
  console.log('✅ House pool seeded')

  console.log('\n' + '='.repeat(60))
  console.log('✅ DEPLOYMENT COMPLETE!')
  console.log('='.repeat(60))
  console.log('\n📝 Contract Addresses:')
  console.log('━'.repeat(60))
  console.log('PriceOracle:       ', oracleAddress)
  console.log('BinaryOptions:     ', binaryOptionsAddress)
  console.log('House Wallet:      ', houseWallet)
  console.log('━'.repeat(60))

  console.log('\n🔧 Update your .env files with:')
  console.log('━'.repeat(60))
  console.log(`ORACLE_ADDRESS=${oracleAddress}`)
  console.log(`BINARY_OPTIONS_ADDRESS=${binaryOptionsAddress}`)
  console.log('━'.repeat(60))

  console.log('\n✅ Native USDC setup complete!')
  console.log('🎯 Users can now bet with native USDC (used for gas too!)')
  console.log('💡 No token approvals needed - just send USDC with transactions\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
