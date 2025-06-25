// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMintableBurnableERC20} from "./IMintableBurnableERC20.sol";

/**
 * @title ZiroDelta
 * @author MiniMax Agent
 * @notice Core settlement contract implementing delta-neutral funding rate mechanism
 * @dev Handles epoch settlement, position management, and funding rate distribution
 */
contract ZiroDelta is AccessControl, ReentrancyGuard {
    bytes32 public constant EPOCH_MANAGER_ROLE = keccak256("EPOCH_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Core token addresses
    address public immutable pfrtAddress;
    address public immutable nfrtAddress;
    address public immutable collateralAddress;
    address public oracleAddress;

    // Epoch state
    struct EpochData {
        uint256 startTime;
        uint256 endTime;
        int256 fundingRate;
        uint256 totalPfrtSupply;
        uint256 totalNfrtSupply;
        uint256 totalCollateral;
        bool settled;
        int256 settlementPrice;
    }

    mapping(uint256 => EpochData) public epochs;
    uint256 public currentEpoch;
    uint256 public constant EPOCH_DURATION = 1 days;

    // Position tracking
    struct Position {
        uint256 pfrtBalance;
        uint256 nfrtBalance;
        uint256 collateralDeposited;
        uint256 lastSettledEpoch;
        int256 unrealizedPnL;
    }

    mapping(address => Position) public positions;
    mapping(uint256 => mapping(address => bool)) public hasClaimedEpoch;

    // Settlement state
    uint256 public totalCollateralPool;
    uint256 public protocolFeeRate = 100; // 1% protocol fee
    uint256 public constant MAX_FUNDING_RATE = 1000; // 10% max funding rate
    
    // Risk management
    uint256 public maxPositionSize = 1000000e18; // Max position size
    uint256 public collateralizationRatio = 12000; // 120% collateralization required
    bool public settlementPaused;

    // Events
    event EpochStarted(uint256 indexed epoch, uint256 startTime, int256 fundingRate);
    event EpochSettled(uint256 indexed epoch, int256 settlementPrice, uint256 totalPayout);
    event PositionOpened(address indexed user, uint256 pfrtAmount, uint256 nfrtAmount, uint256 collateral);
    event PositionClosed(address indexed user, uint256 pfrtAmount, uint256 nfrtAmount, int256 pnl);
    event FundingDistributed(uint256 indexed epoch, address indexed user, int256 amount);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event EmergencyShutdown(uint256 timestamp);

    // Custom errors
    error InvalidEpoch();
    error EpochNotSettled();
    error EpochAlreadySettled();
    error InsufficientCollateral();
    error PositionTooLarge();
    error SettlementPaused();
    error InvalidFundingRate();
    error AlreadyClaimed();
    error NoPosition();
    error InsufficientBalance();

    constructor(
        address _pfrtAddress,
        address _nfrtAddress,
        address _collateralAddress,
        address _oracleAddress
    ) {
        pfrtAddress = _pfrtAddress;
        nfrtAddress = _nfrtAddress;
        collateralAddress = _collateralAddress;
        oracleAddress = _oracleAddress;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EPOCH_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, _oracleAddress);
        _grantRole(EMERGENCY_ROLE, msg.sender);

        // Initialize first epoch
        currentEpoch = 1;
        epochs[currentEpoch] = EpochData({
            startTime: block.timestamp,
            endTime: block.timestamp + EPOCH_DURATION,
            fundingRate: 0,
            totalPfrtSupply: 0,
            totalNfrtSupply: 0,
            totalCollateral: 0,
            settled: false,
            settlementPrice: 0
        });

        emit EpochStarted(currentEpoch, block.timestamp, 0);
    }

    /**
     * @notice Open a position by minting PFRT/NFRT tokens
     * @param _collateralAmount Amount of collateral to deposit
     * @param _pfrtAmount Amount of PFRT to mint
     * @param _nfrtAmount Amount of NFRT to mint
     */
    function openPosition(
        uint256 _collateralAmount,
        uint256 _pfrtAmount,
        uint256 _nfrtAmount
    ) external nonReentrant {
        if (settlementPaused) revert SettlementPaused();
        if (_pfrtAmount + _nfrtAmount > maxPositionSize) revert PositionTooLarge();
        
        // Check collateralization
        uint256 requiredCollateral = ((_pfrtAmount + _nfrtAmount) * collateralizationRatio) / 10000;
        if (_collateralAmount < requiredCollateral) revert InsufficientCollateral();

        // Transfer collateral
        IERC20(collateralAddress).transferFrom(msg.sender, address(this), _collateralAmount);
        
        // Update position
        Position storage position = positions[msg.sender];
        position.pfrtBalance += _pfrtAmount;
        position.nfrtBalance += _nfrtAmount;
        position.collateralDeposited += _collateralAmount;
        position.lastSettledEpoch = currentEpoch;

        // Update epoch data
        epochs[currentEpoch].totalPfrtSupply += _pfrtAmount;
        epochs[currentEpoch].totalNfrtSupply += _nfrtAmount;
        epochs[currentEpoch].totalCollateral += _collateralAmount;
        
        // Update total collateral pool
        totalCollateralPool += _collateralAmount;

        // Mint tokens
        IMintableBurnableERC20(pfrtAddress).mint(msg.sender, _pfrtAmount);
        IMintableBurnableERC20(nfrtAddress).mint(msg.sender, _nfrtAmount);

        emit PositionOpened(msg.sender, _pfrtAmount, _nfrtAmount, _collateralAmount);
    }

    /**
     * @notice Close a position by burning PFRT/NFRT tokens
     * @param _pfrtAmount Amount of PFRT to burn
     * @param _nfrtAmount Amount of NFRT to burn
     */
    function closePosition(uint256 _pfrtAmount, uint256 _nfrtAmount) external nonReentrant {
        Position storage position = positions[msg.sender];
        if (position.pfrtBalance < _pfrtAmount || position.nfrtBalance < _nfrtAmount) {
            revert InsufficientBalance();
        }

        // Settle any outstanding funding payments
        _settleUserFunding(msg.sender);

        // Calculate proportional collateral to return
        uint256 totalTokens = position.pfrtBalance + position.nfrtBalance;
        uint256 tokensToClose = _pfrtAmount + _nfrtAmount;
        uint256 collateralToReturn = (position.collateralDeposited * tokensToClose) / totalTokens;

        // Update position
        position.pfrtBalance -= _pfrtAmount;
        position.nfrtBalance -= _nfrtAmount;
        position.collateralDeposited -= collateralToReturn;

        // Burn tokens
        IMintableBurnableERC20(pfrtAddress).burnFrom(msg.sender, _pfrtAmount);
        IMintableBurnableERC20(nfrtAddress).burnFrom(msg.sender, _nfrtAmount);

        // Calculate and apply PnL
        int256 pnl = _calculatePnL(msg.sender, _pfrtAmount, _nfrtAmount);
        int256 netPayout = int256(collateralToReturn) + pnl;

        if (netPayout > 0) {
            IERC20(collateralAddress).transfer(msg.sender, uint256(netPayout));
            totalCollateralPool -= uint256(netPayout);
        }

        emit PositionClosed(msg.sender, _pfrtAmount, _nfrtAmount, pnl);
    }

    /**
     * @notice Settle the current epoch
     * @param _fundingRate The funding rate for the current epoch
     */
    function settle(int256 _fundingRate) external onlyRole(EPOCH_MANAGER_ROLE) {
        if (settlementPaused) revert SettlementPaused();
        if (_fundingRate < -int256(MAX_FUNDING_RATE) || _fundingRate > int256(MAX_FUNDING_RATE)) {
            revert InvalidFundingRate();
        }

        EpochData storage epoch = epochs[currentEpoch];
        if (epoch.settled) revert EpochAlreadySettled();

        // Mark epoch as settled
        epoch.settled = true;
        epoch.fundingRate = _fundingRate;
        epoch.settlementPrice = _fundingRate;

        // Calculate total funding payment
        uint256 totalFunding = 0;
        if (_fundingRate != 0) {
            // Funding rate is applied to the larger position side
            if (epoch.totalPfrtSupply > epoch.totalNfrtSupply) {
                totalFunding = (epoch.totalPfrtSupply * uint256(_abs(_fundingRate))) / 10000;
            } else {
                totalFunding = (epoch.totalNfrtSupply * uint256(_abs(_fundingRate))) / 10000;
            }
        }

        emit EpochSettled(currentEpoch, _fundingRate, totalFunding);

        // Start new epoch
        currentEpoch++;
        epochs[currentEpoch] = EpochData({
            startTime: block.timestamp,
            endTime: block.timestamp + EPOCH_DURATION,
            fundingRate: 0,
            totalPfrtSupply: epoch.totalPfrtSupply,
            totalNfrtSupply: epoch.totalNfrtSupply,
            totalCollateral: epoch.totalCollateral,
            settled: false,
            settlementPrice: 0
        });

        emit EpochStarted(currentEpoch, block.timestamp, 0);
    }

    /**
     * @notice Claim funding payment for a specific epoch
     * @param _epoch Epoch number to claim funding for
     */
    function claimFunding(uint256 _epoch) external nonReentrant {
        if (_epoch >= currentEpoch) revert InvalidEpoch();
        if (!epochs[_epoch].settled) revert EpochNotSettled();
        if (hasClaimedEpoch[_epoch][msg.sender]) revert AlreadyClaimed();

        Position storage position = positions[msg.sender];
        if (position.pfrtBalance == 0 && position.nfrtBalance == 0) revert NoPosition();

        hasClaimedEpoch[_epoch][msg.sender] = true;

        int256 fundingPayment = _calculateFundingPayment(msg.sender, _epoch);
        
        if (fundingPayment > 0) {
            IERC20(collateralAddress).transfer(msg.sender, uint256(fundingPayment));
            totalCollateralPool -= uint256(fundingPayment);
        } else if (fundingPayment < 0) {
            // Deduct from user's collateral
            uint256 deduction = uint256(-fundingPayment);
            if (position.collateralDeposited >= deduction) {
                position.collateralDeposited -= deduction;
                totalCollateralPool += deduction;
            }
        }

        emit FundingDistributed(_epoch, msg.sender, fundingPayment);
    }

    /**
     * @notice Calculate funding payment for a user in a specific epoch
     * @param _user User address
     * @param _epoch Epoch number
     * @return Funding payment amount (positive = receive, negative = pay)
     */
    function _calculateFundingPayment(address _user, uint256 _epoch) internal view returns (int256) {
        EpochData memory epoch = epochs[_epoch];
        Position memory position = positions[_user];

        if (epoch.fundingRate == 0) return 0;

        // Calculate net position (PFRT - NFRT)
        int256 netPosition = int256(position.pfrtBalance) - int256(position.nfrtBalance);
        
        // Apply funding rate
        int256 fundingPayment = (netPosition * epoch.fundingRate) / 10000;

        // Apply protocol fee
        int256 protocolFee = (fundingPayment * int256(protocolFeeRate)) / 10000;
        
        return fundingPayment - protocolFee;
    }

    /**
     * @notice Calculate PnL for a position
     * @param _user User address
     * @param _pfrtAmount PFRT amount being closed
     * @param _nfrtAmount NFRT amount being closed
     * @return PnL amount
     */
    function _calculatePnL(address _user, uint256 _pfrtAmount, uint256 _nfrtAmount) internal view returns (int256) {
        Position memory position = positions[_user];
        
        // Simple PnL calculation based on token imbalance
        int256 netPosition = int256(_pfrtAmount) - int256(_nfrtAmount);
        
        // Use current epoch's funding rate as proxy for PnL
        int256 currentFundingRate = epochs[currentEpoch].fundingRate;
        
        return (netPosition * currentFundingRate) / 10000;
    }

    /**
     * @notice Settle funding for a user across all unsettled epochs
     * @param _user User address
     */
    function _settleUserFunding(address _user) internal {
        Position storage position = positions[_user];
        
        for (uint256 i = position.lastSettledEpoch; i < currentEpoch; i++) {
            if (epochs[i].settled && !hasClaimedEpoch[i][_user]) {
                hasClaimedEpoch[i][_user] = true;
                int256 fundingPayment = _calculateFundingPayment(_user, i);
                position.unrealizedPnL += fundingPayment;
            }
        }
        
        position.lastSettledEpoch = currentEpoch;
    }

    /**
     * @notice Get absolute value of an integer
     * @param x Input value
     * @return Absolute value
     */
    function _abs(int256 x) internal pure returns (int256) {
        return x >= 0 ? x : -x;
    }

    // Emergency functions
    function pauseSettlement() external onlyRole(EMERGENCY_ROLE) {
        settlementPaused = true;
        emit EmergencyShutdown(block.timestamp);
    }

    function resumeSettlement() external onlyRole(EMERGENCY_ROLE) {
        settlementPaused = false;
    }

    // Admin functions
    function setOracleAddress(address _oracleAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        oracleAddress = _oracleAddress;
        _grantRole(ORACLE_ROLE, _oracleAddress);
    }

    function setProtocolFeeRate(uint256 _feeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRate <= 1000, "Fee rate too high"); // Max 10%
        protocolFeeRate = _feeRate;
    }

    function setMaxPositionSize(uint256 _maxSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPositionSize = _maxSize;
    }

    function setCollateralizationRatio(uint256 _ratio) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ratio >= 10000, "Ratio too low"); // Min 100%
        collateralizationRatio = _ratio;
    }

    // View functions
    function getEpochData(uint256 _epoch) external view returns (EpochData memory) {
        return epochs[_epoch];
    }

    function getUserPosition(address _user) external view returns (Position memory) {
        return positions[_user];
    }

    function getPendingFunding(address _user) external view returns (int256 totalFunding) {
        Position memory position = positions[_user];
        
        for (uint256 i = position.lastSettledEpoch; i < currentEpoch; i++) {
            if (epochs[i].settled && !hasClaimedEpoch[i][_user]) {
                totalFunding += _calculateFundingPayment(_user, i);
            }
        }
        
        return totalFunding;
    }

    function getCollateralizationHealth(address _user) external view returns (uint256) {
        Position memory position = positions[_user];
        if (position.pfrtBalance + position.nfrtBalance == 0) return 0;
        
        return (position.collateralDeposited * 10000) / (position.pfrtBalance + position.nfrtBalance);
    }
} 