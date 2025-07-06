// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVault
 * @dev A simple vault contract for depositing and withdrawing ERC20 tokens and native ETH
 * Supports only 2 tokens (token0 and token1) with deposit IDs for withdrawals
 * ETH is handled when token0 or token1 is the zero address
 */
contract TokenVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event TokensDeposited(uint256 indexed depositId, address indexed user, address token0, uint256 amount0, address token1, uint256 amount1);
    event TokensWithdrawn(uint256 indexed depositId, address indexed user, address token0, uint256 amount0, address token1, uint256 amount1);

    // Deposit tracking
    struct Deposit {
        address user;
        address token0;
        address token1;
        uint256 amount0;
        uint256 amount1;
        bool withdrawn;
    }

    // State variables
    mapping(uint256 => Deposit) public deposits;
    uint256 public nextDepositId;

    // Errors
    error InvalidAmount();
    error InvalidToken();
    error TransferFailed();
    error DepositNotFound();
    error DepositAlreadyWithdrawn();
    error UnauthorizedWithdrawal();


    // Constructor
    constructor() {}

    /**
     * @dev Deposit both token0 and token1 into the vault
     * @param token0 Address of token0 (or zero address for ETH)
     * @param amount0 Amount of token0 to deposit
     * @param token1 Address of token1 (or zero address for ETH)
     * @param amount1 Amount of token1 to deposit
     * @return depositId The ID of the created deposit
     */
    function deposit(address token0, uint256 amount0, address token1, uint256 amount1) external payable nonReentrant returns (uint256 depositId) {
        if ((amount0 == 0 && amount1 == 0) || (token0 == address(0) && token1 == address(0))) revert InvalidAmount();
        if (token0 == token1 && token0 != address(0)) revert InvalidToken();

        depositId = nextDepositId++;

        uint256 ethRequired = 0;
        if (amount0 > 0) {
            if (token0 == address(0)) {
                ethRequired += amount0;
            } else {
                IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
            }
        }
        if (amount1 > 0) {
            if (token1 == address(0)) {
                ethRequired += amount1;
            } else {
                IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);
            }
        }
        if (msg.value != ethRequired) revert InvalidAmount();

        deposits[depositId] = Deposit(
            msg.sender,
            token0,
            token1,
            amount0,
            amount1,
            false
        );

        emit TokensDeposited(depositId, msg.sender, token0, amount0, token1, amount1);
    }

    /**
     * @dev Withdraw tokens by deposit ID
     * @param depositId The ID of the deposit to withdraw
     */
    function withdraw(uint256 depositId) external nonReentrant {
        Deposit storage depositRecord = deposits[depositId];
        if (depositRecord.user == address(0)) revert DepositNotFound();
        if (depositRecord.withdrawn) revert DepositAlreadyWithdrawn();
        if (depositRecord.user != msg.sender) revert UnauthorizedWithdrawal();

        uint256 amount0 = depositRecord.amount0;
        uint256 amount1 = depositRecord.amount1;
        address token0 = depositRecord.token0;
        address token1 = depositRecord.token1;

        // Mark as withdrawn
        depositRecord.withdrawn = true;

        if (amount0 > 0) {
            _withdrawToken(token0, amount0);
        }
        if (amount1 > 0) {
            _withdrawToken(token1, amount1);
        }

        emit TokensWithdrawn(depositId, msg.sender, token0, amount0, token1, amount1);
    }

    /**
     * @dev Internal function to withdraw tokens
     * @param token The token address to withdraw (or zero address for ETH)
     * @param amount The amount to withdraw
     */
    function _withdrawToken(address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    /**
     * @dev Get deposit details
     * @param depositId The ID of the deposit
     * @return user The user who made the deposit
     * @return token0Address The token0 address for this deposit
     * @return token1Address The token1 address for this deposit
     * @return amount0 Amount of token0 deposited
     * @return amount1 Amount of token1 deposited
     * @return withdrawn Whether the deposit has been withdrawn
     */
    function getDeposit(uint256 depositId) external view returns (
        address user,
        address token0Address,
        address token1Address,
        uint256 amount0,
        uint256 amount1,
        bool withdrawn
    ) {
        Deposit storage depositRecord = deposits[depositId];
        return (
            depositRecord.user,
            depositRecord.token0,
            depositRecord.token1,
            depositRecord.amount0,
            depositRecord.amount1,
            depositRecord.withdrawn
        );
    }



} 