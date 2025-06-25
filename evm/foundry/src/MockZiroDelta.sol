// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockZiroDelta {
    bool public settled;

    function settle() external {
        settled = true;
    }
}
