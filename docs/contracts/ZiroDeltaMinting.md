# ZiroDeltaMinting.sol

## Overview

This contract manages the minting and redemption of Positive and Negative Funding Rate Tokens (PFRT and NFRT).
It interacts with a collateral pool (USDC) and an oracle to determine the funding rate.

## Functions

### `mint(uint256 _collateralAmount)`

Mints new PFRT and NFRT by depositing collateral.

- `_collateralAmount`: The amount of USDC to deposit.

### `redeem(uint256 _pfrtAmount, uint256 _nfrtAmount)`

Redeems PFRT and NFRT for collateral.

- `_pfrtAmount`: The amount of PFRT to redeem.
- `_nfrtAmount`: The amount of NFRT to redeem.
