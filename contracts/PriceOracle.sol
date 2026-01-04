// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceOracle
 * @dev Mock price oracle for testnet that can be updated by authorized updater
 */
contract PriceOracle {
    address public owner;
    address public priceUpdater;
    
    // Asset symbol => price in USD (with 8 decimals, like $50,000.00000000)
    mapping(string => uint256) public prices;
    
    // Asset symbol => last update timestamp
    mapping(string => uint256) public lastUpdated;
    
    event PriceUpdated(string indexed asset, uint256 price, uint256 timestamp);
    event PriceUpdaterChanged(address indexed oldUpdater, address indexed newUpdater);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyPriceUpdater() {
        require(msg.sender == priceUpdater || msg.sender == owner, "Only price updater can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        priceUpdater = msg.sender;
    }
    
    /**
     * @dev Update price for a single asset
     */
    function updatePrice(string memory asset, uint256 price) external onlyPriceUpdater {
        require(price > 0, "Price must be greater than 0");
        prices[asset] = price;
        lastUpdated[asset] = block.timestamp;
        emit PriceUpdated(asset, price, block.timestamp);
    }
    
    /**
     * @dev Batch update prices for multiple assets
     */
    function updatePrices(string[] memory assets, uint256[] memory priceList) external onlyPriceUpdater {
        require(assets.length == priceList.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < assets.length; i++) {
            require(priceList[i] > 0, "Price must be greater than 0");
            prices[assets[i]] = priceList[i];
            lastUpdated[assets[i]] = block.timestamp;
            emit PriceUpdated(assets[i], priceList[i], block.timestamp);
        }
    }
    
    /**
     * @dev Get current price for an asset
     */
    function getPrice(string memory asset) external view returns (uint256, uint256) {
        require(lastUpdated[asset] > 0, "Price not available for this asset");
        return (prices[asset], lastUpdated[asset]);
    }
    
    /**
     * @dev Check if price is recent (within last 10 minutes)
     */
    function isPriceRecent(string memory asset) public view returns (bool) {
        return (block.timestamp - lastUpdated[asset]) < 600; // 10 minutes
    }
    
    /**
     * @dev Set authorized price updater address
     */
    function setPriceUpdater(address newUpdater) external onlyOwner {
        require(newUpdater != address(0), "Invalid address");
        address oldUpdater = priceUpdater;
        priceUpdater = newUpdater;
        emit PriceUpdaterChanged(oldUpdater, newUpdater);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
