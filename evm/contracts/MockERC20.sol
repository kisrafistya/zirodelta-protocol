// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMintableBurnableERC20} from "./IMintableBurnableERC20.sol";

contract MockERC20 is ERC20, IMintableBurnableERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burnFrom(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
