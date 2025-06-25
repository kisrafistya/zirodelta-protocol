const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZiroDeltaEpochManager", function () {
  let ZiroDeltaEpochManager, ziroDeltaEpochManager, MockZiroDelta, mockZiroDelta, owner, addr1, addr2;

  beforeEach(async function () {
    const MockZiroDeltaFactory = await ethers.getContractFactory("MockZiroDelta");
    mockZiroDelta = await MockZiroDeltaFactory.deploy();

    ZiroDeltaEpochManager = await ethers.getContractFactory("ZiroDeltaEpochManager");
    [owner, addr1, addr2] = await ethers.getSigners();
    ziroDeltaEpochManager = await ZiroDeltaEpochManager.deploy(mockZiroDelta.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ziroDeltaEpochManager.owner()).to.equal(owner.address);
    });

    it("Should set the correct ZiroDelta address", async function () {
      expect(await ziroDeltaEpochManager.ziroDeltaAddress()).to.equal(mockZiroDelta.address);
    });
  });

  describe("Starting New Epoch", function () {
    it("Should start a new epoch correctly", async function () {
      const epochDuration = await ziroDeltaEpochManager.EPOCH_DURATION();
      await time.increase(epochDuration);

      await ziroDeltaEpochManager.startNewEpoch();

      expect(await ziroDeltaEpochManager.currentEpoch()).to.equal(2);
      expect(await mockZiroDelta.settled()).to.be.true;
    });
  });
