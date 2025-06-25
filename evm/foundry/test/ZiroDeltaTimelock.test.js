const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZiroDeltaTimelock", function () {
  let ZiroDeltaTimelock, ziroDeltaTimelock, owner, addr1, addr2;
  const minDelay = 3600; // 1 hour

  beforeEach(async function () {
    ZiroDeltaTimelock = await ethers.getContractFactory("ZiroDeltaTimelock");
    [owner, addr1, addr2] = await ethers.getSigners();
    ziroDeltaTimelock = await ZiroDeltaTimelock.deploy(minDelay, [owner.address], [owner.address]);
  });

  it("Should schedule and execute a transaction", async function () {
    const target = ziroDeltaTimelock.address;
    const value = 0;
    const data = "0x";
    const predecessor = ethers.constants.HashZero;
    const salt = ethers.utils.id("test");

    const timestamp = await time.latest() + minDelay;
    await ziroDeltaTimelock.schedule(target, value, data, predecessor, salt, minDelay);

    await time.increaseTo(timestamp);

    await ziroDeltaTimelock.execute(target, value, data, predecessor, salt);
  });
});
