// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IMultiOracle} from "./IMultiOracle.sol";

/**
 * @title ZiroDeltaOracle
 * @author MiniMax Agent
 * @notice Production-grade oracle system with multiple providers, TWAP, and circuit breakers
 * @dev Implements redundant oracle feeds with automatic failover and manipulation protection
 */
contract ZiroDeltaOracle is AccessControl {
    bytes32 public constant ORACLE_MANAGER_ROLE = keccak256("ORACLE_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    struct OracleData {
        address oracle;
        uint256 weight; // Weight in basis points (10000 = 100%)
        bool isActive;
        uint256 lastUpdate;
        int256 lastPrice;
    }

    struct TWAPData {
        int256 cumulativePrice;
        uint256 lastTimestamp;
        int256 currentTWAP;
        uint256 windowSize;
    }

    // State variables
    OracleData[] public oracles;
    TWAPData public twapData;
    
    int256 public fundingRate;
    uint256 public lastUpdateTime;
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    uint256 public constant TWAP_WINDOW = 4 hours; // 4-hour TWAP
    uint256 public constant MAX_DEVIATION = 500; // 5% max deviation from TWAP
    uint256 public constant MIN_ORACLES = 3; // Minimum active oracles required
    
    bool public emergencyMode;
    int256 public emergencyFundingRate;

    // Events
    event FundingRateUpdate(int256 newFundingRate, int256 twapRate, uint256 timestamp);
    event OracleAdded(address indexed oracle, uint256 weight);
    event OracleRemoved(address indexed oracle);
    event OracleStatusChanged(address indexed oracle, bool isActive);
    event EmergencyModeActivated(int256 emergencyRate);
    event EmergencyModeDeactivated();
    event TWAPUpdated(int256 newTWAP, uint256 timestamp);

    // Custom errors
    error InsufficientOracles();
    error InvalidOracleWeight();
    error OracleAlreadyExists();
    error OracleNotFound();
    error UpdateIntervalNotReached();
    error PriceDeviationTooHigh();
    error EmergencyModeActive();
    error InvalidTWAPWindow();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_MANAGER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        twapData.windowSize = TWAP_WINDOW;
        twapData.lastTimestamp = block.timestamp;
    }

    /**
     * @notice Add a new oracle with specified weight
     * @param _oracle Address of the oracle contract
     * @param _weight Weight in basis points (10000 = 100%)
     */
    function addOracle(address _oracle, uint256 _weight) external onlyRole(ORACLE_MANAGER_ROLE) {
        if (_weight == 0 || _weight > 10000) revert InvalidOracleWeight();
        
        // Check if oracle already exists
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == _oracle) revert OracleAlreadyExists();
        }

        oracles.push(OracleData({
            oracle: _oracle,
            weight: _weight,
            isActive: true,
            lastUpdate: block.timestamp,
            lastPrice: 0
        }));

        emit OracleAdded(_oracle, _weight);
    }

    /**
     * @notice Remove an oracle
     * @param _oracle Address of the oracle to remove
     */
    function removeOracle(address _oracle) external onlyRole(ORACLE_MANAGER_ROLE) {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == _oracle) {
                oracles[i] = oracles[oracles.length - 1];
                oracles.pop();
                emit OracleRemoved(_oracle);
                return;
            }
        }
        revert OracleNotFound();
    }

    /**
     * @notice Toggle oracle active status
     * @param _oracle Address of the oracle
     * @param _isActive New active status
     */
    function setOracleStatus(address _oracle, bool _isActive) external onlyRole(ORACLE_MANAGER_ROLE) {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == _oracle) {
                oracles[i].isActive = _isActive;
                emit OracleStatusChanged(_oracle, _isActive);
                return;
            }
        }
        revert OracleNotFound();
    }

    /**
     * @notice Update funding rate using weighted average of active oracles with TWAP protection
     */
    function updateFundingRate() external {
        if (emergencyMode) revert EmergencyModeActive();
        if (block.timestamp < lastUpdateTime + UPDATE_INTERVAL) revert UpdateIntervalNotReached();

        uint256 activeOracles = _countActiveOracles();
        if (activeOracles < MIN_ORACLES) revert InsufficientOracles();

        int256 weightedSum = 0;
        uint256 totalWeight = 0;

        // Calculate weighted average from active oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            if (!oracles[i].isActive) continue;

            try IMultiOracle(oracles[i].oracle).getRate() returns (int256 rate) {
                // Basic sanity check - rate should be reasonable
                if (rate > -10000 && rate < 10000) { // Between -100% and +100%
                    weightedSum += rate * int256(oracles[i].weight);
                    totalWeight += oracles[i].weight;
                    oracles[i].lastPrice = rate;
                    oracles[i].lastUpdate = block.timestamp;
                }
            } catch {
                // Oracle failed, deactivate it temporarily
                oracles[i].isActive = false;
                emit OracleStatusChanged(oracles[i].oracle, false);
            }
        }

        if (totalWeight == 0) revert InsufficientOracles();

        int256 currentRate = weightedSum / int256(totalWeight);
        
        // Update TWAP
        _updateTWAP(currentRate);
        
        // Check deviation from TWAP
        if (_abs(currentRate - twapData.currentTWAP) > (_abs(twapData.currentTWAP) * int256(MAX_DEVIATION) / 10000)) {
            revert PriceDeviationTooHigh();
        }

        fundingRate = currentRate;
        lastUpdateTime = block.timestamp;

        emit FundingRateUpdate(fundingRate, twapData.currentTWAP, block.timestamp);
    }

    /**
     * @notice Emergency update funding rate (bypasses TWAP checks)
     * @param _newFundingRate Emergency funding rate
     */
    function emergencyUpdateFundingRate(int256 _newFundingRate) external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = true;
        emergencyFundingRate = _newFundingRate;
        fundingRate = _newFundingRate;
        lastUpdateTime = block.timestamp;
        
        emit EmergencyModeActivated(_newFundingRate);
        emit FundingRateUpdate(_newFundingRate, twapData.currentTWAP, block.timestamp);
    }

    /**
     * @notice Deactivate emergency mode
     */
    function deactivateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = false;
        emit EmergencyModeDeactivated();
    }

    /**
     * @notice Update TWAP calculation
     * @param _currentPrice Current price to incorporate
     */
    function _updateTWAP(int256 _currentPrice) internal {
        uint256 timeElapsed = block.timestamp - twapData.lastTimestamp;
        
        if (timeElapsed > 0) {
            // Update cumulative price
            twapData.cumulativePrice += _currentPrice * int256(timeElapsed);
            
            // Calculate TWAP over the window
            if (block.timestamp - twapData.lastTimestamp >= twapData.windowSize) {
                twapData.currentTWAP = twapData.cumulativePrice / int256(twapData.windowSize);
                
                // Reset for next window
                twapData.cumulativePrice = 0;
                twapData.lastTimestamp = block.timestamp;
                
                emit TWAPUpdated(twapData.currentTWAP, block.timestamp);
            }
        }
    }

    /**
     * @notice Count active oracles
     * @return count Number of active oracles
     */
    function _countActiveOracles() internal view returns (uint256 count) {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive) count++;
        }
    }

    /**
     * @notice Get absolute value
     * @param x Input value
     * @return Absolute value
     */
    function _abs(int256 x) internal pure returns (int256) {
        return x >= 0 ? x : -x;
    }

    // View functions
    function getOracleCount() external view returns (uint256) {
        return oracles.length;
    }

    function getActiveOracleCount() external view returns (uint256) {
        return _countActiveOracles();
    }

    function getTWAPData() external view returns (int256 currentTWAP, uint256 lastTimestamp, uint256 windowSize) {
        return (twapData.currentTWAP, twapData.lastTimestamp, twapData.windowSize);
    }

    function getCurrentFundingRate() external view returns (int256) {
        return emergencyMode ? emergencyFundingRate : fundingRate;
    }
}
