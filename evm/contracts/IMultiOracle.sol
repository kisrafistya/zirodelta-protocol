// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMultiOracle {
    function getRate() external view returns (int256);
}
