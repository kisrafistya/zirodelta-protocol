
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('ziro_delta_governance', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaGovernance;

  const governance = anchor.web3.Keypair.generate();
  const authority = anchor.web3.Keypair.generate();
  const proposal = anchor.web3.Keypair.generate();
  const voter = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    await program.rpc.initialize(new anchor.BN(0), new anchor.BN(100), new anchor.BN(50), {
      accounts: {
        governance: governance.publicKey,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [governance, authority],
    });
  });

  it('Creates a proposal', async () => {
    await program.rpc.createProposal("Test Proposal", "This is a test proposal.", {
      accounts: {
        proposal: proposal.publicKey,
        proposer: provider.wallet.publicKey,
        governance: governance.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [proposal],
    });
  });

  it('Votes on a proposal', async () => {
    await program.rpc.vote({ for: {} }, {
      accounts: {
        proposal: proposal.publicKey,
        voter: voter.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [voter],
    });
  });

  it('Executes a proposal', async () => {
    // Wait for the voting period to end
    await new Promise(resolve => setTimeout(resolve, 2000));

    await program.rpc.executeProposal({
      accounts: {
        proposal: proposal.publicKey,
        governance: governance.publicKey,
      },
    });
  });
});
