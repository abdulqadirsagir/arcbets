// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testnet with 6 decimals
 */
contract MockUSDC is ERC20 {
    uint8 private _decimals = 6;
    
    constructor() ERC20("USD Coin", "USDC") {
        // Mint 1 million USDC to deployer for testing
        _mint(msg.sender, 1000000 * 10**6);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // Faucet function for testnet - anyone can mint
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10**6, "Max 10,000 USDC per request");
        _mint(msg.sender, amount);
    }
    
    // Mint function for owner
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
