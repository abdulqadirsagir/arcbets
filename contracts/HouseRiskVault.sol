// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ARCSToken.sol";
import "./DepositVault.sol";

/**
 * @title HouseRiskVault
 * @notice Manages house risk capital separately from user deposits
 * @dev House pool pays net winnings when users collectively win
 * 
 * Key Principles:
 * - House capital is SEPARATE from user reserve
 * - Used to absorb variance and pay net winnings
 * - NOT redeemable by users (only by house/owner)
 * - Accepts USDC deposits from protocol/house
 * - Holds ARCS balance for betting operations
 */
contract HouseRiskVault is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice ARCS token contract
    ARCSToken public immutable arcsToken;
    
    /// @notice DepositVault contract for ARCS redemptions
    DepositVault public immutable depositVault;
    
    /// @notice Total USDC deposited by house (risk capital)
    uint256 public houseCapitalUSDC;
    
    /// @notice Authorized betting contracts that can request payouts
    mapping(address => bool) public authorizedBettingContracts;
    
    /// @notice Track total payouts made
    uint256 public totalPayoutsUSDC;
    
    /// @notice Track total rake/fees collected
    uint256 public totalRakeCollectedUSDC;
    
    /// @notice House wallet address (receives withdrawals and rake)
    address public houseWallet;
    
    // ============ Events ============
    
    event HouseDeposit(address indexed from, uint256 amount);
    event HouseWithdrawal(address indexed to, uint256 amount);
    event PayoutRequested(address indexed bettingContract, address indexed winner, uint256 usdcAmount);
    event RakeCollected(uint256 amount);
    event BettingContractAuthorized(address indexed contractAddress, bool authorized);
    event HouseWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event HouseARCSRedeemed(uint256 arcsAmount, uint256 usdcReceived);
    
    // ============ Errors ============
    
    error UnauthorizedBettingContract();
    error InsufficientHouseCapital(uint256 needed, uint256 available);
    error InsufficientARCSBalance(uint256 needed, uint256 available);
    error TransferFailed();
    error ZeroAmount();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    constructor(
        address _arcsToken, 
        address _depositVault,
        address _houseWallet
    ) Ownable(msg.sender) {
        if (_arcsToken == address(0) || _depositVault == address(0) || _houseWallet == address(0)) {
            revert ZeroAddress();
        }
        arcsToken = ARCSToken(_arcsToken);
        depositVault = DepositVault(payable(_depositVault));
        houseWallet = _houseWallet;
    }
    
    // ============ House Capital Management ============
    
    /**
     * @notice Deposit USDC as house risk capital
     * @dev Only owner/house can deposit
     */
    function depositHouseCapital() external payable onlyOwner nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        
        houseCapitalUSDC += msg.value;
        
        emit HouseDeposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw house capital (profits or reduce exposure)
     * @dev Only owner can withdraw to house wallet
     */
    function withdrawHouseCapital(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > houseCapitalUSDC) revert InsufficientHouseCapital(amount, houseCapitalUSDC);
        
        houseCapitalUSDC -= amount;
        
        (bool success, ) = payable(houseWallet).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit HouseWithdrawal(houseWallet, amount);
    }
    
    /**
     * @notice Request payout from house (called by betting contracts)
     * @dev Only authorized betting contracts can request payouts
     * @param winner Address to receive payout
     * @param usdcAmount Amount of USDC to pay out
     */
    function requestPayout(address winner, uint256 usdcAmount) external nonReentrant {
        if (!authorizedBettingContracts[msg.sender]) revert UnauthorizedBettingContract();
        if (winner == address(0)) revert ZeroAddress();
        if (usdcAmount == 0) revert ZeroAmount();
        if (usdcAmount > houseCapitalUSDC) revert InsufficientHouseCapital(usdcAmount, houseCapitalUSDC);
        
        // Deduct from house capital
        houseCapitalUSDC -= usdcAmount;
        totalPayoutsUSDC += usdcAmount;
        
        // Transfer USDC to winner
        (bool success, ) = payable(winner).call{value: usdcAmount}("");
        if (!success) revert TransferFailed();
        
        emit PayoutRequested(msg.sender, winner, usdcAmount);
    }
    
    /**
     * @notice Collect rake/fees (called by betting contracts)
     * @dev Adds fees to house capital
     */
    function collectRake(uint256 amount) external payable nonReentrant {
        if (!authorizedBettingContracts[msg.sender]) revert UnauthorizedBettingContract();
        if (msg.value != amount) revert("Amount mismatch");
        
        houseCapitalUSDC += amount;
        totalRakeCollectedUSDC += amount;
        
        emit RakeCollected(amount);
    }
    
    // ============ ARCS Management (for house betting operations) ============
    
    /**
     * @notice Get house ARCS balance
     * @dev House needs ARCS to take opposite side of user bets
     */
    function getHouseARCSBalance() external view returns (uint256) {
        return arcsToken.balanceOf(address(this));
    }
    
    /**
     * @notice Convert house USDC to ARCS for betting operations
     * @dev House can mint ARCS by locking equivalent USDC
     * @param usdcAmount Amount of USDC to convert
     */
    function convertUSDCtoARCS(uint256 usdcAmount) external onlyOwner nonReentrant {
        if (usdcAmount == 0) revert ZeroAmount();
        if (usdcAmount > houseCapitalUSDC) revert InsufficientHouseCapital(usdcAmount, houseCapitalUSDC);
        
        // ARCS rate: 1 USDC = 10 ARCS
        uint256 arcsAmount = (usdcAmount * 10) / 1 ether;
        
        // Lock USDC in house capital (already tracked)
        // Mint ARCS to house vault
        arcsToken.mint(address(this), arcsAmount * 1 ether, usdcAmount);
    }
    
    /**
     * @notice Redeem house ARCS back to USDC (Option A - One-step redemption)
     * @dev Only owner can redeem. This is the clean, automated way for house to convert ARCS → USDC
     * @param arcsAmount Amount of ARCS to redeem (in wei, e.g., 5 ether = 5 ARCS)
     * 
     * How it works:
     * 1. Check house has enough ARCS
     * 2. Call DepositVault.redeem() which burns ARCS and sends USDC to this contract
     * 3. USDC automatically received via this contract's balance
     * 4. Sync houseCapitalUSDC tracking
     * 5. House can then withdraw via withdrawHouseCapital()
     */
    function redeemHouseARCS(uint256 arcsAmount) external onlyOwner nonReentrant {
        if (arcsAmount == 0) revert ZeroAmount();
        
        // Check house has enough ARCS
        uint256 houseARCSBalance = arcsToken.balanceOf(address(this));
        if (arcsAmount > houseARCSBalance) {
            revert InsufficientARCSBalance(arcsAmount, houseARCSBalance);
        }
        
        // Get balance before redemption
        uint256 balanceBefore = address(this).balance;
        
        // Call DepositVault.redeem() - this burns ARCS and sends USDC to this contract
        // The DepositVault will transfer USDC to address(this)
        depositVault.redeem(arcsAmount);
        
        // Get balance after redemption
        uint256 balanceAfter = address(this).balance;
        uint256 usdcReceived = balanceAfter - balanceBefore;
        
        // Update house capital tracking
        houseCapitalUSDC += usdcReceived;
        
        emit HouseARCSRedeemed(arcsAmount, usdcReceived);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get house vault stats
     */
    function getHouseStats() external view returns (
        uint256 capitalUSDC,
        uint256 arcsBalance,
        uint256 totalPayouts,
        uint256 totalRake,
        uint256 netProfit
    ) {
        capitalUSDC = houseCapitalUSDC;
        arcsBalance = arcsToken.balanceOf(address(this));
        totalPayouts = totalPayoutsUSDC;
        totalRake = totalRakeCollectedUSDC;
        
        // Net profit = deposits + rake - payouts
        if (totalRakeCollectedUSDC > totalPayoutsUSDC) {
            netProfit = totalRakeCollectedUSDC - totalPayoutsUSDC;
        } else {
            netProfit = 0; // House is net negative
        }
    }
    
    /**
     * @notice Check if house can cover a potential payout
     */
    function canCoverPayout(uint256 usdcAmount) external view returns (bool) {
        return houseCapitalUSDC >= usdcAmount;
    }
    
    /**
     * @notice Get available house liquidity
     */
    function getAvailableLiquidity() external view returns (uint256) {
        return houseCapitalUSDC;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a betting contract to request payouts
     */
    function authorizeBettingContract(address contractAddress, bool authorized) external onlyOwner {
        if (contractAddress == address(0)) revert ZeroAddress();
        authorizedBettingContracts[contractAddress] = authorized;
        emit BettingContractAuthorized(contractAddress, authorized);
    }
    
    /**
     * @notice Update house wallet address
     */
    function setHouseWallet(address _houseWallet) external onlyOwner {
        if (_houseWallet == address(0)) revert ZeroAddress();
        address oldWallet = houseWallet;
        houseWallet = _houseWallet;
        emit HouseWalletUpdated(oldWallet, _houseWallet);
    }
    
    /**
     * @notice Sync tracked capital with actual balance (for direct transfers)
     * @dev Use when USDC was sent directly to vault without calling depositHouseCapital
     */
    function syncCapitalTracking() external onlyOwner nonReentrant {
        uint256 actualBalance = address(this).balance;
        uint256 trackedCapital = houseCapitalUSDC;
        
        if (actualBalance > trackedCapital) {
            uint256 difference = actualBalance - trackedCapital;
            houseCapitalUSDC = actualBalance;
            emit HouseDeposit(msg.sender, difference);
        }
        // If actualBalance < trackedCapital, don't change (indicates accounting issue)
    }
    
    /**
     * @notice Pause house operations (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause house operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Accept USDC deposits (adds to house capital)
     */
    receive() external payable {
        if (msg.value > 0) {
            houseCapitalUSDC += msg.value;
            emit HouseDeposit(msg.sender, msg.value);
        }
    }
}
