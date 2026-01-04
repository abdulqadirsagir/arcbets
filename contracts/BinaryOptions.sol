// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PriceOracle.sol";

/**
 * @title BinaryOptions
 * @dev Binary options trading platform where users bet against the house pool
 */
contract BinaryOptions is ReentrancyGuard, Pausable {
    IERC20 public usdcToken;
    PriceOracle public priceOracle;
    address public owner;
    address public houseWallet;
    
    uint256 public housePool;
    uint256 public totalActiveBets;
    uint256 public betIdCounter;
    
    // Supported assets
    string[] public supportedAssets = ["ETH", "BTC", "SOL"];
    
    // Duration in seconds => multiplier (with 2 decimals, e.g., 150 = 1.5x)
    mapping(uint256 => uint256) public durationMultipliers;
    
    struct Bet {
        uint256 betId;
        address user;
        string asset;
        uint256 amount;
        uint256 entryPrice;
        uint256 duration;
        uint256 multiplier;
        bool isLong; // true = betting price goes UP, false = betting price goes DOWN
        uint256 startTime;
        uint256 endTime;
        bool settled;
        bool won;
        uint256 payout;
    }
    
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;
    
    event HouseDeposit(address indexed from, uint256 amount, uint256 newHousePool);
    event HouseWithdraw(address indexed to, uint256 amount, uint256 newHousePool);
    event BetPlaced(
        uint256 indexed betId,
        address indexed user,
        string asset,
        uint256 amount,
        uint256 entryPrice,
        uint256 duration,
        bool isLong,
        uint256 endTime
    );
    event BetSettled(
        uint256 indexed betId,
        address indexed user,
        bool won,
        uint256 payout
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(
        address _usdcToken,
        address _priceOracle,
        address _houseWallet
    ) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_priceOracle != address(0), "Invalid oracle address");
        require(_houseWallet != address(0), "Invalid house wallet");
        
        usdcToken = IERC20(_usdcToken);
        priceOracle = PriceOracle(_priceOracle);
        owner = msg.sender;
        houseWallet = _houseWallet;
        
        // Initialize duration multipliers
        // 1 hour = 3600 seconds => 1.5x
        durationMultipliers[3600] = 150;
        // 3 hours = 10800 seconds => 1.8x
        durationMultipliers[10800] = 180;
        // 6 hours = 21600 seconds => 2.0x
        durationMultipliers[21600] = 200;
        // 12 hours = 43200 seconds => 2.5x
        durationMultipliers[43200] = 250;
        // 24 hours = 86400 seconds => 3.0x
        durationMultipliers[86400] = 300;
        // 48 hours = 172800 seconds => 3.5x
        durationMultipliers[172800] = 350;
        // 7 days = 604800 seconds => 4.0x
        durationMultipliers[604800] = 400;
    }
    
    /**
     * @dev Deposit USDC into house pool
     */
    function depositToHouse(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        housePool += amount;
        emit HouseDeposit(msg.sender, amount, housePool);
    }
    
    /**
     * @dev Withdraw USDC from house pool (owner only)
     */
    function withdrawFromHouse(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= housePool - totalActiveBets, "Insufficient available funds");
        
        housePool -= amount;
        require(usdcToken.transfer(houseWallet, amount), "Transfer failed");
        
        emit HouseWithdraw(houseWallet, amount, housePool);
    }
    
    /**
     * @dev Place a binary options bet
     */
    function placeBet(
        string memory asset,
        uint256 amount,
        uint256 duration,
        bool isLong
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "Bet amount must be greater than 0");
        require(amount >= 1e6, "Minimum bet is 1 USDC"); // USDC has 6 decimals
        require(isAssetSupported(asset), "Asset not supported");
        require(durationMultipliers[duration] > 0, "Invalid duration");
        
        // Get current price from oracle
        (uint256 entryPrice, ) = priceOracle.getPrice(asset);
        require(priceOracle.isPriceRecent(asset), "Price data is stale");
        
        uint256 multiplier = durationMultipliers[duration];
        uint256 potentialPayout = (amount * multiplier) / 100;
        
        // Check if house has enough liquidity
        require(housePool >= totalActiveBets + potentialPayout, "Insufficient house liquidity");
        
        // Transfer USDC from user
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Create bet
        betIdCounter++;
        uint256 betId = betIdCounter;
        uint256 endTime = block.timestamp + duration;
        
        bets[betId] = Bet({
            betId: betId,
            user: msg.sender,
            asset: asset,
            amount: amount,
            entryPrice: entryPrice,
            duration: duration,
            multiplier: multiplier,
            isLong: isLong,
            startTime: block.timestamp,
            endTime: endTime,
            settled: false,
            won: false,
            payout: 0
        });
        
        userBets[msg.sender].push(betId);
        totalActiveBets += potentialPayout;
        
        emit BetPlaced(betId, msg.sender, asset, amount, entryPrice, duration, isLong, endTime);
        
        return betId;
    }
    
    /**
     * @dev Settle a bet after its duration has ended
     */
    function settleBet(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        require(bet.betId != 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(block.timestamp >= bet.endTime, "Bet duration not ended yet");
        
        // Get final price from oracle
        (uint256 finalPrice, ) = priceOracle.getPrice(bet.asset);
        require(priceOracle.isPriceRecent(bet.asset), "Price data is stale");
        
        // Determine if user won
        bool won = false;
        if (bet.isLong && finalPrice > bet.entryPrice) {
            won = true;
        } else if (!bet.isLong && finalPrice < bet.entryPrice) {
            won = true;
        }
        
        uint256 payout = 0;
        if (won) {
            // User wins: gets their bet amount multiplied by the multiplier
            payout = (bet.amount * bet.multiplier) / 100;
            require(usdcToken.transfer(bet.user, payout), "Payout transfer failed");
        } else {
            // User loses: house keeps the bet amount
            housePool += bet.amount;
        }
        
        // Update bet
        bet.settled = true;
        bet.won = won;
        bet.payout = payout;
        
        // Update total active bets
        uint256 potentialPayout = (bet.amount * bet.multiplier) / 100;
        totalActiveBets -= potentialPayout;
        
        emit BetSettled(betId, bet.user, won, payout);
    }
    
    /**
     * @dev Get user's bet history
     */
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    /**
     * @dev Get bet details
     */
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    /**
     * @dev Check if asset is supported
     */
    function isAssetSupported(string memory asset) public view returns (bool) {
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            if (keccak256(bytes(supportedAssets[i])) == keccak256(bytes(asset))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get available house pool (total - active bets)
     */
    function getAvailableHousePool() external view returns (uint256) {
        return housePool - totalActiveBets;
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Update oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid address");
        priceOracle = PriceOracle(newOracle);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
