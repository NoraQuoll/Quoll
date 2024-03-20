// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./lib/TransferHelper.sol";
import "./lib/Interfaces/IWNative.sol";
import "./lib/Interfaces/IWNativeRelayer.sol";
import "./Interfaces/IBaseRewardPool.sol";
import "./Interfaces/IWombatBooster.sol";
import "./Interfaces/Wombat/IAsset.sol";
import "./Interfaces/Wombat/IPool.sol";
import "./Interfaces/INativeZapper.sol";

contract QuollZap is OwnableUpgradeable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  address public wNative;
  address public wNativeRelayer;

  IWombatBooster public booster;

  // for swap
  address public nativeZapper;
  address public usdtAddress;
  address public quoAddress;

  function initialize() public initializer {
    __Ownable_init();
  }

  function setParams(
    address _wNative,
    address _wNativeRelayer,
    address _booster,
    address _nativeZapper,
    address _usdtAddress,
    address _quoAddress
  ) external onlyOwner {
    require(_wNative != address(0), "invalid _wNative!");
    require(_wNativeRelayer != address(0), "invalid _wNativeRelayer!");
    require(_booster != address(0), "invalid _booster!");

    wNative = _wNative;
    wNativeRelayer = _wNativeRelayer;
    nativeZapper = _nativeZapper;

    usdtAddress = _usdtAddress;
    quoAddress = _quoAddress;
    IERC20(wNative).approve(wNativeRelayer, uint256(-1));

    booster = IWombatBooster(_booster);
  }

  function zapIn(
    uint256 _pid,
    uint256 _amount,
    uint256 _minimumAmount,
    bool _stake
  ) external payable {
    (address lptoken, address token, , address rewardPool, ) = booster.poolInfo(
      _pid
    );

    address underlyingToken = IAsset(lptoken).underlyingToken();
    if (underlyingToken == wNative) {
      require(_amount == msg.value, "invalid amount");
      IWNative(wNative).deposit{ value: _amount }();
    } else {
      require(msg.value == 0, "invalid msg.value");
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
        _minimumAmount,
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
    uint256 tokenAmount = IERC20(token).balanceOf(address(this)).sub(tokenBal);

    if (_stake) {
      IERC20(token).safeApprove(rewardPool, 0);
      IERC20(token).safeApprove(rewardPool, tokenAmount);
      IBaseRewardPool(rewardPool).stakeFor(msg.sender, tokenAmount);
    } else {
      IERC20(token).safeTransfer(msg.sender, tokenAmount);
    }
  }

  function withdraw(uint256 _pid, uint256 _amount) external {
    (address lptoken, address token, , address rewardPool, ) = booster.poolInfo(
      _pid
    );
    IBaseRewardPool(rewardPool).withdrawFor(msg.sender, _amount);
    IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    uint256 lptokenBal = IERC20(lptoken).balanceOf(address(this));
    booster.withdraw(_pid, _amount);
    uint256 lptokenAmount = IERC20(lptoken).balanceOf(address(this)).sub(
      lptokenBal
    );
    IERC20(lptoken).safeTransfer(msg.sender, lptokenAmount);
  }

  function zapOut(
    uint256 _pid,
    uint256 _amount,
    uint256 _minimumAmount,
    bool _stake
  ) external {
    (address lptoken, address token, , address rewardPool, ) = booster.poolInfo(
      _pid
    );

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
        _minimumAmount,
        address(this),
        block.timestamp
      );
      IWNativeRelayer(wNativeRelayer).withdraw(wNative, underlyingTokenAmount);
      TransferHelper.safeTransferETH(msg.sender, underlyingTokenAmount);
    } else {
      IPool(pool).withdraw(
        underlyingToken,
        lptokenAmount,
        _minimumAmount,
        msg.sender,
        block.timestamp
      );
    }
  }

  function claimRewards(uint256[] calldata _pids, bool isSwap) external {
    uint256 sumRewardInUSDT = 0;
    for (uint256 i = 0; i < _pids.length; i++) {
      (, , , address rewardPool, ) = booster.poolInfo(_pids[i]);
      require(rewardPool != address(0), "invalid _pids");
      uint256 rewardInUSDT = IBaseRewardPool(rewardPool).getReward(
        msg.sender,
        isSwap
      );
      sumRewardInUSDT += rewardInUSDT;
    }

    if (sumRewardInUSDT > 0) {
      // from USDT swap to QUO and send to user
      _approveTokenIfNeeded(usdtAddress, nativeZapper, sumRewardInUSDT);
      INativeZapper(nativeZapper).swapToken(
        usdtAddress,
        quoAddress,
        sumRewardInUSDT,
        msg.sender
      );
    }
  }

  function inCaseTokensGetStuck(address _token) external onlyOwner {
    uint256 amount = IERC20(_token).balanceOf(address(this));
    IERC20(_token).safeTransfer(msg.sender, amount);
  }

  function _approveTokenIfNeeded(
    address _token,
    address _to,
    uint256 _amount
  ) internal {
    if (IERC20(_token).allowance(address(this), _to) < _amount) {
      IERC20(_token).safeApprove(_to, 0);
      IERC20(_token).safeApprove(_to, type(uint256).max);
    }
  }

  receive() external payable {}
}
