const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZiroDeltaMinting", function () {
  let ZiroDeltaMinting, ziroDeltaMinting, PFRT, NFRT, Collateral, pfrt, nfrt, collateral, owner, addr1, addr2;

  beforeEach(async function () {
    // Deploy mock contracts for PFRT, NFRT, and Collateral
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    pfrt = await MockERC20.deploy("Positive Funding Rate Token", "PFRT");
    nfrt = await MockERC20.deploy("Negative Funding Rate Token", "NFRT");
    collateral = await MockERC20.deploy("Collateral Token", "USDC");

    // Deploy the ZiroDeltaMinting contract
    ZiroDeltaMinting = await ethers.getContractFactory("ZiroDeltaMinting");
    [owner, addr1, addr2] = await ethers.getSigners();
    ziroDeltaMinting = await ZiroDeltaMinting.deploy(pfrt.address, nfrt.address, collateral.address, owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ziroDeltaMinting.owner()).to.equal(owner.address);
    });

    it("Should set the correct token addresses", async function () {
      expect(await ziroDeltaMinting.pfrtAddress()).to.equal(pfrt.address);
      expect(await ziroDeltaMinting.nfrtAddress()).to.equal(nfrt.address);
      expect(await ziroDeltaMinting.collateralAddress()).to.equal(collateral.address);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens correctly", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      await collateral.mint(addr1.address, mintAmount);
      await collateral.connect(addr1).approve(ziroDeltaMinting.address, mintAmount);

      await ziroDeltaMinting.connect(addr1).mint(mintAmount);

      const pfrtBalance = await pfrt.balanceOf(addr1.address);
      const nfrtBalance = await nfrt.balanceOf(addr1.address);

      const fee = mintAmount.mul(await ziroDeltaMinting.MINT_FEE()).div(ethers.utils.parseEther("1"));
      const expectedAmount = mintAmount.sub(fee);

      expect(pfrtBalance).to.equal(expectedAmount);
      expect(nfrtBalance).to.equal(expectedAmount);
    });
  });

  describe("Redeeming", function () {
    it("Should redeem tokens correctly", async function () {
      const mintAmount = ethers.utils.parseEther("100
      ");
      await collateral.mint(addr1.address, mintAmount);
      await collateral.connect(addr1).approve(ziroDeltaMinting.address, mintAmount);
      await ziroDeltaMinting.connect(addr1).mint(mintAmount);

      const pfrtBalance = await pfrt.balanceOf(addr1.address);
      const nfrtBalance = await nfrt.balanceOf(addr1.address);

      await pfrt.connect(addr1).approve(ziroDeltaMinting.address, pfrtBalance);
      await nfrt.connect(addr1).approve(ziroDeltaMinting.address, nfrtBalance);

      await ziroDeltaMinting.connect(addr1).redeem(pfrtBalance, nfrtBalance);

      const finalPfrtBalance = await pfrt.balanceOf(addr1.address);
      const finalNfrtBalance = await nfrt.balanceOf(addr1.address);
      const collateralBalance = await collateral.balanceOf(addr1.address);

      expect(finalPfrtBalance).to.equal(0);
      expect(finalNfrtBalance).to.equal(0);
      expect(collateralBalance).to.equal(mintAmount);
    });
  });
