// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IARCSTokenV2 {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title DepositVaultV2 - Treasury Model
 * @notice Deposit USDC to get ARCS, redeem ARCS for USDC
 * @dev Treasury model: USDC deposits = house revenue, not 1:1 backing
 * 
 * KEY CHANGES FROM V1:
 * - ARCS come from treasury (not minted)
 * - ARCS return to treasury (not burned)
 * - USDC deposits = house revenue
 * - USDC redemptions = house payouts
 * - Simpler accounting: Revenue - Payouts = Profit
 */
contract DepositVaultV2 is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice ARCS token contract
    IARCSTokenV2 public immutable arcsToken;
    
    /// @notice Treasury address (holds all ARCS)
    address public treasury;
    
    /// @notice Exchange rate: 10 ARCS = 1 USDC
    uint256 public constant ARCS_PER_USDC = 10;
    
    /// @notice Minimum deposit: 0.1 USDC
    uint256 public constant MIN_DEPOSIT = 0.1 ether;
    
    /// @notice Minimum redemption: 1 ARCS
    uint256 public constant MIN_REDEMPTION = 1 ether;
    
    /// @notice Total USDC deposited (house revenue)
    uint256 public totalDepositsUSDC;
    
    /// @notice Total USDC paid out (house expenses)
    uint256 public totalPayoutsUSDC;
    
    /// @notice User deposit tracking (for accounting)
    mapping(address => uint256) public userDepositsUSDC;
    
    // ============ Events ============
    
    event Deposited(address indexed user, uint256 usdcAmount, uint256 arcsAmount);
    event Redeemed(address indexed user, uint256 arcsAmount, uint256 usdcAmount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    
    // ============ Errors ============
    
    error InvalidAmount(uint256 amount, uint256 min);
    error InsufficientARCS(uint256 available, uint256 needed);
    error InsufficientUSDC(uint256 available, uint256 needed);
    error InsufficientTreasuryARCS(uint256 available, uint256 needed);
    error InsufficientAllowance(uint256 available, uint256 needed);
    error TransferFailed();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    constructor(address _arcsToken, address _treasury) Ownable(msg.sender) {
        if (_arcsToken == address(0) || _treasury == address(0)) revert ZeroAddress();
        arcsToken = IARCSTokenV2(_arcsToken);
        treasury = _treasury;
    }
    
    // ============ User Functions ============
    
    /**
     * @notice Deposit USDC to receive ARCS
     * @dev User sends USDC, gets ARCS from treasury
     * NOTE: Treasury must approve this contract to spend ARCS
     */
    function deposit() external payable nonReentrant whenNotPaused {
        if (msg.value < MIN_DEPOSIT) revert InvalidAmount(msg.value, MIN_DEPOSIT);
        
        // Calculate ARCS to give (10 ARCS per 1 USDC)
        uint256 arcsAmount = msg.value * ARCS_PER_USDC;
        
        // Check treasury has enough ARCS
        uint256 treasuryBalance = arcsToken.balanceOf(treasury);
        if (treasuryBalance < arcsAmount) {
            revert InsufficientTreasuryARCS(treasuryBalance, arcsAmount);
        }
        
        // Check we have allowance from treasury
        uint256 allowance = arcsToken.allowance(treasury, address(this));
        if (allowance < arcsAmount) {
            revert InsufficientAllowance(allowance, arcsAmount);
        }
        
        // Update accounting
        totalDepositsUSDC += msg.value;
        userDepositsUSDC[msg.sender] += msg.value;
        
        // Transfer ARCS from treasury to user
        bool success = arcsToken.transferFrom(treasury, msg.sender, arcsAmount);
        if (!success) revert TransferFailed();
        
        emit Deposited(msg.sender, msg.value, arcsAmount);
    }
    
    /**
     * @notice Redeem ARCS for USDC
     * @dev User returns ARCS to treasury, gets USDC
     */
    function redeem(uint256 arcsAmount) external nonReentrant whenNotPaused {
        if (arcsAmount < MIN_REDEMPTION) revert InvalidAmount(arcsAmount, MIN_REDEMPTION);
        
        // Check user has enough ARCS
        uint256 userBalance = arcsToken.balanceOf(msg.sender);
        if (userBalance < arcsAmount) {
            revert InsufficientARCS(userBalance, arcsAmount);
        }
        
        // Calculate USDC to return (1 USDC per 10 ARCS)
        uint256 usdcAmount = arcsAmount / ARCS_PER_USDC;
        
        // Check contract has enough USDC
        if (address(this).balance < usdcAmount) {
            revert InsufficientUSDC(address(this).balance, usdcAmount);
        }
        
        // Update accounting
        totalPayoutsUSDC += usdcAmount;
        
        // Transfer ARCS from user back to treasury
        arcsToken.transferFrom(msg.sender, treasury, arcsAmount);
        
        // Send USDC to user
        (bool success, ) = payable(msg.sender).call{value: usdcAmount}("");
        if (!success) revert TransferFailed();
        
        emit Redeemed(msg.sender, arcsAmount, usdcAmount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get house profit/loss
     */
    function getHouseProfitLoss() external view returns (int256 profitLoss) {
        // Profit = Deposits - Payouts
        profitLoss = int256(totalDepositsUSDC) - int256(totalPayoutsUSDC);
    }
    
    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get treasury ARCS balance
     */
    function getTreasuryARCSBalance() external view returns (uint256) {
        return arcsToken.balanceOf(treasury);
    }
    
    /**
     * @notice Get vault stats
     */
    function getVaultStats() external view returns (
        uint256 deposits,
        uint256 payouts,
        int256 profit,
        uint256 contractUSDC,
        uint256 treasuryARCS
    ) {
        deposits = totalDepositsUSDC;
        payouts = totalPayoutsUSDC;
        profit = int256(deposits) - int256(payouts);
        contractUSDC = address(this).balance;
        treasuryARCS = arcsToken.balanceOf(treasury);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice Pause deposits/redemptions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause deposits/redemptions
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdrawal (contract migration)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) {
            revert InsufficientUSDC(address(this).balance, amount);
        }
        
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdrawal(to, amount);
    }
    
    /**
     * @notice Receive USDC (for house funding)
     */
    receive() external payable {}
}
