// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ARCSToken.sol";

/**
 * @title DepositVault
 * @notice Handles USDC ↔ ARCS conversion with full backing guarantee
 * @dev This is the ONLY contract that mints/burns ARCS
 * 
 * Core Mechanics:
 * - Deposit: 1 USDC (native) → 10 ARCS
 * - Redeem: 10 ARCS → 1 USDC (native)
 * - User Reserve: Tracks USDC backing for user ARCS
 * - Maintains 100% reserve ratio for user deposits
 */
contract DepositVault is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    
    /// @notice Fixed exchange rate: 1 USDC = 10 ARCS
    uint256 public constant ARCS_PER_USDC = 10;
    
    /// @notice Minimum deposit (0.1 USDC = 1 ARCS)
    uint256 public constant MIN_DEPOSIT = 0.1 ether;
    
    /// @notice Minimum redemption (1 ARCS = 0.1 USDC)
    uint256 public constant MIN_REDEMPTION = 1 ether; // 1 ARCS in wei
    
    // ============ State Variables ============
    
    /// @notice ARCS token contract
    ARCSToken public immutable arcsToken;
    
    /// @notice Total USDC deposited by users (reserve backing)
    uint256 public userReserveUSDC;
    
    /// @notice Track individual user deposits for accounting
    mapping(address => uint256) public userUSDCDeposited;
    
    /// @notice Track house redemptions separately for accounting
    uint256 public houseRedemptionsUSDC;
    
    /// @notice House vault address (for tracking house vs user redemptions)
    address public houseVault;
    
    /// @notice Emergency withdrawal address (if contract needs migration)
    address public emergencyWithdrawalAddress;
    
    // ============ Events ============
    
    event Deposited(address indexed user, uint256 usdcAmount, uint256 arcsAmount);
    event Redeemed(address indexed user, uint256 arcsAmount, uint256 usdcAmount, bool isHouse);
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    event HouseVaultUpdated(address indexed oldVault, address indexed newVault);
    
    // ============ Errors ============
    
    error InsufficientDeposit(uint256 sent, uint256 required);
    error InsufficientARCSBalance(uint256 requested, uint256 available);
    error InsufficientReserve(uint256 needed, uint256 available);
    error InvalidRedemptionAmount(uint256 amount);
    error TransferFailed();
    error ZeroAmount();
    
    // ============ Constructor ============
    
    constructor(address _arcsToken) Ownable(msg.sender) {
        if (_arcsToken == address(0)) revert("Zero address");
        arcsToken = ARCSToken(_arcsToken);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Deposit USDC to receive ARCS
     * @dev User sends native USDC, receives 10 ARCS per 1 USDC
     */
    function deposit() external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        if (msg.value < MIN_DEPOSIT) revert InsufficientDeposit(msg.value, MIN_DEPOSIT);
        
        // Calculate ARCS to mint (1 USDC = 10 ARCS)
        // msg.value is already in wei (18 decimals), multiply by 10 to get ARCS in wei
        uint256 arcsToMint = msg.value * ARCS_PER_USDC;
        
        // Update reserves
        userReserveUSDC += msg.value;
        userUSDCDeposited[msg.sender] += msg.value;
        
        // Mint ARCS to user
        arcsToken.mint(msg.sender, arcsToMint, msg.value);
        
        emit Deposited(msg.sender, msg.value, arcsToMint);
    }
    
    /**
     * @notice Redeem ARCS for USDC
     * @dev Burns user's ARCS and returns equivalent USDC
     * @param arcsAmount Amount of ARCS to redeem (must be multiple of 1 ARCS)
     */
    function redeem(uint256 arcsAmount) external nonReentrant whenNotPaused {
        if (arcsAmount == 0) revert ZeroAmount();
        if (arcsAmount < MIN_REDEMPTION) revert InvalidRedemptionAmount(arcsAmount);
        
        // Check user has enough ARCS
        uint256 userBalance = arcsToken.balanceOf(msg.sender);
        if (userBalance < arcsAmount) revert InsufficientARCSBalance(arcsAmount, userBalance);
        
        // Calculate USDC to return (10 ARCS = 1 USDC)
        // arcsAmount is in wei (18 decimals), divide by 10 to get USDC in wei
        uint256 usdcToReturn = arcsAmount / ARCS_PER_USDC;
        
        // Check reserve has enough USDC
        if (userReserveUSDC < usdcToReturn) revert InsufficientReserve(usdcToReturn, userReserveUSDC);
        
        // Check if caller is house vault for tracking
        bool isHouse = (msg.sender == houseVault);
        
        // Update reserves BEFORE burning (CEI pattern)
        userReserveUSDC -= usdcToReturn;
        
        if (isHouse) {
            // Track house redemptions separately
            houseRedemptionsUSDC += usdcToReturn;
        } else {
            // Track user redemptions
            if (userUSDCDeposited[msg.sender] >= usdcToReturn) {
                userUSDCDeposited[msg.sender] -= usdcToReturn;
            } else {
                userUSDCDeposited[msg.sender] = 0;
            }
        }
        
        // Burn ARCS from caller
        arcsToken.burn(msg.sender, arcsAmount, usdcToReturn);
        
        // Transfer USDC to caller
        (bool success, ) = payable(msg.sender).call{value: usdcToReturn}("");
        if (!success) revert TransferFailed();
        
        emit Redeemed(msg.sender, arcsAmount, usdcToReturn, isHouse);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get reserve ratio (should always be 100% for user deposits)
     * @return Ratio in basis points (10000 = 100%)
     */
    function getReserveRatio() external view returns (uint256) {
        uint256 totalARCS = arcsToken.totalSupply();
        if (totalARCS == 0) return 10000; // 100% if no ARCS issued
        
        uint256 requiredUSDC = (totalARCS * 1 ether) / ARCS_PER_USDC;
        if (requiredUSDC == 0) return 10000;
        
        return (userReserveUSDC * 10000) / requiredUSDC;
    }
    
    /**
     * @notice Check if vault is solvent (has enough USDC to back all ARCS)
     */
    function isSolvent() external view returns (bool) {
        uint256 totalARCS = arcsToken.totalSupply();
        uint256 requiredUSDC = (totalARCS * 1 ether) / ARCS_PER_USDC;
        return userReserveUSDC >= requiredUSDC;
    }
    
    /**
     * @notice Get user's ARCS balance and equivalent USDC value
     */
    function getUserInfo(address user) external view returns (
        uint256 arcsBalance,
        uint256 usdcValue,
        uint256 totalDeposited
    ) {
        arcsBalance = arcsToken.balanceOf(user);
        usdcValue = (arcsBalance * 1 ether) / ARCS_PER_USDC;
        totalDeposited = userUSDCDeposited[user];
    }
    
    /**
     * @notice Get vault stats
     */
    function getVaultStats() external view returns (
        uint256 totalARCSIssued,
        uint256 reserveUSDC,
        uint256 reserveRatio,
        bool solvent
    ) {
        totalARCSIssued = arcsToken.totalSupply();
        reserveUSDC = userReserveUSDC;
        
        uint256 requiredUSDC = (totalARCSIssued * 1 ether) / ARCS_PER_USDC;
        reserveRatio = requiredUSDC > 0 ? (reserveUSDC * 10000) / requiredUSDC : 10000;
        solvent = reserveUSDC >= requiredUSDC;
    }
    
    /**
     * @notice Get house redemption stats
     */
    function getHouseRedemptionStats() external view returns (
        uint256 totalHouseRedemptions,
        uint256 houseRedemptionPercentage
    ) {
        totalHouseRedemptions = houseRedemptionsUSDC;
        
        // Calculate what % of total redemptions were house redemptions
        uint256 totalReserveUsed = userReserveUSDC > 0 ? houseRedemptionsUSDC : 0;
        if (totalReserveUsed > 0) {
            houseRedemptionPercentage = (houseRedemptionsUSDC * 10000) / totalReserveUsed;
        } else {
            houseRedemptionPercentage = 0;
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Pause deposits and redemptions (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause deposits and redemptions
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Set house vault address (for tracking house redemptions)
     */
    function setHouseVault(address _houseVault) external onlyOwner {
        require(_houseVault != address(0), "Zero address");
        address oldVault = houseVault;
        houseVault = _houseVault;
        emit HouseVaultUpdated(oldVault, _houseVault);
    }
    
    /**
     * @notice Set emergency withdrawal address (for contract migration)
     */
    function setEmergencyWithdrawalAddress(address _address) external onlyOwner {
        require(_address != address(0), "Zero address");
        emergencyWithdrawalAddress = _address;
    }
    
    /**
     * @notice Emergency withdrawal (ONLY if contract needs migration)
     * @dev Requires all ARCS to be burned first (ensures no user funds lost)
     */
    function emergencyWithdraw() external onlyOwner {
        require(emergencyWithdrawalAddress != address(0), "Emergency address not set");
        require(arcsToken.totalSupply() == 0, "ARCS still outstanding");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success, ) = payable(emergencyWithdrawalAddress).call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdrawal(emergencyWithdrawalAddress, balance);
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Accept USDC deposits via direct transfer
     * @dev Automatically converts to ARCS
     */
    receive() external payable {
        if (msg.value > 0 && !paused()) {
            // Auto-convert to ARCS
            this.deposit{value: msg.value}();
        }
    }
}
