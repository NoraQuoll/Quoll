// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IMasterWombat {
    function poolInfo(uint256)
        external
        view
        returns (
            address lpToken, // Address of LP token contract.
            uint256 allocPoint, // How many allocation points assigned to this pool. WOMs to distribute per second.
            uint256 lastRewardTimestamp, // Last timestamp that WOMs distribution occurs.
            uint256 accWomPerShare, // Accumulated WOMs per share, times 1e12.
            address rewarder,
            uint256 sumOfFactors, // the sum of all boosted factors by all of the users in the pool
            uint256 accWomPerFactorShare
        );

    function userInfo(uint256, address)
        external
        view
        returns (
            uint256 amount, // How many LP tokens the user has provided.
            uint256 rewardDebt, // Reward debt. See explanation below.
            uint256 factor
        );

    function wom() external view returns (address);

    function veWom() external view returns (address);

    function rewarderBonusTokenInfo(uint256 _pid)
        external
        view
        returns (address bonusTokenAddress, string memory bonusTokenSymbol);

    function deposit(uint256 _pid, uint256 _amount)
        external
        returns (uint256, uint256);

    function withdraw(uint256 _pid, uint256 _amount)
        external
        returns (uint256, uint256);
}
