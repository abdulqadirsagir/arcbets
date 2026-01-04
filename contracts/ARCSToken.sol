// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ARCSToken
 * @notice Internal betting chip system with non-transferable balances
 * @dev NOT an ERC20 - purely internal accounting
 * 
 * ARCS = Casino chips for betting
 * - Non-transferable between users
 * - Only minted via USDC deposits (1 USDC = 10 ARCS)
 * - Only burned via USDC redemptions (10 ARCS = 1 USDC)
 * - Can be transferred to/from betting contracts by authorized addresses
 */
contract ARCSToken is Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    /// @notice User ARCS balances (internal ledger)
    mapping(address => uint256) private _balances;
    
    /// @notice Total ARCS in circulation
    uint256 private _totalSupply;
    
    /// @notice Authorized contracts that can move ARCS (betting engine, etc)
    mapping(address => bool) public authorizedContracts;
    
    // ============ Events ============
    
    event ARCSMinted(address indexed user, uint256 amount, uint256 usdcDeposited);
    event ARCSBurned(address indexed user, uint256 amount, uint256 usdcRedeemed);
    event ARCSTransferred(address indexed from, address indexed to, uint256 amount, string reason);
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    
    // ============ Errors ============
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error UnauthorizedContract(address caller);
    error ZeroAmount();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ View Functions ============
    
    /**
     * @notice Get ARCS balance of an address
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @notice Get total ARCS in circulation
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * @notice Check if contract is authorized to move ARCS
     */
    function isAuthorized(address contractAddress) external view returns (bool) {
        return authorizedContracts[contractAddress];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a contract to move ARCS (betting engine, etc)
     */
    function authorizeContract(address contractAddress, bool authorized) external onlyOwner {
        if (contractAddress == address(0)) revert ZeroAddress();
        authorizedContracts[contractAddress] = authorized;
        emit ContractAuthorized(contractAddress, authorized);
    }
    
    // ============ Minting & Burning (Only by authorized contracts) ============
    
    /**
     * @notice Mint ARCS to a user (called by DepositVault)
     * @dev Only authorized contracts can call this
     */
    function mint(address to, uint256 amount, uint256 usdcAmount) external nonReentrant {
        if (!authorizedContracts[msg.sender]) revert UnauthorizedContract(msg.sender);
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        
        _balances[to] += amount;
        _totalSupply += amount;
        
        emit ARCSMinted(to, amount, usdcAmount);
    }
    
    /**
     * @notice Burn ARCS from a user (called by DepositVault on redemption)
     * @dev Only authorized contracts can call this
     */
    function burn(address from, uint256 amount, uint256 usdcAmount) external nonReentrant {
        if (!authorizedContracts[msg.sender]) revert UnauthorizedContract(msg.sender);
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_balances[from] < amount) revert InsufficientBalance(amount, _balances[from]);
        
        _balances[from] -= amount;
        _totalSupply -= amount;
        
        emit ARCSBurned(from, amount, usdcAmount);
    }
    
    /**
     * @notice Transfer ARCS between addresses (betting contracts only)
     * @dev Only authorized contracts can call this (NOT users)
     * @param reason Short description of why (e.g., "bet_placed", "payout", "refund")
     */
    function transferFrom(
        address from, 
        address to, 
        uint256 amount,
        string calldata reason
    ) external nonReentrant {
        if (!authorizedContracts[msg.sender]) revert UnauthorizedContract(msg.sender);
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_balances[from] < amount) revert InsufficientBalance(amount, _balances[from]);
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit ARCSTransferred(from, to, amount, reason);
    }
    
    /**
     * @notice Batch transfer for efficiency (betting settlements)
     */
    function batchTransfer(
        address[] calldata froms,
        address[] calldata tos,
        uint256[] calldata amounts,
        string calldata reason
    ) external nonReentrant {
        if (!authorizedContracts[msg.sender]) revert UnauthorizedContract(msg.sender);
        
        uint256 length = froms.length;
        require(length == tos.length && length == amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < length; i++) {
            address from = froms[i];
            address to = tos[i];
            uint256 amount = amounts[i];
            
            if (from == address(0) || to == address(0)) revert ZeroAddress();
            if (amount == 0) continue; // Skip zero amounts
            if (_balances[from] < amount) revert InsufficientBalance(amount, _balances[from]);
            
            _balances[from] -= amount;
            _balances[to] += amount;
            
            emit ARCSTransferred(from, to, amount, reason);
        }
    }
}
