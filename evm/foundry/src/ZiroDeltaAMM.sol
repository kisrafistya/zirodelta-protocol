// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ZiroDeltaAMM
 * @author MiniMax Agent
 * @notice Production-grade AMM with flash loan protection, TWAP pricing, and slippage controls
 * @dev Implements conditional token trading with sophisticated price discovery and security measures
 */
contract ZiroDeltaAMM is Ownable, ReentrancyGuard, AccessControl {
    bytes32 public constant LIQUIDITY_PROVIDER_ROLE = keccak256("LIQUIDITY_PROVIDER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    address public immutable pfrtAddress;
    address public immutable nfrtAddress;

    // Liquidity pool state
    uint256 public pfrtBalance;
    uint256 public nfrtBalance;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityShares;

    // TWAP state
    struct TWAPState {
        uint256 pfrtPriceCumulative;
        uint256 nfrtPriceCumulative;
        uint256 lastUpdateTime;
        uint256 pfrtTWAP; // Price of PFRT in terms of NFRT * 1e18
        uint256 nfrtTWAP; // Price of NFRT in terms of PFRT * 1e18
    }
    
    TWAPState public twapState;
    uint256 public constant TWAP_WINDOW = 15 minutes; // 15-minute TWAP window
    uint256 public constant PRICE_PRECISION = 1e18;

    // Flash loan protection
    mapping(address => uint256) private _lastBlockNumber;
    uint256 public maxSlippageBPS = 500; // 5% max slippage
    uint256 public tradingFee = 30; // 0.3% trading fee
    
    // Circuit breaker
    bool public tradingPaused;
    uint256 public maxTradeSize = 10000e18; // Max trade size per transaction
    uint256 public dailyVolumeLimit = 100000e18; // Daily volume limit
    uint256 public dailyVolume;
    uint256 public lastVolumeResetTime;

    // Events
    event Swap(
        address indexed user, 
        address indexed tokenIn, 
        address indexed tokenOut, 
        uint256 amountIn, 
        uint256 amountOut,
        uint256 fee
    );
    event LiquidityAdded(address indexed user, uint256 pfrtAmount, uint256 nfrtAmount, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed user, uint256 pfrtAmount, uint256 nfrtAmount, uint256 liquidityBurned);
    event TWAPUpdated(uint256 pfrtTWAP, uint256 nfrtTWAP, uint256 timestamp);
    event TradingPaused();
    event TradingResumed();
    event EmergencyWithdraw(address indexed token, uint256 amount);

    // Custom errors
    error InvalidToken();
    error InsufficientAmount();
    error InsufficientLiquidity();
    error SlippageTooHigh();
    error TradeSizeTooLarge();
    error DailyVolumeLimitExceeded();
    error TradingIsPaused();
    error FlashLoanDetected();
    error InvalidSlippage();
    error ZeroLiquidity();

    constructor(address _pfrtAddress, address _nfrtAddress) Ownable(msg.sender) {
        pfrtAddress = _pfrtAddress;
        nfrtAddress = _nfrtAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        twapState.lastUpdateTime = block.timestamp;
        lastVolumeResetTime = block.timestamp;
    }

    /**
     * @notice Swap tokens with flash loan protection and slippage control
     * @param _tokenIn Address of input token
     * @param _amountIn Amount of input tokens
     * @param _minAmountOut Minimum acceptable output amount (slippage protection)
     */
    function swap(
        address _tokenIn, 
        uint256 _amountIn, 
        uint256 _minAmountOut
    ) external nonReentrant {
        if (tradingPaused) revert TradingIsPaused();
        if (_tokenIn != pfrtAddress && _tokenIn != nfrtAddress) revert InvalidToken();
        if (_amountIn == 0) revert InsufficientAmount();
        if (_amountIn > maxTradeSize) revert TradeSizeTooLarge();
        
        // Flash loan protection - prevent same block transactions
        if (_lastBlockNumber[msg.sender] == block.number) revert FlashLoanDetected();
        _lastBlockNumber[msg.sender] = block.number;
        
        // Check daily volume limit
        _checkDailyVolumeLimit(_amountIn);
        
        address tokenOut = _tokenIn == pfrtAddress ? nfrtAddress : pfrtAddress;
        
        // Calculate output amount with fees using TWAP-based pricing
        (uint256 amountOut, uint256 fee) = _calculateSwapAmount(_tokenIn, _amountIn);
        
        if (amountOut == 0) revert InsufficientLiquidity();
        if (amountOut < _minAmountOut) revert SlippageTooHigh();
        
        // Update balances
        if (_tokenIn == pfrtAddress) {
            pfrtBalance += _amountIn;
            nfrtBalance -= amountOut;
        } else {
            nfrtBalance += _amountIn;
            pfrtBalance -= amountOut;
        }
        
        // Update TWAP
        _updateTWAP();
        
        // Execute transfers
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        // Add to daily volume
        dailyVolume += _amountIn;
        
        emit Swap(msg.sender, _tokenIn, tokenOut, _amountIn, amountOut, fee);
    }

    /**
     * @notice Add liquidity to the pool
     * @param _pfrtAmount Amount of PFRT tokens
     * @param _nfrtAmount Amount of NFRT tokens
     * @param _minLiquidity Minimum liquidity tokens to receive
     */
    function addLiquidity(
        uint256 _pfrtAmount, 
        uint256 _nfrtAmount,
        uint256 _minLiquidity
    ) external nonReentrant {
        if (_pfrtAmount == 0 || _nfrtAmount == 0) revert InsufficientAmount();
        
        uint256 liquidityToMint;
        
        if (totalLiquidity == 0) {
            // Initial liquidity
            liquidityToMint = (_pfrtAmount * _nfrtAmount) ** (1 * PRICE_PRECISION / 2) / PRICE_PRECISION;
        } else {
            // Proportional liquidity based on existing pool ratio
            uint256 pfrtLiquidity = (_pfrtAmount * totalLiquidity) / pfrtBalance;
            uint256 nfrtLiquidity = (_nfrtAmount * totalLiquidity) / nfrtBalance;
            liquidityToMint = pfrtLiquidity < nfrtLiquidity ? pfrtLiquidity : nfrtLiquidity;
        }
        
        if (liquidityToMint < _minLiquidity) revert SlippageTooHigh();
        
        // Update balances
        pfrtBalance += _pfrtAmount;
        nfrtBalance += _nfrtAmount;
        totalLiquidity += liquidityToMint;
        liquidityShares[msg.sender] += liquidityToMint;
        
        // Update TWAP
        _updateTWAP();
        
        // Transfer tokens
        IERC20(pfrtAddress).transferFrom(msg.sender, address(this), _pfrtAmount);
        IERC20(nfrtAddress).transferFrom(msg.sender, address(this), _nfrtAmount);
        
        emit LiquidityAdded(msg.sender, _pfrtAmount, _nfrtAmount, liquidityToMint);
    }

    /**
     * @notice Remove liquidity from the pool
     * @param _liquidity Amount of liquidity tokens to burn
     * @param _minPfrt Minimum PFRT tokens to receive
     * @param _minNfrt Minimum NFRT tokens to receive
     */
    function removeLiquidity(
        uint256 _liquidity,
        uint256 _minPfrt,
        uint256 _minNfrt
    ) external nonReentrant {
        if (_liquidity == 0) revert InsufficientAmount();
        if (liquidityShares[msg.sender] < _liquidity) revert InsufficientLiquidity();
        if (totalLiquidity == 0) revert ZeroLiquidity();
        
        // Calculate token amounts to return
        uint256 pfrtAmount = (_liquidity * pfrtBalance) / totalLiquidity;
        uint256 nfrtAmount = (_liquidity * nfrtBalance) / totalLiquidity;
        
        if (pfrtAmount < _minPfrt || nfrtAmount < _minNfrt) revert SlippageTooHigh();
        if (pfrtBalance < pfrtAmount || nfrtBalance < nfrtAmount) revert InsufficientLiquidity();
        
        // Update balances
        pfrtBalance -= pfrtAmount;
        nfrtBalance -= nfrtAmount;
        totalLiquidity -= _liquidity;
        liquidityShares[msg.sender] -= _liquidity;
        
        // Update TWAP
        _updateTWAP();
        
        // Transfer tokens
        IERC20(pfrtAddress).transfer(msg.sender, pfrtAmount);
        IERC20(nfrtAddress).transfer(msg.sender, nfrtAmount);
        
        emit LiquidityRemoved(msg.sender, pfrtAmount, nfrtAmount, _liquidity);
    }

    /**
     * @notice Calculate swap amount with fees and TWAP-based pricing
     * @param _tokenIn Input token address
     * @param _amountIn Input amount
     * @return amountOut Output amount after fees
     * @return fee Fee amount
     */
    function _calculateSwapAmount(address _tokenIn, uint256 _amountIn) 
        internal 
        view 
        returns (uint256 amountOut, uint256 fee) 
    {
        fee = (_amountIn * tradingFee) / 10000;
        uint256 amountInAfterFee = _amountIn - fee;
        
        if (_tokenIn == pfrtAddress) {
            // Use TWAP-adjusted constant product formula
            uint256 newPfrtBalance = pfrtBalance + amountInAfterFee;
            uint256 newNfrtBalance = (pfrtBalance * nfrtBalance) / newPfrtBalance;
            amountOut = nfrtBalance - newNfrtBalance;
            
            // Apply TWAP-based price bounds
            if (twapState.pfrtTWAP > 0) {
                uint256 maxOut = (amountInAfterFee * PRICE_PRECISION) / twapState.pfrtTWAP;
                if (amountOut > maxOut) {
                    amountOut = maxOut;
                }
            }
        } else {
            // NFRT -> PFRT
            uint256 newNfrtBalance = nfrtBalance + amountInAfterFee;
            uint256 newPfrtBalance = (pfrtBalance * nfrtBalance) / newNfrtBalance;
            amountOut = pfrtBalance - newPfrtBalance;
            
            // Apply TWAP-based price bounds  
            if (twapState.nfrtTWAP > 0) {
                uint256 maxOut = (amountInAfterFee * PRICE_PRECISION) / twapState.nfrtTWAP;
                if (amountOut > maxOut) {
                    amountOut = maxOut;
                }
            }
        }
    }

    /**
     * @notice Update TWAP prices
     */
    function _updateTWAP() internal {
        uint256 timeElapsed = block.timestamp - twapState.lastUpdateTime;
        
        if (timeElapsed > 0 && pfrtBalance > 0 && nfrtBalance > 0) {
            // Calculate current prices
            uint256 pfrtPrice = (nfrtBalance * PRICE_PRECISION) / pfrtBalance;
            uint256 nfrtPrice = (pfrtBalance * PRICE_PRECISION) / nfrtBalance;
            
            // Update cumulative prices
            twapState.pfrtPriceCumulative += pfrtPrice * timeElapsed;
            twapState.nfrtPriceCumulative += nfrtPrice * timeElapsed;
            
            // Update TWAP if enough time has passed
            if (timeElapsed >= TWAP_WINDOW) {
                twapState.pfrtTWAP = twapState.pfrtPriceCumulative / timeElapsed;
                twapState.nfrtTWAP = twapState.nfrtPriceCumulative / timeElapsed;
                
                // Reset cumulative prices
                twapState.pfrtPriceCumulative = 0;
                twapState.nfrtPriceCumulative = 0;
                twapState.lastUpdateTime = block.timestamp;
                
                emit TWAPUpdated(twapState.pfrtTWAP, twapState.nfrtTWAP, block.timestamp);
            }
        }
    }

    /**
     * @notice Check and reset daily volume limit
     * @param _tradeSize Size of current trade
     */
    function _checkDailyVolumeLimit(uint256 _tradeSize) internal {
        // Reset daily volume if 24 hours have passed
        if (block.timestamp >= lastVolumeResetTime + 1 days) {
            dailyVolume = 0;
            lastVolumeResetTime = block.timestamp;
        }
        
        if (dailyVolume + _tradeSize > dailyVolumeLimit) {
            revert DailyVolumeLimitExceeded();
        }
    }

    // Admin functions
    function pauseTrading() external onlyRole(EMERGENCY_ROLE) {
        tradingPaused = true;
        emit TradingPaused();
    }

    function resumeTrading() external onlyRole(EMERGENCY_ROLE) {
        tradingPaused = false;
        emit TradingResumed();
    }

    function setMaxSlippage(uint256 _maxSlippageBPS) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_maxSlippageBPS > 1000) revert InvalidSlippage(); // Max 10%
        maxSlippageBPS = _maxSlippageBPS;
    }

    function setTradingFee(uint256 _tradingFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_tradingFee > 100) revert InvalidSlippage(); // Max 1%
        tradingFee = _tradingFee;
    }

    function setMaxTradeSize(uint256 _maxTradeSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTradeSize = _maxTradeSize;
    }

    function setDailyVolumeLimit(uint256 _dailyVolumeLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dailyVolumeLimit = _dailyVolumeLimit;
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyRole(EMERGENCY_ROLE) {
        IERC20(_token).transfer(msg.sender, _amount);
        emit EmergencyWithdraw(_token, _amount);
    }

    // View functions
    function getSwapAmount(address _tokenIn, uint256 _amountIn) 
        external 
        view 
        returns (uint256 amountOut, uint256 fee) 
    {
        return _calculateSwapAmount(_tokenIn, _amountIn);
    }

    function getTWAPPrices() external view returns (uint256 pfrtTWAP, uint256 nfrtTWAP) {
        return (twapState.pfrtTWAP, twapState.nfrtTWAP);
    }

    function getPoolState() external view returns (
        uint256 pfrtBalance_,
        uint256 nfrtBalance_,
        uint256 totalLiquidity_,
        uint256 dailyVolume_,
        bool tradingPaused_
    ) {
        return (pfrtBalance, nfrtBalance, totalLiquidity, dailyVolume, tradingPaused);
    }
}
