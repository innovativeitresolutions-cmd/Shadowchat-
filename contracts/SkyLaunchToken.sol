// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SkyLaunchToken
 * @notice Minimal fixed-supply ERC-20 for EVM testnet validation.
 * @dev Entire declared initial supply is minted once to the deploying wallet.
 *      No post-deployment mint, upgrade, admin, or fees. NOT AUDITED.
 *      Do not use in mainnet investment offerings without independent review.
 */
contract SkyLaunchToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public immutable totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidSupply();
    error InvalidMetadata();

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 initialWholeSupply
    ) {
        if (bytes(tokenName).length == 0 || bytes(tokenSymbol).length == 0 || tokenDecimals > 18) {
            revert InvalidMetadata();
        }
        if (initialWholeSupply == 0) revert InvalidSupply();
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
        uint256 minted = initialWholeSupply * 10 ** uint256(tokenDecimals);
        totalSupply = minted;
        balanceOf[msg.sender] = minted;
        emit Transfer(address(0), msg.sender, minted);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 permitted = allowance[from][msg.sender];
        if (permitted < amount) revert InsufficientAllowance();
        if (permitted != type(uint256).max) {
            allowance[from][msg.sender] = permitted - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) private {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        uint256 existing = balanceOf[from];
        if (existing < amount) revert InsufficientBalance();
        balanceOf[from] = existing - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
