// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMintableBurnableERC20} from "./IMintableBurnableERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ZiroDeltaMinting
 * @author MiniMax Agent
 * @notice This contract manages the minting and redemption of Positive and Negative Funding Rate Tokens (PFRT and NFRT).
 * It interacts with a collateral pool (USDC) and an oracle to determine the funding rate.
 */
contract ZiroDeltaMinting is Ownable, ReentrancyGuard {
    address public immutable pfrtAddress;
    address public immutable nfrtAddress;
    address public immutable collateralAddress;
    address public immutable oracleAddress;

    uint256 public constant MINT_FEE_BPS = 10; // 0.1%
    uint256 public constant MIN_COLLATERAL = 1000;

    event Mint(address indexed user, uint256 collateralAmount, uint256 pfrtAmount, uint256 nfrtAmount);
    event Redeem(address indexed user, uint256 pfrtAmount, uint256 nfrtAmount, uint256 collateralAmount);

    constructor(
        address _pfrtAddress,
        address _nfrtAddress,
        address _collateralAddress,
        address _oracleAddress
    ) Ownable(msg.sender) {
        pfrtAddress = _pfrtAddress;
        nfrtAddress = _nfrtAddress;
        collateralAddress = _collateralAddress;
        oracleAddress = _oracleAddress;
    }

    /**
     * @notice Mints new PFRT and NFRT by depositing collateral.
     * @param _collateralAmount The amount of USDC to deposit.
     */
    function mint(uint256 _collateralAmount) external nonReentrant {
        require(_collateralAmount >= MIN_COLLATERAL, "Collateral amount must be greater than the minimum");

        uint256 fee = (_collateralAmount * MINT_FEE_BPS) / 10000;
        uint256 netCollateral = _collateralAmount - fee;

        // Transfer collateral from user to this contract
        IERC20(collateralAddress).transferFrom(msg.sender, address(this), _collateralAmount);

        // Transfer the fee to the owner
        IERC20(collateralAddress).transfer(owner(), fee);

        // Mint PFRT and NFRT
        IMintableBurnableERC20(pfrtAddress).mint(msg.sender, netCollateral);
        IMintableBurnableERC20(nfrtAddress).mint(msg.sender, netCollateral);

        emit Mint(msg.sender, _collateralAmount, netCollateral, netCollateral);
    }

    /**
     * @notice Redeems PFRT and NFRT for collateral.
     * @param _pfrtAmount The amount of PFRT to redeem.
     * @param _nfrtAmount The amount of NFRT to redeem.
     */
    function redeem(uint256 _pfrtAmount, uint256 _nfrtAmount) external nonReentrant {
        require(_pfrtAmount > 0 && _nfrtAmount > 0, "Amounts must be greater than 0");
        require(_pfrtAmount == _nfrtAmount, "Amounts must be equal");

        // Burn PFRT and NFRT
        IMintableBurnableERC20(pfrtAddress).burnFrom(msg.sender, _pfrtAmount);
        IMintableBurnableERC20(nfrtAddress).burnFrom(msg.sender, _nfrtAmount);

        // Transfer collateral back to the user
        IERC20(collateralAddress).transfer(msg.sender, _pfrtAmount);

        emit Redeem(msg.sender, _pfrtAmount, _nfrtAmount, _pfrtAmount);
    }
}
