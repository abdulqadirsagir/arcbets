// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ARCSTokenV2.sol";
import "./PriceOracle.sol";

/**
 * @title BettingEngineARCSV2 - Treasury Model
 * @notice Binary options betting with ARCS tokens (treasury model)
 * @dev User bets ARCS, wins come from treasury, losses return to treasury
 * 
 * KEY CHANGES FROM V1:
 * - Bet ARCS sent to contract (locked)
 * - If WIN: Original bet returned + profit from treasury
 * - If LOSE: Bet returned to treasury
 * - Treasury always has ARCS to pay winners
 * - Simple, reliable payouts
 */
contract BettingEngineARCSV2 is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    ARCSTokenV2 public immutable arcsToken;
    PriceOracle public immutable priceOracle;
    address public treasury;
    
    uint256 private _betCounter;
    
    // ============ Structs ============
    
    struct Bet {
        address user;
        string asset;           // "BTC", "ETH", "SOL"
        bool isLong;           // true = UP, false = DOWN
        uint256 amountARCS;
        uint256 entryPrice;
        uint256 exitPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 multiplier;    // 150 = 1.5x, 200 = 2x, etc
        uint256 payoutARCS;
        bool settled;
        bool won;
    }
    
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;
    
    uint256 public totalActiveBetsARCS;
    
    // ============ Constants ============
    
    uint256 public constant MIN_BET = 1 ether;      // 1 ARCS
    uint256 public constant MAX_BET = 100 ether;    // 100 ARCS
    
    // Durations and multipliers
    uint256 public constant DURATION_1H = 1 hours;
    uint256 public constant DURATION_3H = 3 hours;
    uint256 public constant DURATION_6H = 6 hours;
    uint256 public constant DURATION_12H = 12 hours;
    uint256 public constant DURATION_24H = 24 hours;
    uint256 public constant DURATION_48H = 48 hours;
    uint256 public constant DURATION_7D = 7 days;
    
    uint256 public constant MULTIPLIER_1H = 150;   // 1.5x
    uint256 public constant MULTIPLIER_3H = 180;   // 1.8x
    uint256 public constant MULTIPLIER_6H = 200;   // 2.0x
    uint256 public constant MULTIPLIER_12H = 250;  // 2.5x
    uint256 public constant MULTIPLIER_24H = 300;  // 3.0x
    uint256 public constant MULTIPLIER_48H = 350;  // 3.5x
    uint256 public constant MULTIPLIER_7D = 400;   // 4.0x
    
    // ============ Events ============
    
    event BetPlaced(
        uint256 indexed betId,
        address indexed user,
        string asset,
        bool isLong,
        uint256 amountARCS,
        uint256 entryPrice,
        uint256 endTime,
        uint256 multiplier
    );
    
    event BetSettled(
        uint256 indexed betId,
        address indexed user,
        bool won,
        uint256 payoutARCS,
        uint256 exitPrice
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // ============ Errors ============
    
    error InvalidAmount(uint256 amount, uint256 min, uint256 max);
    error InvalidDuration(uint256 duration);
    error InvalidAsset(string asset);
    error BetNotExpired(uint256 currentTime, uint256 endTime);
    error BetAlreadySettled();
    error InsufficientARCS(uint256 available, uint256 needed);
    error InsufficientTreasuryARCS(uint256 available, uint256 needed);
    error PriceNotAvailable();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    constructor(
        address _arcsToken,
        address _priceOracle,
        address _treasury
    ) Ownable(msg.sender) {
        if (_arcsToken == address(0) || _priceOracle == address(0) || _treasury == address(0)) {
            revert ZeroAddress();
        }
        arcsToken = ARCSTokenV2(_arcsToken);
        priceOracle = PriceOracle(_priceOracle);
        treasury = _treasury;
    }
    
    // ============ Betting Functions ============
    
    /**
     * @notice Place a bet
     * @param asset Asset to bet on ("BTC", "ETH", "SOL")
     * @param isLong true = bet price goes UP, false = bet price goes DOWN
     * @param amountARCS Amount of ARCS to bet
     * @param duration Bet duration in seconds
     */
    function placeBet(
        string calldata asset,
        bool isLong,
        uint256 amountARCS,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256 betId) {
        // Validate inputs
        if (amountARCS < MIN_BET || amountARCS > MAX_BET) {
            revert InvalidAmount(amountARCS, MIN_BET, MAX_BET);
        }
        
        uint256 multiplier = _getMultiplier(duration);
        if (multiplier == 0) revert InvalidDuration(duration);
        
        if (!_isValidAsset(asset)) revert InvalidAsset(asset);
        
        // Get current price
        (uint256 entryPrice, ) = priceOracle.getPrice(asset);
        if (entryPrice == 0) revert PriceNotAvailable();
        
        // Check user has enough ARCS
        uint256 userBalance = arcsToken.balanceOf(msg.sender);
        if (userBalance < amountARCS) {
            revert InsufficientARCS(userBalance, amountARCS);
        }
        
        // Calculate potential payout and check treasury can cover it
        uint256 potentialPayout = (amountARCS * multiplier) / 100;
        uint256 profit = potentialPayout - amountARCS;
        uint256 treasuryBalance = arcsToken.balanceOf(treasury);
        if (treasuryBalance < profit) {
            revert InsufficientTreasuryARCS(treasuryBalance, profit);
        }
        
        // Transfer ARCS from user to contract (bet locked)
        bool success = arcsToken.transferFrom(msg.sender, address(this), amountARCS);
        require(success, "ARCS transfer failed");
        
        // Create bet
        betId = ++_betCounter;
        uint256 endTime = block.timestamp + duration;
        
        bets[betId] = Bet({
            user: msg.sender,
            asset: asset,
            isLong: isLong,
            amountARCS: amountARCS,
            entryPrice: entryPrice,
            exitPrice: 0,
            startTime: block.timestamp,
            endTime: endTime,
            multiplier: multiplier,
            payoutARCS: 0,
            settled: false,
            won: false
        });
        
        userBets[msg.sender].push(betId);
        totalActiveBetsARCS += amountARCS;
        
        emit BetPlaced(betId, msg.sender, asset, isLong, amountARCS, entryPrice, endTime, multiplier);
    }
    
    /**
     * @notice Settle a bet (anyone can call after expiry)
     */
    function settleBet(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        
        if (bet.settled) revert BetAlreadySettled();
        if (block.timestamp < bet.endTime) {
            revert BetNotExpired(block.timestamp, bet.endTime);
        }
        
        // Get exit price
        (uint256 exitPrice, ) = priceOracle.getPrice(bet.asset);
        if (exitPrice == 0) revert PriceNotAvailable();
        
        bet.exitPrice = exitPrice;
        bet.settled = true;
        
        // Determine if user won
        bool won;
        if (bet.isLong) {
            won = exitPrice > bet.entryPrice;  // UP bet wins if price increased
        } else {
            won = exitPrice < bet.entryPrice;  // DOWN bet wins if price decreased
        }
        
        bet.won = won;
        
        if (won) {
            // USER WINS
            uint256 payout = (bet.amountARCS * bet.multiplier) / 100;
            bet.payoutARCS = payout;
            
            // Return original bet from contract
            arcsToken.transfer(bet.user, bet.amountARCS);
            
            // Pay profit from treasury
            uint256 profit = payout - bet.amountARCS;
            if (profit > 0) {
                arcsToken.transferFrom(treasury, bet.user, profit);
            }
        } else {
            // USER LOSES
            bet.payoutARCS = 0;
            
            // Return lost ARCS to treasury
            arcsToken.transfer(treasury, bet.amountARCS);
        }
        
        totalActiveBetsARCS -= bet.amountARCS;
        
        emit BetSettled(betId, bet.user, won, bet.payoutARCS, exitPrice);
    }
    
    // ============ View Functions ============
    
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    function getUserActiveBets(address user) external view returns (uint256[] memory) {
        uint256[] memory allBets = userBets[user];
        uint256 activeCount = 0;
        
        // Count active bets
        for (uint256 i = 0; i < allBets.length; i++) {
            if (!bets[allBets[i]].settled) {
                activeCount++;
            }
        }
        
        // Create array of active bet IDs
        uint256[] memory activeBets = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allBets.length; i++) {
            if (!bets[allBets[i]].settled) {
                activeBets[index] = allBets[i];
                index++;
            }
        }
        
        return activeBets;
    }
    
    function getTotalBets() external view returns (uint256) {
        return _betCounter;
    }
    
    // ============ Internal Functions ============
    
    function _getMultiplier(uint256 duration) internal pure returns (uint256) {
        if (duration == DURATION_1H) return MULTIPLIER_1H;
        if (duration == DURATION_3H) return MULTIPLIER_3H;
        if (duration == DURATION_6H) return MULTIPLIER_6H;
        if (duration == DURATION_12H) return MULTIPLIER_12H;
        if (duration == DURATION_24H) return MULTIPLIER_24H;
        if (duration == DURATION_48H) return MULTIPLIER_48H;
        if (duration == DURATION_7D) return MULTIPLIER_7D;
        return 0;
    }
    
    function _isValidAsset(string calldata asset) internal pure returns (bool) {
        return (
            keccak256(bytes(asset)) == keccak256(bytes("BTC")) ||
            keccak256(bytes(asset)) == keccak256(bytes("ETH")) ||
            keccak256(bytes(asset)) == keccak256(bytes("SOL"))
        );
    }
    
    // ============ Admin Functions ============
    
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
