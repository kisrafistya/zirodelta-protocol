const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZiroDeltaGovernance", function () {
  let ZiroDeltaGovernance, ziroDeltaGovernance, ZiroDeltaTimelock, ziroDeltaTimelock, MockVotes, zdlt, owner, addr1, addr2;
  const minDelay = 3600; // 1 hour
  const votingDelay = 1; // 1 block
  const votingPeriod = 5; // 5 blocks
  const quorumFraction = 4; // 4%

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the mock votes token
    MockVotes = await ethers.getContractFactory("MockVotes");
    zdlt = await MockVotes.deploy("ZiroDelta Governance Token", "ZDLT");
    await zdlt.mint(owner.address, ethers.utils.parseEther("1000"));
    await zdlt.delegate(owner.address);

    // Deploy the timelock
    ZiroDeltaTimelock = await ethers.getContractFactory("ZiroDeltaTimelock");
    ziroDeltaTimelock = await ZiroDeltaTimelock.deploy(minDelay, [owner.address], [owner.address]);

    // Deploy the governor
    ZiroDeltaGovernance = await ethers.getContractFactory("ZiroDeltaGovernance");
    ziroDeltaGovernance = await ZiroDeltaGovernance.deploy(zdlt.address, ziroDeltaTimelock.address, votingDelay, votingPeriod, quorumFraction);

    // Grant proposer and executor roles to the governor
    await ziroDeltaTimelock.grantRole(await ziroDeltaTimelock.PROPOSER_ROLE(), ziroDeltaGovernance.address);
    await ziroDeltaTimelock.grantRole(await ziroDeltaTimelock.EXECUTOR_ROLE(), ziroDeltaGovernance.address);
  });

  it("Should create and execute a proposal", async function () {
    const target = ziroDeltaTimelock.address;
    const value = 0;
    const data = "0x";
    const description = "Test Proposal";

    const proposalId = await ziroDeltaGovernance.hashProposal([target], [value], [data], ethers.utils.id(description));

    await ziroDeltaGovernance.propose([target], [value], [data], description);

    await time.advanceBlock();

    await ziroDeltaGovernance.castVote(proposalId, 1);

    await time.advanceBlock(votingPeriod);

    await ziroDeltaGovernance.queue([target], [value], [data], ethers.utils.id(description));

    await time.increase(minDelay);

    await ziroDeltaGovernance.execute([target], [value], [data], ethers.utils.id(description));
  });
});
