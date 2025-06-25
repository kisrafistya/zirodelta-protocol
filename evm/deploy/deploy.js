const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying ZiroDelta Protocol with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Step 1: Deploy governance token (ZDLT) with voting capabilities
  console.log("\n📊 Deploying Governance Token (ZDLT)...");
  const MockVotes = await ethers.getContractFactory("MockVotes");
  const zdlt = await MockVotes.deploy("ZiroDelta Governance Token", "ZDLT");
  await zdlt.waitForDeployment();
  console.log("✅ ZDLT deployed to:", await zdlt.getAddress());

  // Step 2: Deploy core token contracts
  console.log("\n🪙 Deploying Core Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const pfrt = await MockERC20.deploy("Positive Funding Rate Token", "PFRT");
  await pfrt.waitForDeployment();
  console.log("✅ PFRT deployed to:", await pfrt.getAddress());

  const nfrt = await MockERC20.deploy("Negative Funding Rate Token", "NFRT");
  await nfrt.waitForDeployment();
  console.log("✅ NFRT deployed to:", await nfrt.getAddress());

  const collateral = await MockERC20.deploy("USD Coin", "USDC");
  await collateral.waitForDeployment();
  console.log("✅ USDC deployed to:", await collateral.getAddress());

  // Step 3: Deploy mock oracles for testing
  console.log("\n🔮 Deploying Oracle Infrastructure...");
  const MockOracle1 = await ethers.getContractFactory("MockMultiOracle");
  const MockOracle2 = await ethers.getContractFactory("MockMultiOracle");
  const MockOracle3 = await ethers.getContractFactory("MockMultiOracle");
  
  const oracle1 = await MockOracle1.deploy();
  await oracle1.waitForDeployment();
  const oracle2 = await MockOracle2.deploy();
  await oracle2.waitForDeployment();
  const oracle3 = await MockOracle3.deploy();
  await oracle3.waitForDeployment();
  
  console.log("✅ Oracle 1 deployed to:", await oracle1.getAddress());
  console.log("✅ Oracle 2 deployed to:", await oracle2.getAddress());
  console.log("✅ Oracle 3 deployed to:", await oracle3.getAddress());

  // Step 4: Deploy ZiroDelta Oracle with multiple providers
  console.log("\n📡 Deploying ZiroDelta Oracle...");
  const ZiroDeltaOracle = await ethers.getContractFactory("ZiroDeltaOracle");
  const ziroDeltaOracle = await ZiroDeltaOracle.deploy();
  await ziroDeltaOracle.waitForDeployment();
  console.log("✅ ZiroDelta Oracle deployed to:", await ziroDeltaOracle.getAddress());

  // Configure oracle with multiple providers
  console.log("🔧 Configuring oracle providers...");
  await ziroDeltaOracle.addOracle(await oracle1.getAddress(), 4000); // 40% weight
  await ziroDeltaOracle.addOracle(await oracle2.getAddress(), 3500); // 35% weight  
  await ziroDeltaOracle.addOracle(await oracle3.getAddress(), 2500); // 25% weight
  console.log("✅ Oracle providers configured");

  // Step 5: Deploy Timelock Controller
  console.log("\n⏰ Deploying Timelock Controller...");
  const ZiroDeltaTimelock = await ethers.getContractFactory("ZiroDeltaTimelock");
  const minDelay = 2 * 24 * 60 * 60; // 2 days in seconds
  const ziroDeltaTimelock = await ZiroDeltaTimelock.deploy(
    minDelay,
    [deployer.address], // proposers
    [deployer.address]  // executors
  );
  await ziroDeltaTimelock.waitForDeployment();
  console.log("✅ Timelock deployed to:", await ziroDeltaTimelock.getAddress());

  // Step 6: Deploy Governance
  console.log("\n🏛️ Deploying Governance Contract...");
  const ZiroDeltaGovernance = await ethers.getContractFactory("ZiroDeltaGovernance");
  const ziroDeltaGovernance = await ZiroDeltaGovernance.deploy(
    await zdlt.getAddress(),
    await ziroDeltaTimelock.getAddress()
  );
  await ziroDeltaGovernance.waitForDeployment();
  console.log("✅ Governance deployed to:", await ziroDeltaGovernance.getAddress());

  // Step 7: Deploy Core ZiroDelta Contract
  console.log("\n⚡ Deploying Core ZiroDelta Contract...");
  const ZiroDelta = await ethers.getContractFactory("ZiroDelta");
  const ziroDelta = await ZiroDelta.deploy(
    await pfrt.getAddress(),
    await nfrt.getAddress(),
    await collateral.getAddress(),
    await ziroDeltaOracle.getAddress()
  );
  await ziroDelta.waitForDeployment();
  console.log("✅ ZiroDelta Core deployed to:", await ziroDelta.getAddress());

  // Step 8: Deploy ZiroDelta AMM
  console.log("\n💱 Deploying ZiroDelta AMM...");
  const ZiroDeltaAMM = await ethers.getContractFactory("ZiroDeltaAMM");
  const ziroDeltaAMM = await ZiroDeltaAMM.deploy(
    await pfrt.getAddress(),
    await nfrt.getAddress()
  );
  await ziroDeltaAMM.waitForDeployment();
  console.log("✅ ZiroDelta AMM deployed to:", await ziroDeltaAMM.getAddress());

  // Step 9: Deploy Epoch Manager
  console.log("\n📅 Deploying Epoch Manager...");
  const ZiroDeltaEpochManager = await ethers.getContractFactory("ZiroDeltaEpochManager");
  const ziroDeltaEpochManager = await ZiroDeltaEpochManager.deploy(
    await ziroDelta.getAddress(),
    await ziroDeltaOracle.getAddress()
  );
  await ziroDeltaEpochManager.waitForDeployment();
  console.log("✅ Epoch Manager deployed to:", await ziroDeltaEpochManager.getAddress());

  // Step 10: Deploy Emergency Contract
  console.log("\n🚨 Deploying Emergency Contract...");
  const ZiroDeltaEmergency = await ethers.getContractFactory("ZiroDeltaEmergency");
  const ziroDeltaEmergency = await ZiroDeltaEmergency.deploy();
  await ziroDeltaEmergency.waitForDeployment();
  console.log("✅ Emergency Contract deployed to:", await ziroDeltaEmergency.getAddress());

  // Step 11: Deploy Minting Contract (for backward compatibility)
  console.log("\n🏭 Deploying Minting Contract...");
  const ZiroDeltaMinting = await ethers.getContractFactory("ZiroDeltaMinting");
  const ziroDeltaMinting = await ZiroDeltaMinting.deploy(
    await pfrt.getAddress(),
    await nfrt.getAddress(),
    await collateral.getAddress(),
    await ziroDeltaOracle.getAddress()
  );
  await ziroDeltaMinting.waitForDeployment();
  console.log("✅ Minting Contract deployed to:", await ziroDeltaMinting.getAddress());

  // Step 12: Configure permissions and roles
  console.log("\n🔐 Setting up permissions and roles...");
  
  // Grant epoch manager role to the epoch manager contract
  const EPOCH_MANAGER_ROLE = await ziroDelta.EPOCH_MANAGER_ROLE();
  await ziroDelta.grantRole(EPOCH_MANAGER_ROLE, await ziroDeltaEpochManager.getAddress());
  console.log("✅ Epoch manager role granted");

  // Configure governance roles in timelock
  const PROPOSER_ROLE = await ziroDeltaTimelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await ziroDeltaTimelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await ziroDeltaTimelock.CANCELLER_ROLE();
  
  await ziroDeltaTimelock.grantRole(PROPOSER_ROLE, await ziroDeltaGovernance.getAddress());
  await ziroDeltaTimelock.grantRole(EXECUTOR_ROLE, await ziroDeltaGovernance.getAddress());
  await ziroDeltaTimelock.grantRole(CANCELLER_ROLE, await ziroDeltaGovernance.getAddress());
  console.log("✅ Governance roles configured in timelock");

  // Step 13: Initial token distribution (for testing)
  console.log("\n💰 Setting up initial token distribution...");
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  
  // Mint governance tokens
  await zdlt.mint(deployer.address, initialSupply);
  
  // Mint collateral for testing
  await collateral.mint(deployer.address, ethers.parseEther("1000000")); // 1M USDC
  console.log("✅ Initial tokens minted");

  // Step 14: Verify contract integrations
  console.log("\n🔍 Verifying contract integrations...");
  
  // Test oracle functionality
  try {
    await ziroDeltaOracle.updateFundingRate();
    console.log("✅ Oracle update successful");
  } catch (error) {
    console.log("⚠️ Oracle update failed (expected for fresh deployment):", error.message);
  }

  // Check epoch manager status
  const [canSettle, reason] = await ziroDeltaEpochManager.isEpochReady();
  console.log("📊 Epoch ready for settlement:", canSettle, "Reason:", reason);

  // Step 15: Generate deployment summary
  console.log("\n🎉 Deployment Complete! Contract Addresses:");
  console.log("==========================================");
  console.log("ZDLT Governance Token:", await zdlt.getAddress());
  console.log("PFRT Token:", await pfrt.getAddress());
  console.log("NFRT Token:", await nfrt.getAddress());
  console.log("USDC Collateral:", await collateral.getAddress());
  console.log("ZiroDelta Oracle:", await ziroDeltaOracle.getAddress());
  console.log("ZiroDelta Timelock:", await ziroDeltaTimelock.getAddress());
  console.log("ZiroDelta Governance:", await ziroDeltaGovernance.getAddress());
  console.log("ZiroDelta Core:", await ziroDelta.getAddress());
  console.log("ZiroDelta AMM:", await ziroDeltaAMM.getAddress());
  console.log("ZiroDelta Epoch Manager:", await ziroDeltaEpochManager.getAddress());
  console.log("ZiroDelta Emergency:", await ziroDeltaEmergency.getAddress());
  console.log("ZiroDelta Minting:", await ziroDeltaMinting.getAddress());

  // Step 16: Save deployment info to file
  const deploymentInfo = {
    network: "localhost", // Update for different networks
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      zdlt: await zdlt.getAddress(),
      pfrt: await pfrt.getAddress(),
      nfrt: await nfrt.getAddress(),
      usdc: await collateral.getAddress(),
      oracle: await ziroDeltaOracle.getAddress(),
      timelock: await ziroDeltaTimelock.getAddress(),
      governance: await ziroDeltaGovernance.getAddress(),
      core: await ziroDelta.getAddress(),
      amm: await ziroDeltaAMM.getAddress(),
      epochManager: await ziroDeltaEpochManager.getAddress(),
      emergency: await ziroDeltaEmergency.getAddress(),
      minting: await ziroDeltaMinting.getAddress()
    },
    oracleProviders: [
      await oracle1.getAddress(),
      await oracle2.getAddress(), 
      await oracle3.getAddress()
    ]
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployments-${Date.now()}.json`, 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to file");

  console.log("\n✨ ZiroDelta Protocol is ready for production testing!");
  console.log("\n📋 Next Steps:");
  console.log("1. Verify contracts on Etherscan");
  console.log("2. Set up monitoring and alerting");
  console.log("3. Configure oracle data feeds");
  console.log("4. Run integration tests");
  console.log("5. Begin beta testing with limited funds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
