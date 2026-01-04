const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BinaryOptions", function () {
  let usdc, oracle, binaryOptions;
  let owner, user1, user2, houseWallet;

  const INITIAL_LIQUIDITY = ethers.parseUnits("100000", 6); // 100k USDC
  const BET_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC

  beforeEach(async function () {
    [owner, user1, user2, houseWallet] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy PriceOracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();

    // Deploy BinaryOptions
    const BinaryOptions = await ethers.getContractFactory("BinaryOptions");
    binaryOptions = await BinaryOptions.deploy(
      await usdc.getAddress(),
      await oracle.getAddress(),
      houseWallet.address
    );
    await binaryOptions.waitForDeployment();

    // Setup initial prices
    await oracle.updatePrices(
      ["ETH", "BTC", "SOL"],
      [
        ethers.parseUnits("3500", 8),
        ethers.parseUnits("95000", 8),
        ethers.parseUnits("180", 8)
      ]
    );

    // Deposit house liquidity
    await usdc.approve(await binaryOptions.getAddress(), INITIAL_LIQUIDITY);
    await binaryOptions.depositToHouse(INITIAL_LIQUIDITY);

    // Give users some USDC
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await binaryOptions.owner()).to.equal(owner.address);
    });

    it("Should have correct initial house pool", async function () {
      expect(await binaryOptions.housePool()).to.equal(INITIAL_LIQUIDITY);
    });

    it("Should have correct supported assets", async function () {
      expect(await binaryOptions.isAssetSupported("ETH")).to.be.true;
      expect(await binaryOptions.isAssetSupported("BTC")).to.be.true;
      expect(await binaryOptions.isAssetSupported("SOL")).to.be.true;
      expect(await binaryOptions.isAssetSupported("DOGE")).to.be.false;
    });
  });

  describe("Placing Bets", function () {
    it("Should place a bet successfully", async function () {
      // User1 approves and places bet
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      
      await expect(
        binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, true)
      ).to.emit(binaryOptions, "BetPlaced");

      const userBets = await binaryOptions.getUserBets(user1.address);
      expect(userBets.length).to.equal(1);

      const bet = await binaryOptions.getBet(userBets[0]);
      expect(bet.user).to.equal(user1.address);
      expect(bet.asset).to.equal("ETH");
      expect(bet.amount).to.equal(BET_AMOUNT);
      expect(bet.isLong).to.be.true;
      expect(bet.settled).to.be.false;
    });

    it("Should revert if amount is too low", async function () {
      const tooLow = ethers.parseUnits("0.5", 6);
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), tooLow);
      
      await expect(
        binaryOptions.connect(user1).placeBet("ETH", tooLow, 3600, true)
      ).to.be.revertedWith("Minimum bet is 1 USDC");
    });

    it("Should revert if asset not supported", async function () {
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      
      await expect(
        binaryOptions.connect(user1).placeBet("DOGE", BET_AMOUNT, 3600, true)
      ).to.be.revertedWith("Asset not supported");
    });

    it("Should revert if duration invalid", async function () {
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      
      await expect(
        binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 1234, true)
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Settling Bets", function () {
    it("Should settle winning LONG bet correctly", async function () {
      // Place bet
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      await binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, true);
      
      const userBets = await binaryOptions.getUserBets(user1.address);
      const betId = userBets[0];

      // Fast forward time
      await time.increase(3601);

      // Update price to higher value (user wins)
      await oracle.updatePrice("ETH", ethers.parseUnits("3600", 8));

      // Settle bet
      const userBalanceBefore = await usdc.balanceOf(user1.address);
      await binaryOptions.settleBet(betId);

      const bet = await binaryOptions.getBet(betId);
      expect(bet.settled).to.be.true;
      expect(bet.won).to.be.true;

      // User should receive 1.5x their bet (150 USDC)
      const expectedPayout = ethers.parseUnits("150", 6);
      expect(bet.payout).to.equal(expectedPayout);

      const userBalanceAfter = await usdc.balanceOf(user1.address);
      expect(userBalanceAfter - userBalanceBefore).to.equal(expectedPayout);
    });

    it("Should settle winning SHORT bet correctly", async function () {
      // Place short bet
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      await binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, false);
      
      const userBets = await binaryOptions.getUserBets(user1.address);
      const betId = userBets[0];

      // Fast forward time
      await time.increase(3601);

      // Update price to lower value (user wins)
      await oracle.updatePrice("ETH", ethers.parseUnits("3400", 8));

      // Settle bet
      await binaryOptions.settleBet(betId);

      const bet = await binaryOptions.getBet(betId);
      expect(bet.settled).to.be.true;
      expect(bet.won).to.be.true;
    });

    it("Should settle losing bet correctly", async function () {
      // Place bet
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      await binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, true);
      
      const userBets = await binaryOptions.getUserBets(user1.address);
      const betId = userBets[0];

      // Fast forward time
      await time.increase(3601);

      // Update price to lower value (user loses)
      await oracle.updatePrice("ETH", ethers.parseUnits("3400", 8));

      // Settle bet
      const userBalanceBefore = await usdc.balanceOf(user1.address);
      const housePoolBefore = await binaryOptions.housePool();
      
      await binaryOptions.settleBet(betId);

      const bet = await binaryOptions.getBet(betId);
      expect(bet.settled).to.be.true;
      expect(bet.won).to.be.false;
      expect(bet.payout).to.equal(0);

      // User balance should not change (already lost the bet amount)
      const userBalanceAfter = await usdc.balanceOf(user1.address);
      expect(userBalanceAfter).to.equal(userBalanceBefore);

      // House pool should increase by bet amount
      const housePoolAfter = await binaryOptions.housePool();
      expect(housePoolAfter - housePoolBefore).to.equal(BET_AMOUNT);
    });

    it("Should revert if bet not ended yet", async function () {
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      await binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, true);
      
      const userBets = await binaryOptions.getUserBets(user1.address);
      const betId = userBets[0];

      await expect(
        binaryOptions.settleBet(betId)
      ).to.be.revertedWith("Bet duration not ended yet");
    });

    it("Should revert if bet already settled", async function () {
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), BET_AMOUNT);
      await binaryOptions.connect(user1).placeBet("ETH", BET_AMOUNT, 3600, true);
      
      const userBets = await binaryOptions.getUserBets(user1.address);
      const betId = userBets[0];

      await time.increase(3601);
      await oracle.updatePrice("ETH", ethers.parseUnits("3600", 8));
      await binaryOptions.settleBet(betId);

      await expect(
        binaryOptions.settleBet(betId)
      ).to.be.revertedWith("Bet already settled");
    });
  });

  describe("House Pool Management", function () {
    it("Should allow deposits to house pool", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(await binaryOptions.getAddress(), depositAmount);
      
      const poolBefore = await binaryOptions.housePool();
      await binaryOptions.connect(user1).depositToHouse(depositAmount);
      const poolAfter = await binaryOptions.housePool();

      expect(poolAfter - poolBefore).to.equal(depositAmount);
    });

    it("Should allow owner to withdraw from house pool", async function () {
      const withdrawAmount = ethers.parseUnits("1000", 6);
      const poolBefore = await binaryOptions.housePool();
      
      await binaryOptions.withdrawFromHouse(withdrawAmount);
      
      const poolAfter = await binaryOptions.housePool();
      expect(poolBefore - poolAfter).to.equal(withdrawAmount);
    });

    it("Should not allow non-owner to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("1000", 6);
      
      await expect(
        binaryOptions.connect(user1).withdrawFromHouse(withdrawAmount)
      ).to.be.revertedWith("Only owner");
    });
  });
});
