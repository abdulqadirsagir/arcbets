// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ARCSToken.sol";
import "./DepositVault.sol";
import "./HouseRiskVault.sol";
import "./BettingEngineARCS.sol";

/**
 * @title SystemSolvency
 * @notice Unified view of entire system solvency and health
 * @dev Read-only contract for monitoring system state
 * 
 * Golden Rule:
 * totalARCS_outstanding <= (userReserveUSDC + houseRiskPoolUSDC) * 10
 */
contract SystemSolvency {
    
    // ============ Contracts ============
    
    ARCSToken public immutable arcsToken;
    DepositVault public immutable depositVault;
    HouseRiskVault public immutable houseVault;
    BettingEngineARCS public immutable bettingEngine;
    
    // ============ Constructor ============
    
    constructor(
        address _arcsToken,
        address payable _depositVault,
        address payable _houseVault,
        address _bettingEngine
    ) {
        require(_arcsToken != address(0), "Zero address");
        require(_depositVault != address(0), "Zero address");
        require(_houseVault != address(0), "Zero address");
        require(_bettingEngine != address(0), "Zero address");
        
        arcsToken = ARCSToken(_arcsToken);
        depositVault = DepositVault(_depositVault);
        houseVault = HouseRiskVault(_houseVault);
        bettingEngine = BettingEngineARCS(_bettingEngine);
    }
    
    // ============ System-Wide View Functions ============
    
    /**
     * @notice Get complete system overview (UPDATED with House ARCS)
     */
    function getSystemOverview() external view returns (
        uint256 totalARCSCirculating,
        uint256 userReserveUSDC,
        uint256 houseCapitalUSDC,
        uint256 totalBackingUSDC,
        uint256 requiredUSDC,
        bool isSolvent,
        uint256 solvencyRatio,
        uint256 houseARCSBalance
    ) {
        // ARCS data
        totalARCSCirculating = arcsToken.totalSupply();
        
        // User reserve data
        userReserveUSDC = depositVault.userReserveUSDC();
        
        // House capital data
        (houseCapitalUSDC, houseARCSBalance, , , ) = houseVault.getHouseStats();
        
        // Total backing
        totalBackingUSDC = userReserveUSDC + houseCapitalUSDC;
        
        // Required USDC to back all ARCS (10 ARCS = 1 USDC)
        requiredUSDC = totalARCSCirculating / 10;
        
        // Solvency check
        isSolvent = totalBackingUSDC >= requiredUSDC;
        
        // Solvency ratio (10000 = 100%)
        if (requiredUSDC > 0) {
            solvencyRatio = (totalBackingUSDC * 10000) / requiredUSDC;
        } else {
            solvencyRatio = 10000; // 100% if no ARCS outstanding
        }
    }
    
    /**
     * @notice Get detailed ARCS distribution
     */
    function getARCSDistribution() external view returns (
        uint256 totalARCS,
        uint256 userARCS,
        uint256 houseARCS,
        uint256 bettingEngineARCS,
        uint256 activeInBetsARCS
    ) {
        totalARCS = arcsToken.totalSupply();
        houseARCS = arcsToken.balanceOf(address(houseVault));
        bettingEngineARCS = arcsToken.balanceOf(address(bettingEngine));
        activeInBetsARCS = bettingEngine.totalActiveBetsARCS();
        
        // User ARCS = Total - House - BettingEngine
        userARCS = totalARCS - houseARCS - bettingEngineARCS;
    }
    
    /**
     * @notice Get user reserve health
     */
    function getUserReserveHealth() external view returns (
        uint256 totalUserARCS,
        uint256 userReserveUSDC,
        uint256 requiredUSDC,
        uint256 reserveRatio,
        bool fullyBacked
    ) {
        // Calculate user ARCS (excluding house and betting engine)
        uint256 totalARCS = arcsToken.totalSupply();
        uint256 houseARCS = arcsToken.balanceOf(address(houseVault));
        uint256 bettingEngineARCS = arcsToken.balanceOf(address(bettingEngine));
        totalUserARCS = totalARCS - houseARCS - bettingEngineARCS;
        
        // Get user reserve
        userReserveUSDC = depositVault.userReserveUSDC();
        
        // Required USDC
        requiredUSDC = totalUserARCS / 10;
        
        // Reserve ratio
        reserveRatio = depositVault.getReserveRatio();
        
        // Check if fully backed
        fullyBacked = userReserveUSDC >= requiredUSDC;
    }
    
    /**
     * @notice Get house risk exposure (UPDATED with more details)
     */
    function getHouseRiskExposure() external view returns (
        uint256 houseCapitalUSDC,
        uint256 houseARCS,
        uint256 houseARCSValueUSDC,
        uint256 activeUserBetsARCS,
        uint256 maxPotentialLossUSDC,
        uint256 utilizationRatio
    ) {
        // House capital
        (houseCapitalUSDC, houseARCS, , , ) = houseVault.getHouseStats();
        
        // House ARCS value in USDC (10 ARCS = 1 USDC)
        houseARCSValueUSDC = houseARCS / 10;
        
        // Active bets
        activeUserBetsARCS = bettingEngine.totalActiveBetsARCS();
        
        // Max potential loss (if all active bets win at max multiplier ~4x)
        // Simplified: assume average 2x multiplier
        maxPotentialLossUSDC = (activeUserBetsARCS * 2) / 10;
        
        // Utilization ratio
        if (houseCapitalUSDC > 0) {
            utilizationRatio = (maxPotentialLossUSDC * 10000) / houseCapitalUSDC;
        } else {
            utilizationRatio = 0;
        }
    }
    
    /**
     * @notice Get betting activity stats
     */
    function getBettingStats() external view returns (
        uint256 totalActiveBetsARCS,
        uint256 totalActiveBetsUSDC,
        uint256 minBetARCS,
        uint256 maxBetARCS
    ) {
        totalActiveBetsARCS = bettingEngine.totalActiveBetsARCS();
        totalActiveBetsUSDC = totalActiveBetsARCS / 10;
        minBetARCS = bettingEngine.minBetARCS();
        maxBetARCS = bettingEngine.maxBetARCS();
    }
    
    /**
     * @notice Check system health status
     * @return status 0 = Healthy, 1 = Warning, 2 = Critical
     * @return message Status message
     */
    function getSystemHealth() external view returns (
        uint8 status,
        string memory message
    ) {
        // Calculate solvency
        uint256 totalARCS = arcsToken.totalSupply();
        uint256 userReserve = depositVault.userReserveUSDC();
        (uint256 houseCapital, , , , ) = houseVault.getHouseStats();
        
        uint256 totalBacking = userReserve + houseCapital;
        uint256 requiredUSDC = totalARCS / 10;
        
        if (totalBacking >= requiredUSDC) {
            // Check reserve ratio
            uint256 ratio = depositVault.getReserveRatio();
            if (ratio >= 10000) {
                status = 0; // Healthy
                message = "System fully solvent and healthy";
            } else if (ratio >= 9000) {
                status = 1; // Warning
                message = "System solvent but reserve ratio below 90%";
            } else {
                status = 2; // Critical
                message = "System solvent but reserve ratio critically low";
            }
        } else {
            status = 2; // Critical
            message = "System INSOLVENT - insufficient backing";
        }
    }
    
    /**
     * @notice Verify solvency invariant (The Golden Rule)
     * @return valid True if invariant holds
     * @return message Explanation
     */
    function verifySolvencyInvariant() external view returns (
        bool valid,
        string memory message
    ) {
        uint256 totalARCS = arcsToken.totalSupply();
        uint256 userReserve = depositVault.userReserveUSDC();
        (uint256 houseCapital, , , , ) = houseVault.getHouseStats();
        
        uint256 totalBacking = userReserve + houseCapital;
        uint256 requiredUSDC = totalARCS / 10;
        
        valid = totalBacking >= requiredUSDC;
        
        if (valid) {
            message = "Solvency invariant satisfied: totalBacking >= requiredUSDC";
        } else {
            message = "CRITICAL: Solvency invariant VIOLATED";
        }
    }
    
    /**
     * @notice Get user-specific info
     */
    function getUserInfo(address user) external view returns (
        uint256 arcsBalance,
        uint256 usdcValue,
        uint256 totalDeposited,
        uint256 activeBetsCount
    ) {
        arcsBalance = arcsToken.balanceOf(user);
        usdcValue = arcsBalance / 10;
        (, , totalDeposited) = depositVault.getUserInfo(user);
        
        uint256[] memory betIds = bettingEngine.getUserBets(user);
        activeBetsCount = 0;
        for (uint256 i = 0; i < betIds.length; i++) {
            (,,,,,,,,,, bool settled,,) = bettingEngine.bets(betIds[i]);
            if (!settled) {
                activeBetsCount++;
            }
        }
    }
    
    /**
     * @notice Get detailed metrics for dashboards (UPDATED with house redemptions)
     */
    function getDetailedMetrics() external view returns (
        // ARCS metrics
        uint256 totalARCS,
        uint256 userARCS,
        uint256 houseARCS,
        uint256 houseARCSValueUSDC,
        // USDC metrics
        uint256 userReserveUSDC,
        uint256 houseCapitalUSDC,
        uint256 totalBackingUSDC,
        uint256 houseRedemptionsUSDC,
        // Ratios
        uint256 solvencyRatio,
        uint256 reserveRatio,
        // Activity
        uint256 activeBetsARCS,
        uint256 activeBetsUSDC,
        // Status
        bool isSolvent,
        uint8 healthStatus
    ) {
        // ARCS
        totalARCS = arcsToken.totalSupply();
        houseARCS = arcsToken.balanceOf(address(houseVault));
        userARCS = totalARCS - houseARCS - arcsToken.balanceOf(address(bettingEngine));
        houseARCSValueUSDC = houseARCS / 10;
        
        // USDC
        userReserveUSDC = depositVault.userReserveUSDC();
        (houseCapitalUSDC, , , , ) = houseVault.getHouseStats();
        totalBackingUSDC = userReserveUSDC + houseCapitalUSDC;
        houseRedemptionsUSDC = depositVault.houseRedemptionsUSDC();
        
        // Ratios
        uint256 requiredUSDC = totalARCS / 10;
        if (requiredUSDC > 0) {
            solvencyRatio = (totalBackingUSDC * 10000) / requiredUSDC;
        } else {
            solvencyRatio = 10000;
        }
        reserveRatio = depositVault.getReserveRatio();
        
        // Activity
        activeBetsARCS = bettingEngine.totalActiveBetsARCS();
        activeBetsUSDC = activeBetsARCS / 10;
        
        // Status
        isSolvent = totalBackingUSDC >= requiredUSDC;
        (healthStatus, ) = this.getSystemHealth();
    }
}
