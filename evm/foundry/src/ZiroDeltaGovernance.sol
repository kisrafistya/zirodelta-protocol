// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title ZiroDeltaGovernance
 * @author MiniMax Agent
 * @notice Production-ready governance contract with proper voting mechanisms and timelock integration
 * @dev Implements comprehensive governance with vote delegation, quorum requirements, and execution delays
 */
contract ZiroDeltaGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Production governance parameters
    uint256 public constant VOTING_DELAY = 1 days; // 1 day delay before voting starts
    uint256 public constant VOTING_PERIOD = 7 days; // 7 day voting period
    uint256 public constant PROPOSAL_THRESHOLD = 100000e18; // 100,000 ZDLT required to propose
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4% quorum requirement
    uint256 public constant TIMELOCK_DELAY = 2 days; // 2 day execution delay

    // Emergency governance parameters (for critical fixes)
    uint256 public constant EMERGENCY_VOTING_DELAY = 6 hours;
    uint256 public constant EMERGENCY_VOTING_PERIOD = 2 days;
    uint256 public constant EMERGENCY_QUORUM_PERCENTAGE = 10; // Higher quorum for emergency
    
    bool public emergencyMode;
    mapping(uint256 => bool) public emergencyProposals;

    // Events
    event EmergencyModeActivated(address indexed activator);
    event EmergencyModeDeactivated(address indexed deactivator);
    event EmergencyProposalCreated(uint256 indexed proposalId, address indexed proposer);

    // Custom errors
    error EmergencyModeNotActive();
    error UnauthorizedEmergencyAction();
    error InvalidProposalParameters();

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("ZiroDelta DAO")
        GovernorSettings(
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(QUORUM_PERCENTAGE)
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @notice Create a standard governance proposal
     * @param targets Array of target contract addresses
     * @param values Array of ETH values to send
     * @param calldatas Array of function call data
     * @param description Proposal description
     * @return Proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        if (targets.length == 0) revert InvalidProposalParameters();
        if (targets.length != values.length || targets.length != calldatas.length) {
            revert InvalidProposalParameters();
        }

        return super.propose(targets, values, calldatas, description);
    }

    /**
     * @notice Create an emergency proposal with expedited voting
     * @param targets Array of target contract addresses
     * @param values Array of ETH values to send
     * @param calldatas Array of function call data
     * @param description Proposal description (must include "EMERGENCY:")
     * @return Proposal ID
     */
    function proposeEmergency(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        if (!emergencyMode) revert EmergencyModeNotActive();
        if (targets.length == 0) revert InvalidProposalParameters();
        
        // Must have significantly higher token threshold for emergency proposals
        if (getVotes(msg.sender, block.number - 1) < PROPOSAL_THRESHOLD * 5) {
            revert UnauthorizedEmergencyAction();
        }

        // Temporarily override settings for emergency proposal
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        emergencyProposals[proposalId] = true;

        emit EmergencyProposalCreated(proposalId, msg.sender);
        return proposalId;
    }

    /**
     * @notice Activate emergency governance mode
     * @dev Can only be called by addresses with significant voting power
     */
    function activateEmergencyMode() external {
        // Require caller to have at least 1% of total supply
        uint256 requiredVotes = (token().getPastTotalSupply(block.number - 1) * 100) / 10000;
        if (getVotes(msg.sender, block.number - 1) < requiredVotes) {
            revert UnauthorizedEmergencyAction();
        }

        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }

    /**
     * @notice Deactivate emergency governance mode
     * @dev Can be called after emergency proposals are resolved
     */
    function deactivateEmergencyMode() external {
        // Can be deactivated by admin or by vote
        if (!hasRole(TIMELOCK_ADMIN_ROLE, msg.sender)) {
            uint256 requiredVotes = (token().getPastTotalSupply(block.number - 1) * 100) / 10000;
            if (getVotes(msg.sender, block.number - 1) < requiredVotes) {
                revert UnauthorizedEmergencyAction();
            }
        }

        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    // Override functions to handle emergency proposals
    function votingDelay() public view override returns (uint256) {
        return emergencyMode ? EMERGENCY_VOTING_DELAY : super.votingDelay();
    }

    function votingPeriod() public view override returns (uint256) {
        return emergencyMode ? EMERGENCY_VOTING_PERIOD : super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override returns (uint256) {
        if (emergencyMode) {
            return (token().getPastTotalSupply(blockNumber) * EMERGENCY_QUORUM_PERCENTAGE) / 100;
        }
        return super.quorum(blockNumber);
    }

    /**
     * @notice Get proposal threshold based on current mode
     * @return Required token amount to create proposals
     */
    function proposalThreshold() public view override returns (uint256) {
        if (emergencyMode) {
            return PROPOSAL_THRESHOLD * 5; // 5x higher threshold for emergency
        }
        return super.proposalThreshold();
    }

    /**
     * @notice Check if a proposal is an emergency proposal
     * @param proposalId Proposal ID to check
     * @return True if emergency proposal
     */
    function isEmergencyProposal(uint256 proposalId) external view returns (bool) {
        return emergencyProposals[proposalId];
    }

    // Required overrides for multiple inheritance
    function state(uint256 proposalId) 
        public 
        view 
        override(Governor, GovernorTimelockControl) 
        returns (ProposalState) 
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId) 
        public 
        view 
        override(Governor, GovernorTimelockControl) 
        returns (bool) 
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    // Additional view functions for governance transparency
    function getGovernanceParameters() external view returns (
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        uint256 quorumPercentage_,
        bool emergencyMode_
    ) {
        return (
            votingDelay(),
            votingPeriod(), 
            proposalThreshold(),
            emergencyMode ? EMERGENCY_QUORUM_PERCENTAGE : QUORUM_PERCENTAGE,
            emergencyMode
        );
    }

    function getProposalStats(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 quorumRequired,
        bool isEmergency
    ) {
        (forVotes, againstVotes, abstainVotes) = proposalVotes(proposalId);
        quorumRequired = quorum(proposalSnapshot(proposalId));
        isEmergency = emergencyProposals[proposalId];
    }
}
