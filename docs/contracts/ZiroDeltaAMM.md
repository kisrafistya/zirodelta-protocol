# ZiroDeltaAMM.sol

## Overview

A purpose-built Automated Market Maker (AMM) for trading PFRT and NFRT.
This AMM is designed to handle the specific characteristics of conditional tokens.

## Functions

### `swap(address _tokenIn, uint256 _amountIn)`

Swaps one type of token for another.

- `_tokenIn`: The address of the token to swap.
- `_amountIn`: The amount of the token to swap.

### `addLiquidity(uint256 _pfrtAmount, uint256 _nfrtAmount)`

Adds liquidity to the AMM.

- `_pfrtAmount`: The amount of PFRT to add.
- `_nfrtAmount`: The amount of NFRT to add.

### `removeLiquidity(uint256 _pfrtAmount, uint256 _nfrtAmount)`

Removes liquidity from the AMM.

- `_pfrtAmount`: The amount of PFRT to remove.
- `_nfrtAmount`: The amount of NFRT to remove.
