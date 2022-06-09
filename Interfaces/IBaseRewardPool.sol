// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./IRewards.sol";

interface IBaseRewardPool is IRewards {
    function setParams(
        address _booster,
        uint256 _pid,
        address _stakingToken,
        address _rewardToken
    ) external;

    function getReward(address) external;

    event BoosterUpdated(address _booster);
    event OperatorUpdated(address _operator);
}
