
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('ziro_delta_oracle', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaOracle;

  const oracle = anchor.web3.Keypair.generate();
  const authority = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    await program.rpc.initialize(new anchor.BN(100), {
      accounts: {
        oracle: oracle.publicKey,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [oracle, authority],
    });
  });

  it('Updates the funding rate', async () => {
    await program.rpc.updateFundingRate(new anchor.BN(200), {
      accounts: {
        oracle: oracle.publicKey,
        authority: authority.publicKey,
      },
      signers: [authority],
    });
  });
});
