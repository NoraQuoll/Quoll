// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;

/**
 * @dev Interface of the VECake
 */
interface IVECake {
    struct LockedBalance {
        int128 amount;
        uint256 end;
    }

    struct UserInfo {
        address cakePoolProxy; // Proxy Smart Contract for users who had locked in cake pool.
        uint128 cakeAmount; //  Cake amount locked in cake pool.
        uint48 lockEndTime; // Record the lockEndTime in cake pool.
        uint48 migrationTime; // Record the migration time.
        uint16 cakePoolType; // 1: Migration, 2: Delegation.
        uint16 withdrawFlag; // 0: Not withdraw, 1 : withdrew.
    }

    struct Point {
        int128 bias; // Voting weight
        int128 slope; // Multiplier factor to get voting weight at a given time
        uint256 timestamp;
        uint256 blockNumber;
    }

    function setWhitelistedCallers(
        address[] calldata callers,
        bool ok
    ) external;

    function createLock(uint256 _amount, uint256 _unlockTime) external;

    function depositFor(address _for, uint256 _amount) external;

    function locks(address user) external view returns (LockedBalance memory);

    function userInfo(address user) external view returns (UserInfo memory);

    function userPointEpoch(address user) external view returns (uint256);

    function userPointHistory(
        address user,
        uint256 epoch
    ) external view returns (Point memory);

    function balanceOf(address user) external view returns (uint256);
}
