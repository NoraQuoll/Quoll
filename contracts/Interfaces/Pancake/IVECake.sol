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
    function setWhitelistedCallers(
        address[] calldata callers,
        bool ok
    ) external;

    function createLock(uint256 _amount, uint256 _unlockTime) external;

    function depositFor(address _for, uint256 _amount) external;
    function locks(address user) external returns (LockedBalance memory);

    function balanceOf(address user) external view returns (uint256);
}
