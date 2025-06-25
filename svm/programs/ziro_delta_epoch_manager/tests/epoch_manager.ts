
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('ziro_delta_epoch_manager', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaEpochManager;

  const epochManager = anchor.web3.Keypair.generate();
  const authority = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    await program.rpc.initialize(new anchor.BN(100), {
      accounts: {
        epochManager: epochManager.publicKey,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [epochManager, authority],
    });
  });

  it('Starts a new epoch', async () => {
    // Wait for the epoch to end
    await new Promise(resolve => setTimeout(resolve, 2000));

    await program.rpc.startNewEpoch({
      accounts: {
        epochManager: epochManager.publicKey,
        authority: authority.publicKey,
      },
      signers: [authority],
    });
  });

  it('Settles an epoch', async () => {
    await program.rpc.settleEpoch({
      accounts: {
        epochManager: epochManager.publicKey,
        authority: authority.publicKey,
      },
      signers: [authority],
    });
  });
});
