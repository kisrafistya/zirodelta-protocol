const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZiroDelta Protocol Integration Tests", function () {
  let deployer, user1, user2, user3;
  
  // Core contracts
  let ziroDelta, ziroDeltaAMM, ziroDeltaOracle, ziroDeltaEpochManager;
  let ziroDeltaGovernance, ziroDeltaTimelock, ziroDeltaEmergency;
  
  // Token contracts
  let pfrt, nfrt, collateral, zdlt;
  
  // Oracle contracts
  let oracle1, oracle2, oracle3;

  const INITIAL_COLLATERAL = ethers.parseEther("100000"); // 100k USDC
  const POSITION_SIZE = ethers.parseEther("1000"); // 1k tokens
  const FUNDING_RATE = 250; // 2.5%

  beforeEach(async function () {
    [deployer, user1, user2, user3] = await ethers.getSigners();

    // Deploy tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockVotes = await ethers.getContractFactory("MockVotes");
    
    pfrt = await MockERC20.deploy("Positive Funding Rate Token", "PFRT");
    nfrt = await MockERC20.deploy("Negative Funding Rate Token", "NFRT");
    collateral = await MockERC20.deploy("USD Coin", "USDC");
    zdlt = await MockVotes.deploy("ZiroDelta Governance Token", "ZDLT");

    // Deploy oracle infrastructure
    const MockMultiOracle = await ethers.getContractFactory("MockMultiOracle");
    oracle1 = await MockMultiOracle.deploy();
    oracle2 = await MockMultiOracle.deploy();
    oracle3 = await MockMultiOracle.deploy();

    // Deploy ZiroDelta Oracle with multiple providers
    const ZiroDeltaOracle = await ethers.getContractFactory("ZiroDeltaOracle");
    ziroDeltaOracle = await ZiroDeltaOracle.deploy();
    
    // Configure oracle providers with weights
    await ziroDeltaOracle.addOracle(await oracle1.getAddress(), 4000); // 40%
    await ziroDeltaOracle.addOracle(await oracle2.getAddress(), 3500); // 35%
    await ziroDeltaOracle.addOracle(await oracle3.getAddress(), 2500); // 25%

    // Deploy governance infrastructure
    const ZiroDeltaTimelock = await ethers.getContractFactory("ZiroDeltaTimelock");
    ziroDeltaTimelock = await ZiroDeltaTimelock.deploy(
      86400, // 1 day delay for testing
      [deployer.address],
      [deployer.address]
    );

    const ZiroDeltaGovernance = await ethers.getContractFactory("ZiroDeltaGovernance");
    ziroDeltaGovernance = await ZiroDeltaGovernance.deploy(
      await zdlt.getAddress(),
      await ziroDeltaTimelock.getAddress()
    );

    // Deploy core ZiroDelta contract
    const ZiroDelta = await ethers.getContractFactory("ZiroDelta");
    ziroDelta = await ZiroDelta.deploy(
      await pfrt.getAddress(),
      await nfrt.getAddress(),
      await collateral.getAddress(),
      await ziroDeltaOracle.getAddress()
    );

    // Deploy AMM
    const ZiroDeltaAMM = await ethers.getContractFactory("ZiroDeltaAMM");
    ziroDeltaAMM = await ZiroDeltaAMM.deploy(
      await pfrt.getAddress(),
      await nfrt.getAddress()
    );

    // Deploy Epoch Manager
    const ZiroDeltaEpochManager = await ethers.getContractFactory("ZiroDeltaEpochManager");
    ziroDeltaEpochManager = await ZiroDeltaEpochManager.deploy(
      await ziroDelta.getAddress(),
      await ziroDeltaOracle.getAddress()
    );

    // Deploy Emergency contract
    const ZiroDeltaEmergency = await ethers.getContractFactory("ZiroDeltaEmergency");
    ziroDeltaEmergency = await ZiroDeltaEmergency.deploy();

    // Configure permissions
    const EPOCH_MANAGER_ROLE = await ziroDelta.EPOCH_MANAGER_ROLE();
    await ziroDelta.grantRole(EPOCH_MANAGER_ROLE, await ziroDeltaEpochManager.getAddress());

    // Mint initial tokens
    await collateral.mint(user1.address, INITIAL_COLLATERAL);
    await collateral.mint(user2.address, INITIAL_COLLATERAL);
    await collateral.mint(user3.address, INITIAL_COLLATERAL);
    
    await zdlt.mint(deployer.address, ethers.parseEther("1000000"));
  });

  describe("Oracle System", function () {
    it("Should handle multiple oracle providers with weights", async function () {
      // Initially, oracles should be active
      expect(await ziroDeltaOracle.getActiveOracleCount()).to.equal(3);
      
      // Should be able to update funding rate
      await expect(ziroDeltaOracle.updateFundingRate())
        .to.emit(ziroDeltaOracle, "FundingRateUpdate");
    });

    it("Should handle oracle failures gracefully", async function () {
      // Deactivate one oracle to simulate failure
      await ziroDeltaOracle.setOracleStatus(await oracle1.getAddress(), false);
      
      expect(await ziroDeltaOracle.getActiveOracleCount()).to.equal(2);
      
      // Should still be able to update with remaining oracles
      await expect(ziroDeltaOracle.updateFundingRate())
        .to.emit(ziroDeltaOracle, "FundingRateUpdate");
    });

    it("Should reject updates with insufficient oracles", async function () {
      // Deactivate all but one oracle
      await ziroDeltaOracle.setOracleStatus(await oracle1.getAddress(), false);
      await ziroDeltaOracle.setOracleStatus(await oracle2.getAddress(), false);
      
      expect(await ziroDeltaOracle.getActiveOracleCount()).to.equal(1);
      
      // Should fail with insufficient oracles (minimum 3 required)
      await expect(ziroDeltaOracle.updateFundingRate())
        .to.be.revertedWithCustomError(ziroDeltaOracle, "InsufficientOracles");
    });

    it("Should implement TWAP protection", async function () {
      // Update funding rate to establish TWAP baseline
      await ziroDeltaOracle.updateFundingRate();
      
      // Fast forward time to establish TWAP window
      await time.increase(4 * 60 * 60); // 4 hours
      
      const [currentTWAP, , windowSize] = await ziroDeltaOracle.getTWAPData();
      expect(windowSize).to.equal(4 * 60 * 60); // 4 hour window
    });
  });

  describe("Core Protocol Functionality", function () {
    beforeEach(async function () {
      // Approve collateral for users
      await collateral.connect(user1).approve(await ziroDelta.getAddress(), INITIAL_COLLATERAL);
      await collateral.connect(user2).approve(await ziroDelta.getAddress(), INITIAL_COLLATERAL);
    });

    it("Should allow users to open positions with proper collateralization", async function () {
      const requiredCollateral = ethers.parseEther("1200"); // 120% of 1000 tokens
      
      await expect(
        ziroDelta.connect(user1).openPosition(
          requiredCollateral,
          POSITION_SIZE,
          0 // Only PFRT
        )
      ).to.emit(ziroDelta, "PositionOpened");

      const position = await ziroDelta.getUserPosition(user1.address);
      expect(position.pfrtBalance).to.equal(POSITION_SIZE);
      expect(position.collateralDeposited).to.equal(requiredCollateral);
    });

    it("Should reject undercollateralized positions", async function () {
      const insufficientCollateral = ethers.parseEther("500"); // Less than 120%
      
      await expect(
        ziroDelta.connect(user1).openPosition(
          insufficientCollateral,
          POSITION_SIZE,
          0
        )
      ).to.be.revertedWithCustomError(ziroDelta, "InsufficientCollateral");
    });

    it("Should handle epoch settlement correctly", async function () {
      // Open some positions first
      await ziroDelta.connect(user1).openPosition(
        ethers.parseEther("1200"),
        POSITION_SIZE,
        0 // PFRT only
      );
      
      await ziroDelta.connect(user2).openPosition(
        ethers.parseEther("1200"),
        0,
        POSITION_SIZE // NFRT only
      );

      // Fast forward to end of epoch
      await time.increase(24 * 60 * 60 + 1); // 1 day + 1 second

      // Update oracle to prepare for settlement
      await ziroDeltaOracle.updateFundingRate();

      // Settle epoch through epoch manager
      await expect(ziroDeltaEpochManager.settleEpoch())
        .to.emit(ziroDeltaEpochManager, "EpochSettled");
    });

    it("Should distribute funding correctly between positions", async function () {
      // Open opposing positions
      await ziroDelta.connect(user1).openPosition(
        ethers.parseEther("1200"),
        POSITION_SIZE,
        0 // PFRT only
      );
      
      await ziroDelta.connect(user2).openPosition(
        ethers.parseEther("1200"),
        0,
        POSITION_SIZE // NFRT only
      );

      // Settle epoch with positive funding rate
      await time.increase(24 * 60 * 60 + 1);
      await ziroDeltaOracle.updateFundingRate();
      await ziroDeltaEpochManager.manualSettlement(FUNDING_RATE);

      // Check pending funding for both users
      const user1Funding = await ziroDelta.getPendingFunding(user1.address);
      const user2Funding = await ziroDelta.getPendingFunding(user2.address);
      
      // User1 (PFRT) should pay, User2 (NFRT) should receive (or vice versa)
      expect(user1Funding).to.not.equal(0);
      expect(user2Funding).to.not.equal(0);
      expect(user1Funding).to.equal(-user2Funding); // Opposite signs
    });
  });

  describe("AMM Security Features", function () {
    beforeEach(async function () {
      // Add initial liquidity to AMM
      await pfrt.mint(deployer.address, ethers.parseEther("10000"));
      await nfrt.mint(deployer.address, ethers.parseEther("10000"));
      
      await pfrt.approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("10000"));
      await nfrt.approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("10000"));
      
      await ziroDeltaAMM.addLiquidity(
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0
      );
    });

    it("Should prevent flash loan attacks", async function () {
      await pfrt.mint(user1.address, ethers.parseEther("1000"));
      await pfrt.connect(user1).approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("1000"));

      // First swap in same block should work
      await ziroDeltaAMM.connect(user1).swap(
        await pfrt.getAddress(),
        ethers.parseEther("100"),
        0
      );

      // Second swap in same block should fail
      await expect(
        ziroDeltaAMM.connect(user1).swap(
          await pfrt.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.be.revertedWithCustomError(ziroDeltaAMM, "FlashLoanDetected");
    });

    it("Should enforce slippage protection", async function () {
      await pfrt.mint(user1.address, ethers.parseEther("1000"));
      await pfrt.connect(user1).approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("1000"));

      // Get expected output
      const [expectedOut] = await ziroDeltaAMM.getSwapAmount(
        await pfrt.getAddress(),
        ethers.parseEther("100")
      );

      // Demand more than expected (should fail)
      await expect(
        ziroDeltaAMM.connect(user1).swap(
          await pfrt.getAddress(),
          ethers.parseEther("100"),
          expectedOut + ethers.parseEther("1000") // Unrealistic expectation
        )
      ).to.be.revertedWithCustomError(ziroDeltaAMM, "SlippageTooHigh");
    });

    it("Should respect daily volume limits", async function () {
      const largeAmount = ethers.parseEther("200000"); // Exceeds daily limit
      
      await pfrt.mint(user1.address, largeAmount);
      await pfrt.connect(user1).approve(await ziroDeltaAMM.getAddress(), largeAmount);

      await expect(
        ziroDeltaAMM.connect(user1).swap(
          await pfrt.getAddress(),
          largeAmount,
          0
        )
      ).to.be.revertedWithCustomError(ziroDeltaAMM, "DailyVolumeLimitExceeded");
    });

    it("Should handle emergency pause correctly", async function () {
      // Pause trading
      await ziroDeltaAMM.pauseTrading();
      
      await pfrt.mint(user1.address, ethers.parseEther("100"));
      await pfrt.connect(user1).approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("100"));

      await expect(
        ziroDeltaAMM.connect(user1).swap(
          await pfrt.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.be.revertedWithCustomError(ziroDeltaAMM, "TradingIsPaused");

      // Resume trading
      await ziroDeltaAMM.resumeTrading();
      
      // Should work now
      await expect(
        ziroDeltaAMM.connect(user1).swap(
          await pfrt.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.emit(ziroDeltaAMM, "Swap");
    });
  });

  describe("Governance Integration", function () {
    it("Should have proper production governance parameters", async function () {
      const [
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumPercentage,
        emergencyMode
      ] = await ziroDeltaGovernance.getGovernanceParameters();

      expect(votingDelay).to.equal(86400); // 1 day
      expect(votingPeriod).to.equal(604800); // 7 days
      expect(proposalThreshold).to.equal(ethers.parseEther("100000")); // 100k tokens
      expect(quorumPercentage).to.equal(4); // 4%
      expect(emergencyMode).to.be.false;
    });

    it("Should enforce proposal threshold", async function () {
      // User without enough tokens should fail to propose
      await expect(
        ziroDeltaGovernance.connect(user1).propose(
          [await ziroDelta.getAddress()],
          [0],
          ["0x"],
          "Test proposal"
        )
      ).to.be.reverted; // Should fail due to insufficient tokens
    });
  });

  describe("Emergency Procedures", function () {
    it("Should handle emergency shutdown correctly", async function () {
      // Emergency pause
      await ziroDelta.pauseSettlement();
      
      // Settlement should be paused
      await collateral.connect(user1).approve(await ziroDelta.getAddress(), INITIAL_COLLATERAL);
      
      await expect(
        ziroDelta.connect(user1).openPosition(
          ethers.parseEther("1200"),
          POSITION_SIZE,
          0
        )
      ).to.be.revertedWithCustomError(ziroDelta, "SettlementPaused");

      // Resume should work
      await ziroDelta.resumeSettlement();
      
      await expect(
        ziroDelta.connect(user1).openPosition(
          ethers.parseEther("1200"),
          POSITION_SIZE,
          0
        )
      ).to.emit(ziroDelta, "PositionOpened");
    });

    it("Should handle oracle emergency mode", async function () {
      const emergencyRate = 500; // 5%
      
      // Activate emergency mode
      await ziroDeltaOracle.emergencyUpdateFundingRate(emergencyRate);
      
      expect(await ziroDeltaOracle.emergencyMode()).to.be.true;
      expect(await ziroDeltaOracle.getCurrentFundingRate()).to.equal(emergencyRate);
      
      // Deactivate emergency mode
      await ziroDeltaOracle.deactivateEmergencyMode();
      expect(await ziroDeltaOracle.emergencyMode()).to.be.false;
    });
  });

  describe("Risk Management", function () {
    it("Should enforce position size limits", async function () {
      const oversizedPosition = ethers.parseEther("2000000"); // Exceeds max position size
      const oversizedCollateral = ethers.parseEther("2400000"); // 120% of oversized
      
      await collateral.mint(user1.address, oversizedCollateral);
      await collateral.connect(user1).approve(await ziroDelta.getAddress(), oversizedCollateral);

      await expect(
        ziroDelta.connect(user1).openPosition(
          oversizedCollateral,
          oversizedPosition,
          0
        )
      ).to.be.revertedWithCustomError(ziroDelta, "PositionTooLarge");
    });

    it("Should track collateralization health", async function () {
      await collateral.connect(user1).approve(await ziroDelta.getAddress(), INITIAL_COLLATERAL);
      
      const collateralAmount = ethers.parseEther("1500"); // 150% collateralization
      
      await ziroDelta.connect(user1).openPosition(
        collateralAmount,
        POSITION_SIZE,
        0
      );

      const health = await ziroDelta.getCollateralizationHealth(user1.address);
      expect(health).to.equal(15000); // 150% in basis points
    });
  });

  describe("Integration Stress Test", function () {
    it("Should handle complex multi-user scenario", async function () {
      // Setup multiple users with positions
      const users = [user1, user2, user3];
      const positions = [
        { pfrt: ethers.parseEther("1000"), nfrt: 0 },
        { pfrt: 0, nfrt: ethers.parseEther("800") },
        { pfrt: ethers.parseEther("500"), nfrt: ethers.parseEther("300") }
      ];

      // Open positions for all users
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const position = positions[i];
        const totalTokens = position.pfrt + position.nfrt;
        const requiredCollateral = (totalTokens * BigInt(12000)) / BigInt(10000); // 120%
        
        await collateral.connect(user).approve(await ziroDelta.getAddress(), requiredCollateral);
        
        await ziroDelta.connect(user).openPosition(
          requiredCollateral,
          position.pfrt,
          position.nfrt
        );
      }

      // Add liquidity to AMM
      await pfrt.mint(deployer.address, ethers.parseEther("10000"));
      await nfrt.mint(deployer.address, ethers.parseEther("10000"));
      await pfrt.approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("10000"));
      await nfrt.approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("10000"));
      
      await ziroDeltaAMM.addLiquidity(
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0
      );

      // Perform some trades
      await pfrt.mint(user1.address, ethers.parseEther("100"));
      await pfrt.connect(user1).approve(await ziroDeltaAMM.getAddress(), ethers.parseEther("100"));
      
      await time.increase(1); // Ensure different block
      await ziroDeltaAMM.connect(user1).swap(
        await pfrt.getAddress(),
        ethers.parseEther("50"),
        0
      );

      // Advance time and settle epoch
      await time.increase(24 * 60 * 60 + 1);
      await ziroDeltaOracle.updateFundingRate();
      await ziroDeltaEpochManager.settleEpoch();

      // Verify all users can claim funding
      for (const user of users) {
        const pendingFunding = await ziroDelta.getPendingFunding(user.address);
        if (pendingFunding !== 0n) {
          await expect(ziroDelta.connect(user).claimFunding(1))
            .to.emit(ziroDelta, "FundingDistributed");
        }
      }

      console.log("✅ Complex multi-user scenario completed successfully");
    });
  });
}); 