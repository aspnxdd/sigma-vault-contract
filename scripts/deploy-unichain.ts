import { ethers } from "hardhat";
import { verify } from "./verify";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  contract: string;
  address: string;
  owner: string;
  network: string;
  deployer: string;
  deploymentTime: string;
  constructorArgs: any[];
  blockNumber?: number;
  transactionHash?: string;
}

async function main() {
  console.log("🚀 Starting TokenVault deployment to Unichain...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "UNI");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // Validate we're on Unichain
  if (network.chainId !== 130n && network.chainId !== 1808n) {
    throw new Error(`This script is for Unichain networks only. Current chain ID: ${network.chainId}`);
  }

  const isTestnet = network.chainId === 1808n;
  console.log(`📍 Deploying to Unichain ${isTestnet ? 'Testnet' : 'Mainnet'}`);

  // Deploy TokenVault
  console.log("\n📦 Deploying TokenVault...");
  const TokenVault = await ethers.getContractFactory("TokenVault");
  const tokenVault = await TokenVault.deploy();
  await tokenVault.waitForDeployment();

  const tokenVaultAddress = await tokenVault.getAddress();
  const deploymentTx = tokenVault.deploymentTransaction();
  
  console.log("✅ TokenVault deployed to:", tokenVaultAddress);
  console.log("📋 Transaction hash:", deploymentTx?.hash);

  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  const receipt = await deploymentTx?.wait(5);
  console.log("📦 Block number:", receipt?.blockNumber);

  // Verify the contract on Unichain explorer
  console.log("\n🔍 Verifying TokenVault contract on Unichain explorer...");
  try {
    await verify(tokenVaultAddress, []);
    console.log("✅ TokenVault verified successfully!");
  } catch (error) {
    console.log("❌ Verification failed:", error);
    console.log("💡 You can manually verify the contract on the Unichain explorer");
  }

  // Log deployment summary
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract: TokenVault");
  console.log("Address:", tokenVaultAddress);
  console.log("Owner: No owner - ownership removed");
  console.log("Network: Unichain", isTestnet ? "Testnet" : "Mainnet");
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Block Number:", receipt?.blockNumber);
  console.log("Transaction Hash:", deploymentTx?.hash);
  console.log("Explorer URL:", isTestnet 
    ? `https://testnet-explorer.unichain.world/tx/${deploymentTx?.hash}`
    : `https://uniscan.xyz/tx/${deploymentTx?.hash}`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    contract: "TokenVault",
    address: tokenVaultAddress,
    owner: "No owner - ownership removed",
    network: `unichain${isTestnet ? 'Testnet' : ''}`,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [],
    blockNumber: receipt?.blockNumber,
    transactionHash: deploymentTx?.hash
  };

  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = isTestnet ? "unichain-testnet" : "unichain";
  const deploymentFile = path.join(deploymentsDir, `${networkName}-token-vault.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Also save to a general deployment file
  const generalDeploymentFile = path.join(deploymentsDir, "latest-token-vault.json");
  fs.writeFileSync(generalDeploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Verify deployment by checking contract state
  console.log("\n🔍 Verifying deployment state...");
  try {
    const nextDepositId = await tokenVault.nextDepositId();
    
    console.log("✅ Initial deposit ID:", nextDepositId.toString());
    console.log("✅ Contract deployed successfully - no ownership");
  } catch (error) {
    console.log("❌ Deployment verification failed:", error);
    throw error;
  }

  console.log("\n🎉 Unichain deployment completed successfully!");
  console.log(`🔗 View contract on explorer: ${isTestnet 
    ? `https://testnet-explorer.unichain.world/address/${tokenVaultAddress}`
    : `https://uniscan.xyz/address/${tokenVaultAddress}`
  }`);

  return {
    tokenVault,
    tokenVaultAddress,
    deployer: deployer.address,
    deploymentInfo
  };
}

// Handle errors
main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:", error);
    process.exit(1);
  }); 