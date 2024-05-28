// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./IRewards.sol";

interface IBaseRewardPoolV1WithLockqWom {
    function setParams(
        address _booster,
        uint256 _pid,
        address _stakingToken,
        address _rewardToken
    ) external;

    function getReward(address) external returns (uint256);

    event BoosterUpdated(address _booster);
    event OperatorUpdated(address _operator);
    event Granted(address _address, bool _grant);

    event SwapRewardToUSDT(address reward, uint256 amountIn, uint256 amountOut);

    // inherit IReward
    function stakingToken() external view returns (IERC20);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function lock(uint256) external;

    function lockAll() external;

    function lockFor(address, uint256) external;

    function unlock() external;

    // function unlockAll() external;

    // function getUserAmountTime(address) external view returns (uint256);

    function getRewardTokens() external view returns (address[] memory);

    function getRewardTokensLength() external view returns (uint256);

    function setAccess(address _address, bool _status) external;

    event RewardTokenAdded(address indexed _rewardToken);
    event RewardAdded(address indexed _rewardToken, uint256 _reward);
    event Staked(address indexed _user, uint256 _amount);
    event Withdrawn(address indexed _user, uint256 _amount);
    event RewardPaid(
        address indexed _user,
        address indexed _rewardToken,
        uint256 _reward
    );
    event AccessSet(address indexed _address, bool _status);
}
