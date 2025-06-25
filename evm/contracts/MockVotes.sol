// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockVotes is ERC20 {
    mapping(address => address) public delegates;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function delegate(address delegatee) public {
        delegates[msg.sender] = delegatee;
    }
}
