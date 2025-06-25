// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMultiOracle} from "./IMultiOracle.sol";

contract MockMultiOracle is IMultiOracle {
    int256 public rate;

    function getRate() external view override returns (int256) {
        return rate;
    }

    function setRate(int256 _rate) public {
        rate = _rate;
    }
}
