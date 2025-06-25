// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IZiroDelta {
    function settle(int256 _fundingRate) external;
    function currentEpoch() external view returns (uint256);
    function getEpochData(uint256 _epoch) external view returns (
        uint256 startTime,
        uint256 endTime,
        int256 fundingRate,
        uint256 totalPfrtSupply,
        uint256 totalNfrtSupply,
        uint256 totalCollateral,
        bool settled,
        int256 settlementPrice
    );
}

interface IZiroDeltaOracle {
    function getCurrentFundingRate() external view returns (int256);
    function updateFundingRate() external;
    function emergencyMode() external view returns (bool);
}

/**
 * @title ZiroDeltaEpochManager
 * @author MiniMax Agent
 * @notice Production-grade epoch manager with automated settlement and oracle integration
 * @dev Manages epoch lifecycle with automated triggers, manual overrides, and emergency controls
 */
contract ZiroDeltaEpochManager is Ownable, AccessControl {
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    address public ziroDeltaAddress;
    address public oracleAddress;
    
    uint256 public constant EPOCH_DURATION = 1 days;
    uint256 public constant SETTLEMENT_WINDOW = 1 hours; // Grace period for settlement
    uint256 public constant MAX_FUNDING_RATE = 1000; // 10% max funding rate
    
    // Automation settings
    bool public autoSettlementEnabled = true;
    uint256 public settlementGasLimit = 500000;
    mapping(address => bool) public authorizedKeepers;
    
    // Emergency controls
    bool public emergencyMode;
    int256 public emergencyFundingRate;
    
    // Events
    event EpochSettled(uint256 indexed epoch, int256 fundingRate, address settledBy);
    event AutoSettlementToggled(bool enabled);
    event KeeperAuthorized(address indexed keeper, bool authorized);
    event EmergencySettlement(uint256 indexed epoch, int256 fundingRate);
    event SettlementFailed(uint256 indexed epoch, string reason);

    // Custom errors
    error EpochNotReady();
    error SettlementWindowExpired();
    error UnauthorizedKeeper();
    error InvalidFundingRate();
    error OracleInEmergencyMode();
    error SettlementDisabled();

    modifier onlyKeeper() {
        if (!authorizedKeepers[msg.sender] && !hasRole(SETTLEMENT_ROLE, msg.sender)) {
            revert UnauthorizedKeeper();
        }
        _;
    }

    constructor(address _ziroDeltaAddress, address _oracleAddress) Ownable(msg.sender) {
        ziroDeltaAddress = _ziroDeltaAddress;
        oracleAddress = _oracleAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SETTLEMENT_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        // Authorize deployer as initial keeper
        authorizedKeepers[msg.sender] = true;
    }

    /**
     * @notice Automated epoch settlement with oracle integration
     * @dev Can be called by authorized keepers or settlement role holders
     */
    function settleEpoch() external onlyKeeper {
        if (!autoSettlementEnabled) revert SettlementDisabled();
        
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        IZiroDeltaOracle oracle = IZiroDeltaOracle(oracleAddress);
        
        uint256 currentEpoch = ziroDelta.currentEpoch();
        
        // Get current epoch data
        (
            uint256 startTime,
            uint256 endTime,
            ,
            ,
            ,
            ,
            bool settled,
        ) = ziroDelta.getEpochData(currentEpoch);
        
        // Check if epoch is ready for settlement
        if (block.timestamp < endTime) revert EpochNotReady();
        if (settled) return; // Already settled
        
        // Check settlement window
        if (block.timestamp > endTime + SETTLEMENT_WINDOW) {
            revert SettlementWindowExpired();
        }
        
        // Check oracle status
        if (oracle.emergencyMode()) revert OracleInEmergencyMode();
        
        try oracle.updateFundingRate() {
            // Oracle update successful, get the funding rate
            int256 fundingRate = oracle.getCurrentFundingRate();
            
            // Validate funding rate
            if (fundingRate < -int256(MAX_FUNDING_RATE) || fundingRate > int256(MAX_FUNDING_RATE)) {
                revert InvalidFundingRate();
            }
            
            // Settle the epoch
            ziroDelta.settle(fundingRate);
            
            emit EpochSettled(currentEpoch, fundingRate, msg.sender);
            
        } catch Error(string memory reason) {
            emit SettlementFailed(currentEpoch, reason);
            revert(reason);
        }
    }

    /**
     * @notice Manual epoch settlement with custom funding rate
     * @param _fundingRate Custom funding rate for settlement
     * @dev Only available to SETTLEMENT_ROLE holders
     */
    function manualSettlement(int256 _fundingRate) external onlyRole(SETTLEMENT_ROLE) {
        if (_fundingRate < -int256(MAX_FUNDING_RATE) || _fundingRate > int256(MAX_FUNDING_RATE)) {
            revert InvalidFundingRate();
        }
        
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        uint256 currentEpoch = ziroDelta.currentEpoch();
        
        // Get current epoch data
        (
            ,
            uint256 endTime,
            ,
            ,
            ,
            ,
            bool settled,
        ) = ziroDelta.getEpochData(currentEpoch);
        
        if (settled) return; // Already settled
        if (block.timestamp < endTime && !hasRole(EMERGENCY_ROLE, msg.sender)) {
            revert EpochNotReady();
        }
        
        ziroDelta.settle(_fundingRate);
        
        emit EpochSettled(currentEpoch, _fundingRate, msg.sender);
    }

    /**
     * @notice Emergency settlement bypassing normal checks
     * @param _fundingRate Emergency funding rate
     * @dev Only available to EMERGENCY_ROLE holders
     */
    function emergencySettlement(int256 _fundingRate) external onlyRole(EMERGENCY_ROLE) {
        if (_fundingRate < -int256(MAX_FUNDING_RATE) || _fundingRate > int256(MAX_FUNDING_RATE)) {
            revert InvalidFundingRate();
        }
        
        emergencyMode = true;
        emergencyFundingRate = _fundingRate;
        
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        uint256 currentEpoch = ziroDelta.currentEpoch();
        
        ziroDelta.settle(_fundingRate);
        
        emit EmergencySettlement(currentEpoch, _fundingRate);
    }

    /**
     * @notice Check if epoch is ready for settlement
     * @return ready True if epoch can be settled
     * @return timeRemaining Seconds until epoch end (0 if past end)
     */
    function isEpochReady() external view returns (bool ready, uint256 timeRemaining) {
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        uint256 currentEpoch = ziroDelta.currentEpoch();
        
        (
            ,
            uint256 endTime,
            ,
            ,
            ,
            ,
            bool settled,
        ) = ziroDelta.getEpochData(currentEpoch);
        
        if (settled) {
            return (false, 0);
        }
        
        if (block.timestamp >= endTime) {
            return (true, 0);
        } else {
            return (false, endTime - block.timestamp);
        }
    }

    /**
     * @notice Get settlement status and next action
     * @return canSettle Whether settlement can be performed
     * @return reason Reason why settlement cannot be performed (if applicable)
     * @return fundingRate Current oracle funding rate
     */
    function getSettlementStatus() external view returns (
        bool canSettle,
        string memory reason,
        int256 fundingRate
    ) {
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        IZiroDeltaOracle oracle = IZiroDeltaOracle(oracleAddress);
        
        uint256 currentEpoch = ziroDelta.currentEpoch();
        
        (
            ,
            uint256 endTime,
            ,
            ,
            ,
            ,
            bool settled,
        ) = ziroDelta.getEpochData(currentEpoch);
        
        fundingRate = oracle.getCurrentFundingRate();
        
        if (settled) {
            return (false, "Epoch already settled", fundingRate);
        }
        
        if (!autoSettlementEnabled) {
            return (false, "Auto settlement disabled", fundingRate);
        }
        
        if (block.timestamp < endTime) {
            return (false, "Epoch not ended", fundingRate);
        }
        
        if (block.timestamp > endTime + SETTLEMENT_WINDOW) {
            return (false, "Settlement window expired", fundingRate);
        }
        
        if (oracle.emergencyMode()) {
            return (false, "Oracle in emergency mode", fundingRate);
        }
        
        return (true, "Ready for settlement", fundingRate);
    }

    // Admin functions
    function setAutoSettlement(bool _enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        autoSettlementEnabled = _enabled;
        emit AutoSettlementToggled(_enabled);
    }

    function authorizeKeeper(address _keeper, bool _authorized) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedKeepers[_keeper] = _authorized;
        emit KeeperAuthorized(_keeper, _authorized);
    }

    function setOracleAddress(address _oracleAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        oracleAddress = _oracleAddress;
    }

    function setZiroDeltaAddress(address _ziroDeltaAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ziroDeltaAddress = _ziroDeltaAddress;
    }

    function setSettlementGasLimit(uint256 _gasLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        settlementGasLimit = _gasLimit;
    }

    function deactivateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = false;
        emergencyFundingRate = 0;
    }

    // View functions
    function getCurrentEpochInfo() external view returns (
        uint256 epoch,
        uint256 startTime,
        uint256 endTime,
        bool settled,
        int256 fundingRate
    ) {
        IZiroDelta ziroDelta = IZiroDelta(ziroDeltaAddress);
        epoch = ziroDelta.currentEpoch();
        
        (
            startTime,
            endTime,
            fundingRate,
            ,
            ,
            ,
            settled,
        ) = ziroDelta.getEpochData(epoch);
    }
}
