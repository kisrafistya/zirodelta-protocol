# ZiroDelta Economic Model

## Tokenomics

The ZiroDelta Protocol has two main tokens:

- **PFRT (Positive Funding Rate Token)**: Represents a long position on the funding rate.
- **NFRT (Negative Funding Rate Token)**: Represents a short position on the funding rate.
- **ZDLT (ZiroDelta Governance Token)**: Used for governance and voting on proposals.

## Risk Analysis

### Oracle Manipulation

The protocol relies on an oracle to provide funding rate data. If the oracle is manipulated, it could lead to incorrect pricing and settlement.
To mitigate this risk, the protocol uses a decentralized oracle network and has an emergency update mechanism that can be used to manually update the funding rate in case of an oracle failure.

### Slippage

The AMM is subject to slippage, which can result in users getting a worse price than expected.
To mitigate this risk, the protocol has a slippage protection mechanism that allows users to specify the maximum slippage they are willing to tolerate.

### Reentrancy

The contracts are protected against reentrancy attacks by using the `nonReentrant` modifier from OpenZeppelin.

## Parameter Optimization

The following parameters can be optimized to improve the performance and security of the protocol:

- **Minting Fee**: The fee charged for minting new tokens.
- **Voting Delay**: The delay between when a proposal is created and when voting starts.
- **Voting Period**: The duration of the voting period.
- **Quorum Fraction**: The minimum percentage of the total supply of ZDLT that must vote on a proposal for it to be valid.
- **Timelock Delay**: The delay between when a proposal is approved and when it is executed.
