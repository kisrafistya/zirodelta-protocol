
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;
const { Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");

describe('ziro_delta_amm', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaAmm;

  let pfrtMint = null;
  let nfrtMint = null;
  let pfrtVault = null;
  let nfrtVault = null;
  let userPfrtAccount = null;
  let userNfrtAccount = null;

  const state = anchor.web3.Keypair.generate();
  const authority = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    pfrtMint = await Token.createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    nfrtMint = await Token.createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    pfrtVault = await pfrtMint.createAccount(authority.publicKey);
    nfrtVault = await nfrtMint.createAccount(authority.publicKey);

    userPfrtAccount = await pfrtMint.createAccount(provider.wallet.publicKey);
    userNfrtAccount = await nfrtMint.createAccount(provider.wallet.publicKey);

    await program.rpc.initialize(10, {
      accounts: {
        state: state.publicKey,
        pfrtMint: pfrtMint.publicKey,
        nfrtMint: nfrtMint.publicKey,
        pfrtVault: pfrtVault,
        nfrtVault: nfrtVault,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [state, authority],
    });
  });

  it('Adds liquidity', async () => {
    await pfrtMint.mintTo(
      userPfrtAccount,
      provider.wallet.payer,
      [],
      1000000000
    );

    await nfrtMint.mintTo(
      userNfrtAccount,
      provider.wallet.payer,
      [],
      1000000000
    );

    await program.rpc.addLiquidity(new anchor.BN(1000000000), new anchor.BN(1000000000), {
      accounts: {
        state: state.publicKey,
        pfrtVault: pfrtVault,
        nfrtVault: nfrtVault,
        userPfrtAccount: userPfrtAccount,
        userNfrtAccount: userNfrtAccount,
        user: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  });

  it('Removes liquidity', async () => {
    await program.rpc.removeLiquidity(new anchor.BN(500000000), new anchor.BN(500000000), {
      accounts: {
        state: state.publicKey,
        pfrtVault: pfrtVault,
        nfrtVault: nfrtVault,
        userPfrtAccount: userPfrtAccount,
        userNfrtAccount: userNfrtAccount,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [authority]
    });
  });

  it('Swaps', async () => {
    await program.rpc.swap(new anchor.BN(100000000), new anchor.BN(90000000), {
      accounts: {
        state: state.publicKey,
        fromVault: pfrtVault,
        toVault: nfrtVault,
        userFromAccount: userPfrtAccount,
        userToAccount: userNfrtAccount,
        authority: authority.publicKey,
        user: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [authority]
    });
  });
});
