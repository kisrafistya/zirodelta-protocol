// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ZiroDeltaMinting} from "../src/ZiroDeltaMinting.sol";
import {MockERC20} from "../src/MockERC20.sol";
import "forge-std/console.sol";

contract ZiroDeltaMintingTest is Test {
    ZiroDeltaMinting public ziroDeltaMinting;
    MockERC20 public pfrt;
    MockERC20 public nfrt;
    MockERC20 public collateral;

    function setUp() public {
        pfrt = new MockERC20("Positive Funding Rate Token", "PFRT");
        nfrt = new MockERC20("Negative Funding Rate Token", "NFRT");
        collateral = new MockERC20("Collateral Token", "USDC");
        ziroDeltaMinting = new ZiroDeltaMinting(address(pfrt), address(nfrt), address(collateral), address(this));
    }

    function test_mint_redeem_fixed() public {
        uint256 amount = 10000;

        collateral.mint(address(this), amount);
        collateral.approve(address(ziroDeltaMinting), amount);

        ziroDeltaMinting.mint(amount);

        uint256 pfrtBalance = pfrt.balanceOf(address(this));
        uint256 nfrtBalance = nfrt.balanceOf(address(this));

        uint256 redeemAmount = pfrtBalance < nfrtBalance ? pfrtBalance : nfrtBalance;

        pfrt.approve(address(ziroDeltaMinting), redeemAmount);
        nfrt.approve(address(ziroDeltaMinting), redeemAmount);

        ziroDeltaMinting.redeem(redeemAmount, redeemAmount);

        assertEq(collateral.balanceOf(address(this)), amount);
    }

    function test_mint_zero_amount() public {
        vm.expectRevert("Collateral amount must be greater than the minimum");
        ziroDeltaMinting.mint(0);
    }

    function test_mint_less_than_minimum() public {
        vm.expectRevert("Collateral amount must be greater than the minimum");
        ziroDeltaMinting.mint(999);
    }

    function test_redeem_zero_amount() public {
        vm.expectRevert("Amounts must be greater than 0");
        ziroDeltaMinting.redeem(0, 0);
    }

    function test_redeem_unequal_amounts() public {
        vm.expectRevert("Amounts must be equal");
        ziroDeltaMinting.redeem(1, 2);
    }

    function test_mint_insufficient_collateral() public {
        uint256 amount = 10000;
        collateral.mint(address(this), amount - 1);
        collateral.approve(address(ziroDeltaMinting), amount);
        vm.expectRevert();
        ziroDeltaMinting.mint(amount);
    }

    function test_redeem_insufficient_pfrt() public {
        uint256 amount = 10000;
        collateral.mint(address(this), amount);
        collateral.approve(address(ziroDeltaMinting), amount);
        ziroDeltaMinting.mint(amount);

        uint256 pfrtBalance = pfrt.balanceOf(address(this));
        uint256 nfrtBalance = nfrt.balanceOf(address(this));

        pfrt.approve(address(ziroDeltaMinting), pfrtBalance + 1);
        nfrt.approve(address(ziroDeltaMinting), nfrtBalance);

        vm.expectRevert();
        ziroDeltaMinting.redeem(pfrtBalance + 1, nfrtBalance);
    }

    function test_redeem_insufficient_nfrt() public {
        uint256 amount = 10000;
        collateral.mint(address(this), amount);
        collateral.approve(address(ziroDeltaMinting), amount);
        ziroDeltaMinting.mint(amount);

        uint256 pfrtBalance = pfrt.balanceOf(address(this));
        uint256 nfrtBalance = nfrt.balanceOf(address(this));

        pfrt.approve(address(ziroDeltaMinting), pfrtBalance);
        nfrt.approve(address(ziroDeltaMinting), nfrtBalance + 1);

        vm.expectRevert();
        ziroDeltaMinting.redeem(pfrtBalance, nfrtBalance + 1);
    }
}
