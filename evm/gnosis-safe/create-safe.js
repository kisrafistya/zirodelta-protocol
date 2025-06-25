const { ethers } = require("ethers");
const { EthersAdapter } = require("@safe-global/protocol-kit");
const { SafeFactory } = require("@safe-global/protocol-kit");

async function main() {
  // This script creates a new Gnosis Safe
  // It requires a private key to be set as an environment variable
  if (!process.env.PRIVATE_KEY) {
    console.error("Please set your PRIVATE_KEY as an environment variable");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const ethAdapter = new EthersAdapter({ ethers, signer });

  const safeFactory = await SafeFactory.create({ ethAdapter });

  const owners = [signer.address];
  const threshold = 1;
  const safeAccountConfig = {
    owners,
    threshold,
  };

  const safe = await safeFactory.deploySafe({ safeAccountConfig });

  console.log("New Gnosis Safe deployed at:", await safe.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
