const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZiroDeltaEmergency", function () {
  let ZiroDeltaEmergency, ziroDeltaEmergency, owner, addr1, addr2;
  let PAUSER_ROLE;

  beforeEach(async function () {
    ZiroDeltaEmergency = await ethers.getContractFactory("ZiroDeltaEmergency");
    [owner, addr1, addr2] = await ethers.getSigners();
    ziroDeltaEmergency = await ZiroDeltaEmergency.deploy();
    PAUSER_ROLE = await ziroDeltaEmergency.PAUSER_ROLE();
  });

  describe("Deployment", function () {
    it("Should set the right admin role", async function () {
      expect(await ziroDeltaEmergency.hasRole(await ziroDeltaEmergency.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should set the right pauser role", async function () {
      expect(await ziroDeltaEmergency.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Pausing and Unpausing", function () {
    it("Should allow pausers to pause and unpause the system", async function () {
      await ziroDeltaEmergency.pause();
      expect(await ziroDeltaEmergency.paused()).to.be.true;

      await ziroDeltaEmergency.unpause();
      expect(await ziroDeltaEmergency.paused()).to.be.false;
    });

    it("Should not allow non-pausers to pause or unpause", async function () {
      await expect(ziroDeltaEmergency.connect(addr1).pause()).to.be.reverted;
      await ziroDeltaEmergency.pause();
      await expect(ziroDeltaEmergency.connect(addr1).unpause()).to.be.reverted;
    });
  });
});
