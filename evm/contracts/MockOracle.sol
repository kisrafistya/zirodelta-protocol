// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockOracle {
    int256 public rate;

    function latestAnswer() external view returns (int256) {
        return rate;
    }

    function setRate(int256 _rate) public {
        rate = _rate;
    }
}
