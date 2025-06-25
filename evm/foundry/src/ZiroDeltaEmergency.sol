// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ZiroDeltaEmergency
 * @author MiniMax Agent
 * @notice This contract handles circuit breakers and emergency procedures for the ZiroDelta Protocol.
 * It uses an access control mechanism to grant pauser and unpauser roles.
 */
contract ZiroDeltaEmergency is AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bool public paused;

    event Paused(address account);
    event Unpaused(address account);

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Pausable: not paused");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        paused = false;
    }

    /**
     * @notice Pauses the system in case of an emergency.
     */
    function pause() external onlyRole(PAUSER_ROLE) whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpauses the system when the emergency is resolved.
     */
    function unpause() external onlyRole(PAUSER_ROLE) whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
