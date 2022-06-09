// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface IWombatBooster {
    function poolInfo(uint256)
        external
        view
        returns (
            address,
            address,
            uint256,
            address,
            bool
        );

    function rewardClaimed(
        uint256,
        address,
        address,
        uint256
    ) external;

    function withdrawTo(
        uint256,
        uint256,
        address
    ) external;

    event Deposited(
        address indexed _user,
        uint256 indexed _poolid,
        uint256 _amount
    );
    event Withdrawn(
        address indexed _user,
        uint256 indexed _poolid,
        uint256 _amount
    );
    event WomClaimed(uint256 _pid, uint256 _amount);
}
