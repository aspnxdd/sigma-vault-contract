import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying TokenVault to Unichain Testnet...");
  
  // Ensure we're on Unichain testnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1808n) {
    throw new Error("This script is for Unichain testnet only. Please use --network unichainTestnet");
  }

  // Run the deployment directly
  const { verify } = require("./verify");
  const fs = require("fs");
  const path = require("path");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "UNI");

  // Deploy TokenVault
  console.log("\n📦 Deploying TokenVault...");
  const TokenVault = await ethers.getContractFactory("TokenVault");
  const tokenVault = await TokenVault.deploy(deployer.address);
  await tokenVault.waitForDeployment();

  const tokenVaultAddress = await tokenVault.getAddress();
  console.log("✅ TokenVault deployed to:", tokenVaultAddress);
  console.log("🔗 View on explorer: https://testnet-explorer.unichain.world/address/" + tokenVaultAddress);
}

main()
  .then(() => {
    console.log("\n🎉 Unichain testnet deployment completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unichain testnet deployment failed:", error);
    process.exit(1);
  }); 