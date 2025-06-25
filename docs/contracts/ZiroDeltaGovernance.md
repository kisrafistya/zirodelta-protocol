# ZiroDeltaGovernance.sol

## Overview

This contract manages the ZDLT governance token and voting process.
It is integrated with a timelock to enforce a delay on all governance actions.

## Functions

### `propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)`

Creates a new governance proposal.

- `targets`: The target addresses for the proposal.
- `values`: The values to be sent with the proposal.
- `calldatas`: The calldata for the proposal.
- `description`: The description of the proposal.
