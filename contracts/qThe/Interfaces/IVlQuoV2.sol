// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
pragma experimental ABIEncoderV2;

interface IVlQuoV2 {

    struct LockInfo {
        uint256 quoAmount;
        uint256 vlQuoAmount;
        uint256 lockTime;
        uint256 unlockTime;
    }

    event AccessSet(address indexed _address, bool _status);
    event AllowedLockerSet(address indexed _locker, bool _allowed);
    event BalanceUpdated(address indexed _user, uint256 _balance);
    event Locked(address indexed _user, uint256 _amount, uint256 _weeks);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event Paused(address account);
    event RewardAdded(address indexed _rewardToken, uint256 _reward);
    event RewardPaid(
        address indexed _user,
        address indexed _rewardToken,
        uint256 _reward
    );
    event RewardTokenAdded(address indexed _rewardToken);
    event Unlocked(
        address indexed _user,
        uint256 _unlockTime,
        uint256 _quoAmount,
        uint256 _vlQuoAmount
    );
    event Unpaused(address account);

    function FEE_DENOMINATOR() external view returns (uint256);

    function MAX_LOCK_WEEKS() external view returns (uint256);

    function WEEK() external view returns (uint256);

    function access(address) external view returns (bool);

    function allowedLocker(address) external view returns (bool);

    function balanceOf(address _user) external view returns (uint256);

    function blockThirdPartyActions(address) external view returns (bool);

    function bribeManager() external view returns (address);

    function decreaseBalance(address _user, uint256 _amount) external;

    function donate(address _rewardToken, uint256 _amount) external;

    function earned(address _user, address _rewardToken)
    external
    view
    returns (uint256);

    function getReward() external;

    function getRewardTokensLength() external view returns (uint256);

    function getUserLocks(address _user)
    external
    view
    returns (LockInfo[] memory);

    function increaseBalance(address _user, uint256 _amount) external;

    function initialize() external;

    function isRewardToken(address) external view returns (bool);

    function lastClaimedWeek(address) external view returns (uint256);

    function lock(
        address _user,
        uint256 _amount,
        uint256 _weeks
    ) external;

    function maxLockLength() external view returns (uint256);

    function owner() external view returns (address);

    function pause() external;

    function paused() external view returns (bool);

    function queueNewRewards(address _rewardToken, uint256 _rewards) external;

    function queuedRewards(address) external view returns (uint256);

    function quo() external view returns (address);

    function renounceOwnership() external;

    function rewardTokens(uint256) external view returns (address);

    function setAccess(address _address, bool _status) external;

    function setAllowedLocker(address _locker, bool _allowed) external;

    function setBlockThirdPartyActions(bool _block) external;

    function setMaxLockLength(uint256 _maxLockLength) external;

    function setParams(
        address _quo,
        address _bribeManager,
        address _treasury
    ) external;

    function setUnlockGracePeriod(uint256 _unlockGracePeriod) external;

    function setUnlockPunishment(uint256 _unlockPunishment) external;

    function totalSupply() external view returns (uint256);

    function transferOwnership(address newOwner) external;

    function treasury() external view returns (address);

    function unlock(uint256 _slot) external;

    function unlockGracePeriod() external view returns (uint256);

    function unlockPunishment() external view returns (uint256);

    function unpause() external;

    function userLocks(address, uint256)
    external
    view
    returns (
        uint256 quoAmount,
        uint256 vlQuoAmount,
        uint256 lockTime,
        uint256 unlockTime
    );

    function weeklyRewards(address, uint256) external view returns (uint256);

    function weeklyTotalWeight(uint256) external view returns (uint256);

    function weeklyUserWeight(address, uint256) external view returns (uint256);
}
