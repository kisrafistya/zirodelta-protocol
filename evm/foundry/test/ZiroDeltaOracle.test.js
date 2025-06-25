const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZiroDeltaOracle", function () {
  let ZiroDeltaOracle, ziroDeltaOracle, MockMultiOracle, mockOracle1, mockOracle2, owner, addr1, addr2;
  let ORACLE_MANAGER_ROLE;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockMultiOracleFactory = await ethers.getContractFactory("MockMultiOracle");
    mockOracle1 = await MockMultiOracleFactory.deploy();
    mockOracle2 = await MockMultiOracleFactory.deploy();

    ZiroDeltaOracle = await ethers.getContractFactory("ZiroDeltaOracle");
    ziroDeltaOracle = await ZiroDeltaOracle.deploy();

    ORACLE_MANAGER_ROLE = await ziroDeltaOracle.ORACLE_MANAGER_ROLE();
    await ziroDeltaOracle.grantRole(ORACLE_MANAGER_ROLE, owner.address);

    await ziroDeltaOracle.addOracle(mockOracle1.address);
    await ziroDeltaOracle.addOracle(mockOracle2.address);
  });

  it("Should update the funding rate correctly", async function () {
    const rate1 = 12345;
    const rate2 = 54321;
    await mockOracle1.setRate(rate1);
    await mockOracle2.setRate(rate2);

    await time.increase(3600);
    await ziroDeltaOracle.updateFundingRate();

    const expectedRate = Math.floor((rate1 + rate2) / 2);
    expect(await ziroDeltaOracle.fundingRate()).to.equal(expectedRate);
  });
});
