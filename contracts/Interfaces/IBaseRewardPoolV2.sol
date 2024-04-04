// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./IRewards.sol";

interface IBaseRewardPoolV2 is IRewards {
    function setParams(
        address _booster,
        uint256 _pid,
        address _stakingToken,
        address _rewardToken,
        address _pancakePath,
        address _pancakeRouter,
        address _usdtAddress
    ) external;

    function getReward(address, bool isSwap) external returns (uint256);

    function withdrawFor(address _account, uint256 _amount) external;

    event BoosterUpdated(address _booster);
    event OperatorUpdated(address _operator);
    event Granted(address _address, bool _grant);

    event SwapRewardToUSDT(address reward, uint256 amountIn, uint256 amountOut);
}
