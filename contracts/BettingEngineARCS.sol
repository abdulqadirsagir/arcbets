// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ARCSToken.sol";
import "./HouseRiskVault.sol";
import "./PriceOracle.sol";

/**
 * @title BettingEngineARCS
 * @notice Binary options betting using ARCS chips
 * @dev All bets denominated in ARCS, settled in ARCS, payouts from house vault
 * 
 * Bet Flow:
 * 1. User places bet with ARCS (transferred to contract)
 * 2. House takes opposite side (ARCS from house vault)
 * 3. At settlement:
 *    - Winner gets ARCS back + winnings
 *    - Loser loses ARCS (stays in contract or returned to house)
 */
contract BettingEngineARCS is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Structs ============
    
    struct Bet {
        uint256 betId;
        address user;
        string asset;           // "BTC", "ETH", "SOL"
        uint256 amountARCS;     // Bet amount in ARCS
        uint256 entryPrice;     // Entry price from oracle (8 decimals)
        uint256 duration;       // Bet duration in seconds
        uint256 multiplier;     // Payout multiplier (100 = 1x, 150 = 1.5x)
        bool isLong;            // true = price up, false = price down
        uint256 startTime;
        uint256 endTime;
        bool settled;
        bool won;
        uint256 payoutARCS;     // Payout amount in ARCS
    }
    
    // ============ State Variables ============
    
    /// @notice ARCS token contract
    ARCSToken public immutable arcsToken;
    
    /// @notice House risk vault
    HouseRiskVault public immutable houseVault;
    
    /// @notice Price oracle
    PriceOracle public priceOracle;
    
    /// @notice Bet counter
    uint256 public nextBetId = 1;
    
    /// @notice All bets
    mapping(uint256 => Bet) public bets;
    
    /// @notice User bets
    mapping(address => uint256[]) public userBets;
    
    /// @notice Total active bets in ARCS
    uint256 public totalActiveBetsARCS;
    
    /// @notice Minimum bet (1 ARCS)
    uint256 public minBetARCS = 1 ether;
    
    /// @notice Maximum bet (100 ARCS)
    uint256 public maxBetARCS = 100 ether;
    
    /// @notice Supported assets
    mapping(string => bool) public supportedAssets;
    
    /// @notice Duration to multiplier mapping (in seconds => multiplier basis points)
    mapping(uint256 => uint256) public durationMultipliers;
    
    // ============ Events ============
    
    event BetPlaced(
        uint256 indexed betId,
        address indexed user,
        string asset,
        uint256 amountARCS,
        uint256 entryPrice,
        uint256 duration,
        bool isLong,
        uint256 endTime
    );
    
    event BetSettled(
        uint256 indexed betId,
        address indexed user,
        bool won,
        uint256 payoutARCS
    );
    
    event AssetSupported(string asset, bool supported);
    event MultiplierUpdated(uint256 duration, uint256 multiplier);
    
    // ============ Errors ============
    
    error BetNotFound();
    error BetAlreadySettled();
    error BetNotExpired();
    error UnsupportedAsset(string asset);
    error InvalidDuration(uint256 duration);
    error BetAmountTooLow(uint256 amount, uint256 minimum);
    error BetAmountTooHigh(uint256 amount, uint256 maximum);
    error InsufficientARCSBalance(uint256 required, uint256 available);
    error InsufficientHouseLiquidity(uint256 needed, uint256 available);
    error OraclePriceStale();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    constructor(
        address _arcsToken,
        address payable _houseVault,
        address _priceOracle
    ) Ownable(msg.sender) {
        if (_arcsToken == address(0) || _houseVault == address(0) || _priceOracle == address(0)) {
            revert ZeroAddress();
        }
        
        arcsToken = ARCSToken(_arcsToken);
        houseVault = HouseRiskVault(_houseVault);
        priceOracle = PriceOracle(_priceOracle);
        
        // Initialize supported assets
        supportedAssets["BTC"] = true;
        supportedAssets["ETH"] = true;
        supportedAssets["SOL"] = true;
        
        // Initialize duration multipliers (duration in seconds => multiplier in basis points)
        durationMultipliers[1 hours] = 150;    // 1.5x
        durationMultipliers[3 hours] = 180;    // 1.8x
        durationMultipliers[6 hours] = 200;    // 2.0x
        durationMultipliers[12 hours] = 250;   // 2.5x
        durationMultipliers[24 hours] = 300;   // 3.0x
        durationMultipliers[48 hours] = 350;   // 3.5x
        durationMultipliers[7 days] = 400;     // 4.0x
    }
    
    // ============ Core Betting Functions ============
    
    /**
     * @notice Place a bet using ARCS
     * @param asset Asset to bet on ("BTC", "ETH", "SOL")
     * @param duration Bet duration in seconds
     * @param isLong true = bet price goes up, false = bet price goes down
     * @param amountARCS Amount of ARCS to bet
     */
    function placeBet(
        string calldata asset,
        uint256 duration,
        bool isLong,
        uint256 amountARCS
    ) external nonReentrant whenNotPaused returns (uint256) {
        
        // Validate inputs
        if (!supportedAssets[asset]) revert UnsupportedAsset(asset);
        if (durationMultipliers[duration] == 0) revert InvalidDuration(duration);
        if (amountARCS < minBetARCS) revert BetAmountTooLow(amountARCS, minBetARCS);
        if (amountARCS > maxBetARCS) revert BetAmountTooHigh(amountARCS, maxBetARCS);
        
        // Check user has enough ARCS
        uint256 userBalance = arcsToken.balanceOf(msg.sender);
        if (userBalance < amountARCS) revert InsufficientARCSBalance(amountARCS, userBalance);
        
        // Get entry price from oracle
        (uint256 price, uint256 timestamp) = priceOracle.getPrice(asset);
        require(price > 0, "Invalid oracle price");
        require(block.timestamp - timestamp < 1 hours, "Oracle price too stale");
        
        // Calculate potential payout
        uint256 multiplier = durationMultipliers[duration];
        uint256 potentialPayoutARCS = (amountARCS * multiplier) / 100;
        
        // Check house has enough liquidity (convert ARCS to USDC equivalent)
        uint256 potentialPayoutUSDC = potentialPayoutARCS / 10; // 10 ARCS = 1 USDC
        require(
            houseVault.canCoverPayout(potentialPayoutUSDC),
            "Insufficient house liquidity"
        );
        
        // Transfer ARCS from user to contract
        arcsToken.transferFrom(msg.sender, address(this), amountARCS, "bet_placed");
        
        // Create bet
        uint256 betId = nextBetId++;
        uint256 endTime = block.timestamp + duration;
        
        bets[betId] = Bet({
            betId: betId,
            user: msg.sender,
            asset: asset,
            amountARCS: amountARCS,
            entryPrice: price,
            duration: duration,
            multiplier: multiplier,
            isLong: isLong,
            startTime: block.timestamp,
            endTime: endTime,
            settled: false,
            won: false,
            payoutARCS: 0
        });
        
        userBets[msg.sender].push(betId);
        totalActiveBetsARCS += amountARCS;
        
        emit BetPlaced(
            betId,
            msg.sender,
            asset,
            amountARCS,
            price,
            duration,
            isLong,
            endTime
        );
        
        return betId;
    }
    
    /**
     * @notice Settle a bet after expiry
     * @param betId ID of the bet to settle
     */
    function settleBet(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        
        if (bet.user == address(0)) revert BetNotFound();
        if (bet.settled) revert BetAlreadySettled();
        if (block.timestamp < bet.endTime) revert BetNotExpired();
        
        // Get exit price from oracle
        (uint256 exitPrice, uint256 timestamp) = priceOracle.getPrice(bet.asset);
        require(exitPrice > 0, "Invalid oracle price");
        require(timestamp >= bet.endTime, "Oracle not updated yet");
        
        // Determine if user won
        bool won;
        if (bet.isLong) {
            won = exitPrice > bet.entryPrice;
        } else {
            won = exitPrice < bet.entryPrice;
        }
        
        bet.settled = true;
        bet.won = won;
        totalActiveBetsARCS -= bet.amountARCS;
        
        if (won) {
            // User wins - calculate payout
            uint256 payout = (bet.amountARCS * bet.multiplier) / 100;
            bet.payoutARCS = payout;
            
            // Transfer payout in ARCS to user
            arcsToken.transferFrom(address(this), bet.user, payout, "bet_won");
            
            // If payout > bet amount, house pays the difference
            if (payout > bet.amountARCS) {
                uint256 housePaymentARCS = payout - bet.amountARCS;
                // Convert to USDC equivalent for house vault tracking
                uint256 housePaymentUSDC = housePaymentARCS / 10;
                // Note: In reality, house ARCS are already minted/available
                // This is just accounting - house absorbs the loss
            }
        } else {
            // User loses - ARCS stays in contract (goes to house)
            bet.payoutARCS = 0;
            // Transfer lost ARCS to house vault
            arcsToken.transferFrom(address(this), address(houseVault), bet.amountARCS, "bet_lost_to_house");
        }
        
        emit BetSettled(betId, bet.user, won, bet.payoutARCS);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get bet details
     */
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    /**
     * @notice Get user's bet IDs
     */
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    /**
     * @notice Get user's active bets
     */
    function getUserActiveBets(address user) external view returns (Bet[] memory) {
        uint256[] memory betIds = userBets[user];
        uint256 activeCount = 0;
        
        // Count active bets
        for (uint256 i = 0; i < betIds.length; i++) {
            if (!bets[betIds[i]].settled) {
                activeCount++;
            }
        }
        
        // Build array
        Bet[] memory activeBets = new Bet[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < betIds.length; i++) {
            if (!bets[betIds[i]].settled) {
                activeBets[index] = bets[betIds[i]];
                index++;
            }
        }
        
        return activeBets;
    }
    
    /**
     * @notice Check if asset is supported
     */
    function isAssetSupported(string calldata asset) external view returns (bool) {
        return supportedAssets[asset];
    }
    
    /**
     * @notice Get multiplier for duration
     */
    function getMultiplier(uint256 duration) external view returns (uint256) {
        return durationMultipliers[duration];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update price oracle address
     */
    function setPriceOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        priceOracle = PriceOracle(_oracle);
    }
    
    /**
     * @notice Add or remove supported asset
     */
    function setSupportedAsset(string calldata asset, bool supported) external onlyOwner {
        supportedAssets[asset] = supported;
        emit AssetSupported(asset, supported);
    }
    
    /**
     * @notice Update duration multiplier
     */
    function setDurationMultiplier(uint256 duration, uint256 multiplier) external onlyOwner {
        require(multiplier >= 100 && multiplier <= 1000, "Invalid multiplier");
        durationMultipliers[duration] = multiplier;
        emit MultiplierUpdated(duration, multiplier);
    }
    
    /**
     * @notice Update bet limits
     */
    function setBetLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        require(_minBet < _maxBet, "Invalid limits");
        minBetARCS = _minBet;
        maxBetARCS = _maxBet;
    }
    
    /**
     * @notice Pause betting (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause betting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
