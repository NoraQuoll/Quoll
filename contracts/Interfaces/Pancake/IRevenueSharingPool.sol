// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IRevenueSharingPool {
    function lastTokenTimestamp() external view returns (uint256);

    function checkpointToken() external;

    function checkpointTotalSupply() external;

    function claim(address user) external returns (uint256);

    function claimForUser(address user) external returns (uint256);

    function setRecipient(address _user, address _recipient) external;

    function rewardToken() external view returns (address);
}
