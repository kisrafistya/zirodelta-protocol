const { Tenderly } = require("@tenderly/sdk");

async function main() {
  // This script sets up monitoring for the ZiroDelta Protocol smart contracts
  // It requires a Tenderly API key, username, and project name to be set as environment variables
  if (!process.env.TENDERLY_API_KEY || !process.env.TENDERLY_USERNAME || !process.env.TENDERLY_PROJECT) {
    console.error("Please set your TENDERLY_API_KEY, TENDERLY_USERNAME, and TENDERLY_PROJECT as environment variables");
    process.exit(1);
  }

  const tenderly = new Tenderly({
    accessKey: process.env.TENDERLY_API_KEY,
    username: process.env.TENDERLY_USERNAME,
  });

  const project = await tenderly.projects.get(process.env.TENDERLY_PROJECT);

  // Add contracts to the project
  // The contract addresses should be read from the deployment output
  const contracts = [
    {
      address: "0x...",
      name: "ZiroDeltaMinting",
    },
    {
      address: "0x...",
      name: "ZiroDeltaAMM",
    },
    // ... add other contracts
  ];

  for (const contract of contracts) {
    await project.contracts.add(contract.address, { displayName: contract.name });
  }

  console.log("Contracts added to Tenderly for monitoring");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
