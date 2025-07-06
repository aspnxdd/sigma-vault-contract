# Sigma Vault - TokenVault Smart Contract

A secure and efficient smart contract vault system for depositing and withdrawing ERC20 tokens and native ETH on Ethereum-compatible blockchains. It's WIP, but it is the base for the SigmaVault Liquidity Manager.

## Overview

Sigma Vault is a smart contract system that provides a secure vault for managing token deposits and withdrawals. The core `TokenVault` contract allows users to deposit pairs of tokens (including ETH) and withdraw them later using unique deposit IDs. This system is designed for scenarios where users need to temporarily lock tokens in a vault with guaranteed retrieval.

## Key Features

- **Dual Token Deposits**: Support for depositing two different tokens in a single transaction
- **ETH Support**: Native ETH handling alongside ERC20 tokens
- **Deposit ID System**: Each deposit receives a unique ID for secure withdrawal tracking
- **Reentrancy Protection**: Built-in security against reentrancy attacks
- **Withdrawal Authorization**: Only the original depositor can withdraw their tokens
- **Event Logging**: Comprehensive event emission for deposit and withdrawal tracking

## Smart Contract Architecture

### TokenVault Contract

The main `TokenVault` contract implements the following core functionality:

#### Core Functions

- **`deposit(address token0, uint256 amount0, address token1, uint256 amount1)`**
  - Deposits two tokens (token0 and token1) into the vault
  - Returns a unique deposit ID for future withdrawals
  - Supports ETH by using `address(0)` as the token address
  - Requires appropriate token approvals for ERC20 tokens

- **`withdraw(uint256 depositId)`**
  - Withdraws tokens using the deposit ID
  - Only the original depositor can withdraw
  - Marks the deposit as withdrawn to prevent double withdrawals

- **`getDeposit(uint256 depositId)`**
  - Returns detailed information about a specific deposit
  - Includes user address, token addresses, amounts, and withdrawal status

#### Security Features

- **ReentrancyGuard**: Protects against reentrancy attacks
- **SafeERC20**: Uses OpenZeppelin's SafeERC20 for secure token transfers
- **Access Control**: Withdrawal authorization limited to deposit owner
- **Input Validation**: Comprehensive validation of deposit parameters

## Project Structure

```
├── contracts/
│   ├── TokenVault.sol          # Main vault contract
│   └── mocks/                  # Mock contracts for testing
│       ├── MockERC20.sol
├── scripts/                    # Deployment scripts
│   ├── deploy-token-vault.ts
│   ├── deploy-sepolia.ts
│   ├── deploy-unichain.ts
│   └── verify.ts
├── test/
│   └── TokenVault.test.ts      # Comprehensive test suite
└── typechain-types/            # Generated TypeScript types
```

## Installation & Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Hardhat development environment

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sigma-vault-contract

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Usage

### Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Deploy to local network
npm run node
npm run deploy

# Format code
npm run format

# Lint code
npm run lint
```

### Deployment

The project includes deployment scripts for various networks:

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-sepolia.ts --network sepolia

# Deploy to Unichain testnet
npx hardhat run scripts/deploy-unichain-testnet.ts --network unichain-testnet

# Verify contracts
npm run verify -- <contract-address> --network <network-name>
```

### Testing

The project includes comprehensive tests covering:

- Token deposits and withdrawals
- ETH handling
- Error conditions and edge cases
- Access control
- Reentrancy protection

```bash
# Run all tests
npm run test

# Run tests with gas tracing
npm run test:trace

# Generate coverage report
npm run test:coverage
```

## Contract Interactions

### Depositing Tokens

```solidity
// Deposit ERC20 tokens
tokenVault.deposit(tokenA.address, 1000, tokenB.address, 2000);

// Deposit ETH and ERC20 token
tokenVault.deposit{value: 1 ether}(address(0), 1 ether, tokenA.address, 1000);

// Deposit only one token
tokenVault.deposit(tokenA.address, 1000, address(0), 0);
```

### Withdrawing Tokens

```solidity
// Withdraw using deposit ID
tokenVault.withdraw(depositId);
```

### Querying Deposits

```solidity
// Get deposit information
(address user, address token0, address token1, uint256 amount0, uint256 amount1, bool withdrawn) =
    tokenVault.getDeposit(depositId);
```

## Development Dependencies

- **Hardhat**: Ethereum development environment
- **OpenZeppelin Contracts**: Security-audited contract libraries
- **TypeChain**: TypeScript bindings for smart contracts
- **Ethers.js**: Ethereum library for interactions
- **Chai**: Testing framework

## License

This project is licensed under the MIT License - see the LICENSE file for details.
