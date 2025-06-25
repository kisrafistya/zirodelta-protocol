const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const config = JSON.parse(fs.readFileSync(`./deploy-config/${network.name}.json`, "utf8"));

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contracts based on the configuration
  const ZiroDeltaTimelock = await ethers.getContractFactory("ZiroDeltaTimelock");
  const ziroDeltaTimelock = await ZiroDeltaTimelock.deploy(config.minDelay, config.proposers, config.executors);

  const ZiroDeltaGovernance = await ethers.getContractFactory("ZiroDeltaGovernance");
  const ziroDeltaGovernance = await ZiroDeltaGovernance.deploy(
    config.zdltToken,
    ziroDeltaTimelock.address,
    config.votingDelay,
    config.votingPeriod,
    config.quorumFraction
  );

  // ... deploy other contracts

  console.log("ZiroDeltaTimelock deployed to:", ziroDeltaTimelock.address);
  console.log("ZiroDeltaGovernance deployed to:", ziroDeltaGovernance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
