import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ZiroDeltaMinting } from "../target/types/ziro_delta_minting";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("ziro-delta-minting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZiroDeltaMinting as Program<ZiroDeltaMinting>;

  let pfrtMint: Token;
  let nfrtMint: Token;
  let collateralMint: Token;

  let userPfrtAccount: anchor.web3.PublicKey;
  let userNfrtAccount: anchor.web3.PublicKey;
  let userCollateralAccount: anchor.web3.PublicKey;

  let ownerCollateralAccount: anchor.web3.PublicKey;

  let collateralVault: anchor.web3.PublicKey;

  const state = anchor.web3.Keypair.generate();

  const owner = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  before(async () => {
    await provider.connection.requestAirdrop(owner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);

    pfrtMint = await Token.createMint(
      provider.connection,
      owner,
      owner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    nfrtMint = await Token.createMint(
      provider.connection,
      owner,
      owner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    collateralMint = await Token.createMint(
      provider.connection,
      owner,
      owner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    userPfrtAccount = await pfrtMint.createAccount(user.publicKey);
    userNfrtAccount = await nfrtMint.createAccount(user.publicKey);
    userCollateralAccount = await collateralMint.createAccount(user.publicKey);

    ownerCollateralAccount = await collateralMint.createAccount(owner.publicKey);

    collateralVault = await collateralMint.createAccount(owner.publicKey);
  });

  it("Is initialized!", async () => {
    await program.methods
      .initialize()
      .accounts({
        state: state.publicKey,
        owner: owner.publicKey,
        pfrtMint: pfrtMint.publicKey,
        nfrtMint: nfrtMint.publicKey,
        collateralVault: collateralVault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner, state])
      .rpc();

    const stateAccount = await program.account.state.fetch(state.publicKey);
    assert.ok(stateAccount.owner.equals(owner.publicKey));
  });

  it("Mints tokens", async () => {
    const amount = new anchor.BN(1000);

    await collateralMint.mintTo(userCollateralAccount, owner, [], amount.toNumber());

    await program.methods
      .mint(amount)
      .accounts({
        state: state.publicKey,
        user: user.publicKey,
        userPfrtAccount,
        userNfrtAccount,
        userCollateralAccount,
        pfrtMint: pfrtMint.publicKey,
        nfrtMint: nfrtMint.publicKey,
        collateralVault,
        ownerCollateralAccount,
        pfrtMintAuthority: owner.publicKey,
        nfrtMintAuthority: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user, owner])
      .rpc();

    const userPfrtBalance = await pfrtMint.getAccountInfo(userPfrtAccount);
    const userNfrtBalance = await nfrtMint.getAccountInfo(userNfrtAccount);

    const fee = amount.mul(new anchor.BN(10)).div(new anchor.BN(10000));
    const netAmount = amount.sub(fee);

    assert.ok(userPfrtBalance.amount.eq(netAmount));
    assert.ok(userNfrtBalance.amount.eq(netAmount));
  });

  it("Redeems tokens", async () => {
    const amount = new anchor.BN(100);

    await program.methods
      .redeem(amount, amount)
      .accounts({
        state: state.publicKey,
        user: user.publicKey,
        userPfrtAccount,
        userNfrtAccount,
        userCollateralAccount,
        pfrtMint: pfrtMint.publicKey,
        nfrtMint: nfrtMint.publicKey,
        collateralVault,
        collateralVaultAuthority: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user, owner])
      .rpc();

    const userPfrtBalance = await pfrtMint.getAccountInfo(userPfrtAccount);
    const userNfrtBalance = await nfrtMint.getAccountInfo(userNfrtAccount);

    assert.ok(userPfrtBalance.amount.eq(new anchor.BN(899)));
    assert.ok(userNfrtBalance.amount.eq(new anchor.BN(899)));
  });

  it("Should fail if paused", async () => {
    await program.methods
      .setPaused(true)
      .accounts({
        state: state.publicKey,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    try {
      await program.methods
        .mint(new anchor.BN(100))
        .accounts({
          state: state.publicKey,
          user: user.publicKey,
          userPfrtAccount,
          userNfrtAccount,
          userCollateralAccount,
          pfrtMint: pfrtMint.publicKey,
          nfrtMint: nfrtMint.publicKey,
          collateralVault,
          ownerCollateralAccount,
          pfrtMintAuthority: owner.publicKey,
          nfrtMintAuthority: owner.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user, owner])
        .rpc();
      assert.fail("Should have failed");
    } catch (err) {
      assert.equal(err.error.errorCode.code, "Paused");
    }

    await program.methods
      .setPaused(false)
      .accounts({
        state: state.publicKey,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
  });
});
