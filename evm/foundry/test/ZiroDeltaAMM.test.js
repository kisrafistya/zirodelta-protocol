const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZiroDeltaAMM", function () {
  let ZiroDeltaAMM, ziroDeltaAMM, PFRT, NFRT, pfrt, nfrt, owner, addr1, addr2;

  beforeEach(async function () {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    pfrt = await MockERC20.deploy("Positive Funding Rate Token", "PFRT");
    nfrt = await MockERC20.deploy("Negative Funding Rate Token", "NFRT");

    ZiroDeltaAMM = await ethers.getContractFactory("ZiroDeltaAMM");
    [owner, addr1, addr2] = await ethers.getSigners();
    ziroDeltaAMM = await ZiroDeltaAMM.deploy(pfrt.address, nfrt.address);

    // Mint some tokens for testing
    await pfrt.mint(owner.address, ethers.utils.parseEther("1000"));
    await nfrt.mint(owner.address, ethers.utils.parseEther("1000"));
    await pfrt.approve(ziroDeltaAMM.address, ethers.utils.parseEther("1000"));
    await nfrt.approve(ziroDeltaAMM.address, ethers.utils.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ziroDeltaAMM.owner()).to.equal(owner.address);
    });

    it("Should set the correct token addresses", async function () {
      expect(await ziroDeltaAMM.pfrtAddress()).to.equal(pfrt.address);
      expect(await ziroDeltaAMM.nfrtAddress()).to.equal(nfrt.address);
    });
  });

  describe("Adding Liquidity", function () {
    it("Should add liquidity correctly", async function () {
      const pfrtAmount = ethers.utils.parseEther("100");
      const nfrtAmount = ethers.utils.parseEther("100");

      await ziroDeltaAMM.addLiquidity(pfrtAmount, nfrtAmount);

      expect(await ziroDeltaAMM.pfrtBalance()).to.equal(pfrtAmount);
      expect(await ziroDeltaAMM.nfrtBalance()).to.equal(nfrtAmount);
    });
  });

  describe("Swapping", function () {
    it("Should swap tokens correctly", async function () {
      const pfrtAmount = ethers.utils.parseEther("100");
      const nfrtAmount = ethers.utils.parseEther("100");
      await ziroDeltaAMM.addLiquidity(pfrtAmount, nfrtAmount);

      const swapAmount = ethers.utils.parseEther("10");
      await pfrt.mint(addr1.address, swapAmount);
      await pfrt.connect(addr1).approve(ziroDeltaAMM.address, swapAmount);

      await ziroDeltaAMM.connect(addr1).swap(pfrt.address, swapAmount);

      const nfrtBalance = await nfrt.balanceOf(addr1.address);
      const expectedAmount = await ziroDeltaAMM.getSwapAmount(pfrt.address, swapAmount);

      expect(nfrtBalance).to.equal(expectedAmount);
    });
  });

  describe("Removing Liquidity", function () {
    it("Should remove liquidity correctly", async function () {
      const pfrtAmount = ethers.utils.parseEther("100");
      const nfrtAmount = ethers.utils.parseEther("100");
      await ziroDeltaAMM.addLiquidity(pfrtAmount, nfrtAmount);

      await ziroDeltaAMM.removeLiquidity(pfrtAmount, nfrtAmount);

      expect(await ziroDeltaAMM.pfrtBalance()).to.equal(0);
      expect(await ziroDeltaAMM.nfrtBalance()).to.equal(0);
    });
  });
