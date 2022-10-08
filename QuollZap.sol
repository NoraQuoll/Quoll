// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@shared/lib-contracts/contracts/Dependencies/TransferHelper.sol";
import "@shared/lib-contracts/contracts/Interfaces/IWNative.sol";
import "@shared/lib-contracts/contracts/Interfaces/IWNativeRelayer.sol";
import "./Interfaces/IBaseRewardPool.sol";
import "./Interfaces/IWombatBooster.sol";
import "./Interfaces/Wombat/IAsset.sol";
import "./Interfaces/Wombat/IPool.sol";

contract QuollZap is OwnableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public wNative;
    address public wNativeRelayer;

    IWombatBooster public booster;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _wNative,
        address _wNativeRelayer,
        address _booster
    ) external onlyOwner {
        wNative = _wNative;
        wNativeRelayer = _wNativeRelayer;
        IERC20(wNative).safeApprove(wNativeRelayer, uint256(-1));

        booster = IWombatBooster(_booster);
    }

    function zapIn(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) external payable {
        (address lptoken, address token, , address rewardPool, ) = booster
            .poolInfo(_pid);

        address underlyingToken = IAsset(lptoken).underlyingToken();
        if (underlyingToken == wNative) {
            require(_amount == msg.value, "invalid amount");
            IWNative(wNative).deposit{value: _amount}();
        } else {
            IERC20(underlyingToken).safeTransferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }

        uint256 liquidity;
        {
            address pool = IAsset(lptoken).pool();
            IERC20(underlyingToken).safeApprove(pool, 0);
            IERC20(underlyingToken).safeApprove(pool, _amount);

            uint256 lptokenBalBefore = IERC20(lptoken).balanceOf(address(this));
            liquidity = IPool(pool).deposit(
                underlyingToken,
                _amount,
                0,
                address(this),
                block.timestamp,
                false
            );
            uint256 lptokenBalAfter = IERC20(lptoken).balanceOf(address(this));
            require(
                lptokenBalAfter.sub(lptokenBalBefore) >= liquidity,
                "invalid depost"
            );
        }

        uint256 tokenBal = IERC20(token).balanceOf(address(this));
        IERC20(lptoken).safeApprove(address(booster), 0);
        IERC20(lptoken).safeApprove(address(booster), liquidity);
        booster.deposit(_pid, liquidity, false);
        uint256 tokenAmount = IERC20(token).balanceOf(address(this)).sub(
            tokenBal
        );

        if (_stake) {
            IERC20(token).safeApprove(rewardPool, 0);
            IERC20(token).safeApprove(rewardPool, tokenAmount);
            IBaseRewardPool(rewardPool).stakeFor(msg.sender, tokenAmount);
        } else {
            IERC20(token).safeTransfer(msg.sender, tokenAmount);
        }
    }

    function zapOut(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) external {
        (address lptoken, address token, , address rewardPool, ) = booster
            .poolInfo(_pid);

        if (_stake) {
            IBaseRewardPool(rewardPool).withdrawFor(msg.sender, _amount);
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 lptokenBal = IERC20(lptoken).balanceOf(address(this));
        booster.withdraw(_pid, _amount);
        uint256 lptokenAmount = IERC20(lptoken).balanceOf(address(this)).sub(
            lptokenBal
        );

        address underlyingToken = IAsset(lptoken).underlyingToken();
        address pool = IAsset(lptoken).pool();
        IERC20(lptoken).safeApprove(pool, 0);
        IERC20(lptoken).safeApprove(pool, lptokenAmount);

        if (underlyingToken == wNative) {
            uint256 underlyingTokenAmount = IPool(pool).withdraw(
                underlyingToken,
                lptokenAmount,
                0,
                address(this),
                block.timestamp
            );
            IWNativeRelayer(wNativeRelayer).withdraw(
                wNative,
                underlyingTokenAmount
            );
            TransferHelper.safeTransferETH(msg.sender, underlyingTokenAmount);
        } else {
            IPool(pool).withdraw(
                underlyingToken,
                lptokenAmount,
                0,
                msg.sender,
                block.timestamp
            );
        }
    }

    function inCaseTokensGetStuck(address _token) external onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(msg.sender, amount);
    }

    receive() external payable {}
}
