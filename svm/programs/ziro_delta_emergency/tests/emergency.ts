
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('ziro_delta_emergency', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaEmergency;

  const emergency = anchor.web3.Keypair.generate();
  const authority = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    await program.rpc.initialize({
      accounts: {
        emergency: emergency.publicKey,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [emergency, authority],
    });
  });

  it('Sets paused', async () => {
    await program.rpc.setPaused(true, {
      accounts: {
        emergency: emergency.publicKey,
        authority: authority.publicKey,
      },
      signers: [authority],
    });
  });
});
