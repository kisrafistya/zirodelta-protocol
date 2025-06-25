// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title ZiroDeltaTimelock
 * @author MiniMax Agent
 * @notice This contract implements a timelock for the ZiroDelta Protocol.
 * It is used to enforce a delay on all governance actions, giving users time to review and react to proposed changes.
 */
contract ZiroDeltaTimelock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors, msg.sender) {}
}
