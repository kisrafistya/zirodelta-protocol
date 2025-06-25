const { ethers } = require("ethers");
const { EthersAdapter } = require("@safe-global/protocol-kit");
const { Safe } = require("@safe-global/protocol-kit");

async function main() {
  // This script proposes a transaction to a Gnosis Safe
  // It requires a private key and a safe address to be set as environment variables
  if (!process.env.PRIVATE_KEY || !process.env.SAFE_ADDRESS) {
    console.error("Please set your PRIVATE_KEY and SAFE_ADDRESS as environment variables");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const ethAdapter = new EthersAdapter({ ethers, signer });

  const safe = await Safe.create({ ethAdapter, safeAddress: process.env.SAFE_ADDRESS });

  const tx = await safe.createTransaction({ safeTransactionData: {
    to: process.env.SAFE_ADDRESS,
    value: "0",
    data: "0x",
  }});

  const txHash = await safe.getTransactionHash(tx);
  const signature = await safe.signTransactionHash(txHash);

  await safe.proposeTransaction({ safeTransaction: tx, safeTxHash: txHash, senderAddress: signer.address, senderSignature: signature.data });

  console.log("Transaction proposed to the Gnosis Safe");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
