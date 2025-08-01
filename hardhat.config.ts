import { EventEmitter } from 'events';
import { config as dotenvConfig } from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import '@openzeppelin/hardhat-upgrades';
// Add this import
dotenvConfig();
// Set the max listeners
EventEmitter.defaultMaxListeners = 50; // or any other number you prefer

function getWallet() {
  return process.env.DEPLOYER_WALLET_PRIVATE_KEY !== undefined
    ? [process.env.DEPLOYER_WALLET_PRIVATE_KEY]
    : [];
}

const config: HardhatUserConfig = {
  solidity: {
    version: process.env.SOLC_VERSION || '0.8.27',
    settings: {
      viaIR:
        (process.env.SOLIDITY_VIA_IR &&
          'true' === process.env.SOLIDITY_VIA_IR.toLowerCase()) ||
        false,
      optimizer: {
        enabled:
          (process.env.SOLIDITY_OPTIMIZER &&
            'true' === process.env.SOLIDITY_OPTIMIZER.toLowerCase()) ||
          false,
        runs:
          (process.env.SOLIDITY_OPTIMIZER_RUNS &&
            Boolean(parseInt(process.env.SOLIDITY_OPTIMIZER_RUNS)) &&
            parseInt(process.env.SOLIDITY_OPTIMIZER_RUNS)) ||
          200,
      },
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  finder: {
    prettify: true,
  },
  contractSizer: {
    runOnCompile: false,
    strict: true,
  },
  gasReporter: {
    enabled:
      (process.env.REPORT_GAS &&
        'true' === process.env.REPORT_GAS.toLowerCase()) ||
      false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
    gasPriceApi:
      process.env.GAS_PRICE_API ||
      'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
    token: 'ETH',
    currency: 'USD',
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize:
        (process.env.ALLOW_UNLIMITED_CONTRACT_SIZE &&
          'true' === process.env.ALLOW_UNLIMITED_CONTRACT_SIZE.toLowerCase()) ||
        false,
    },
    custom: {
      url: process.env.CUSTOM_NETWORK_URL || '',
      accounts: {
        count:
          (process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT &&
            Boolean(parseInt(process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT)) &&
            parseInt(process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT)) ||
          0,
        mnemonic: process.env.CUSTOM_NETWORK_ACCOUNTS_MNEMONIC || '',
        path: process.env.CUSTOM_NETWORK_ACCOUNTS_PATH || '',
      },
    },
    arbitrumTestnet: {
      url: process.env.ARBITRUM_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    auroraTestnet: {
      url: process.env.AURORA_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    avalancheFujiTestnet: {
      url: process.env.AVALANCHE_FUJI_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    ftmTestnet: {
      url: process.env.FTM_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || '',
      accounts: getWallet(),
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: getWallet(),
    },
    harmonyTest: {
      url: process.env.HARMONY_TEST_RPC_URL || '',
      accounts: getWallet(),
    },
    hecoTestnet: {
      url: process.env.HECO_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    moonbaseAlpha: {
      url: process.env.MOONBASE_ALPHA_RPC_URL || '',
      accounts: getWallet(),
    },
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || '',
      accounts: getWallet(),
    },
    sokol: {
      url: process.env.SOKOL_RPC_URL || '',
      accounts: getWallet(),
    },
    unichain: {
      url: process.env.UNICHAIN_RPC_URL || 'https://unichain.drpc.org',
      accounts: getWallet(),
      chainId: 130,
      gasPrice: 20000000000, // 20 gwei
    },
    unichainTestnet: {
      url:
        process.env.UNICHAIN_TESTNET_RPC_URL ||
        'https://testnet-rpc.unichain.world',
      accounts: getWallet(),
      chainId: 1808,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      arbitrumTestnet: process.env.ARBISCAN_API_KEY || '',
      auroraTestnet: process.env.AURORA_API_KEY || '',
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || '',
      bscTestnet: process.env.BSCSCAN_API_KEY || '',
      ftmTestnet: process.env.FTMSCAN_API_KEY || '',
      harmonyTest: process.env.HARMONY_POPS_API_KEY || '',
      hecoTestnet: process.env.HECOINFO_API_KEY || '',
      goerli: process.env.GOERLI_ETHERSCAN_API_KEY || '',
      sepolia: process.env.SEPOLIA_ETHERSCAN_API_KEY || '',
      moonbaseAlpha: process.env.MOONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
      sokol: process.env.BLOCKSCOUT_API_KEY || '',
      custom: process.env.CUSTOM_EXPLORER_API_KEY || '',
      unichain: process.env.UNICHAIN_EXPLORER_API_KEY || '',
      unichainTestnet: process.env.UNICHAIN_TESTNET_EXPLORER_API_KEY || '',
    },
    customChains: [
      {
        network: 'custom',
        chainId:
          (process.env.CUSTOM_NETWORK_CHAIN_ID &&
            Boolean(parseInt(process.env.CUSTOM_NETWORK_CHAIN_ID)) &&
            parseInt(process.env.CUSTOM_NETWORK_CHAIN_ID)) ||
          0,
        urls: {
          apiURL: process.env.CUSTOM_NETWORK_API_URL || '',
          browserURL: process.env.CUSTOM_NETWORK_BROWSER_URL || '',
        },
      },
      {
        network: 'unichain',
        chainId: 130,
        urls: {
          apiURL: 'https://api.uniscan.xyz/api',
          browserURL: 'https://uniscan.xyz',
        },
      },
      {
        network: 'unichainTestnet',
        chainId: 1808,
        urls: {
          apiURL: 'https://testnet-explorer.unichain.world/api',
          browserURL: 'https://testnet-explorer.unichain.world',
        },
      },
    ],
  },
  // Add this section:
  coverage: {
    reporter: ['text', 'html', 'json'], // This will output to console, generate an HTML report, and a JSON file
    reportsDir: './coverage',
    exclude: ['test/', 'mocks/'],
    // You can add more options here as needed
  },
};

export default config;
