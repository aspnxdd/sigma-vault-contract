import { ethers, run } from "hardhat";
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
  console.log("🚀 Deploying TokenVault to Sepolia...");
  
  // Ensure we're on Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error("This script is for Sepolia testnet only. Please use --network sepolia");
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // Deploy TokenVault
  console.log("\n📦 Deploying TokenVault...");
  const TokenVault = await ethers.getContractFactory("TokenVault");
  const tokenVault = await TokenVault.deploy(deployer.address);
  await tokenVault.waitForDeployment();

  const tokenVaultAddress = await tokenVault.getAddress();
  const deploymentTx = tokenVault.deploymentTransaction();
  
  console.log("✅ TokenVault deployed to:", tokenVaultAddress);
  console.log("📋 Transaction hash:", deploymentTx?.hash);

  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  const receipt = await deploymentTx?.wait(5);
  console.log("📦 Block number:", receipt?.blockNumber);

  // Verify the contract on Sepolia
  console.log("\n🔍 Verifying TokenVault contract on Sepolia...");
  try {
    await verify(tokenVaultAddress, [deployer.address]);
    console.log("✅ TokenVault verified successfully on Sepolia!");
  } catch (error) {
    console.log("❌ Verification failed:", error);
  }

  // Log deployment summary
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract: TokenVault");
  console.log("Address:", tokenVaultAddress);
  console.log("Owner:", deployer.address);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Block Number:", receipt?.blockNumber);
  console.log("Transaction Hash:", deploymentTx?.hash);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    contract: "TokenVault",
    address: tokenVaultAddress,
    owner: deployer.address,
    network: network.name,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [deployer.address],
    blockNumber: receipt?.blockNumber,
    transactionHash: deploymentTx?.hash
  };

  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `sepolia-token-vault.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Also save to a general deployment file
  const generalDeploymentFile = path.join(deploymentsDir, "latest-token-vault.json");
  fs.writeFileSync(generalDeploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Verify deployment by checking contract state
  console.log("\n🔍 Verifying deployment state...");
  try {
    const owner = await tokenVault.owner();
    const nextDepositId = await tokenVault.nextDepositId();
    
    console.log("✅ Owner verification:", owner === deployer.address ? "PASS" : "FAIL");
    console.log("✅ Initial deposit ID:", nextDepositId.toString());
    
    if (owner !== deployer.address) {
      throw new Error("Owner verification failed");
    }
  } catch (error) {
    console.log("❌ Deployment verification failed:", error);
    throw error;
  }

  return {
    tokenVault,
    tokenVaultAddress,
    deployer: deployer.address,
    deploymentInfo
  };
}

main()
  .then(() => {
    console.log("\n🎉 Sepolia deployment completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Sepolia deployment failed:", error);
    process.exit(1);
  }); 