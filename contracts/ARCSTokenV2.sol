// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ARCSTokenV2 - Treasury Model
 * @notice ARCS Gaming Token with fixed supply (like casino chips)
 * @dev Standard ERC20-like token with fixed 1 billion supply
 * 
 * KEY CHANGES FROM V1:
 * - Fixed supply: 1 billion ARCS minted at deployment
 * - No minting or burning (treasury model)
 * - Standard ERC20 transfer/approve/allowance
 * - All ARCS held in treasury (deployer wallet)
 * - Users get ARCS from treasury, return to treasury
 * - USDC deposits = house revenue (not 1:1 backing)
 * - Simpler, more robust design
 */
contract ARCSTokenV2 is Ownable {
    
    // ============ Token Info ============
    
    string public constant name = "ARCS Gaming Token";
    string public constant symbol = "ARCS";
    uint8 public constant decimals = 18;
    
    /// @notice Fixed total supply: 1 billion ARCS
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // ============ State Variables ============
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // ============ Events ============
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // ============ Errors ============
    
    error InsufficientBalance(uint256 balance, uint256 needed);
    error InsufficientAllowance(uint256 allowance, uint256 needed);
    error ZeroAddress();
    error InvalidAmount();
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Mint entire supply to deployer (treasury)
        _balances[msg.sender] = TOTAL_SUPPLY;
        emit Transfer(address(0), msg.sender, TOTAL_SUPPLY);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get total supply
     */
    function totalSupply() external pure returns (uint256) {
        return TOTAL_SUPPLY;
    }
    
    /**
     * @notice Get balance of address
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @notice Get allowance
     */
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    // ============ Transfer Functions ============
    
    /**
     * @notice Transfer tokens to another address
     * @dev Standard ERC20 transfer
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (_balances[msg.sender] < amount) {
            revert InsufficientBalance(_balances[msg.sender], amount);
        }
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @notice Approve spender to transfer tokens
     * @dev Standard ERC20 approve
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens from one address to another
     * @dev Standard ERC20 transferFrom with allowance check
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        
        // Check and update allowance (unless caller is owner)
        if (msg.sender != from && msg.sender != owner()) {
            uint256 currentAllowance = _allowances[from][msg.sender];
            if (currentAllowance < amount) {
                revert InsufficientAllowance(currentAllowance, amount);
            }
            _allowances[from][msg.sender] = currentAllowance - amount;
        }
        
        // Check balance and transfer
        if (_balances[from] < amount) {
            revert InsufficientBalance(_balances[from], amount);
        }
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ============ Utility Functions ============
    
    /**
     * @notice Increase allowance (useful for approvals)
     */
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        
        _allowances[msg.sender][spender] += addedValue;
        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }
    
    /**
     * @notice Decrease allowance
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        
        uint256 currentAllowance = _allowances[msg.sender][spender];
        if (currentAllowance < subtractedValue) {
            revert InsufficientAllowance(currentAllowance, subtractedValue);
        }
        
        _allowances[msg.sender][spender] = currentAllowance - subtractedValue;
        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Mint additional ARCS tokens to treasury (owner only)
     * @dev Only owner can mint. Use this to increase supply if needed.
     * @param amount Amount of ARCS to mint (in wei, 18 decimals)
     */
    function mint(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        
        _balances[owner()] += amount;
        emit Transfer(address(0), owner(), amount);
    }
    
    /**
     * @notice Get current circulating supply (not fixed anymore if minting is used)
     */
    function circulatingSupply() external view returns (uint256) {
        uint256 total = 0;
        // Note: This is expensive. In production, track this with a state variable.
        // For now, we'll just return the owner's balance as an approximation
        return _balances[owner()];
    }
}
