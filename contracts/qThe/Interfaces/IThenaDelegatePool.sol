// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
pragma experimental ABIEncoderV2;

interface IThenaDelegatePool {
    function stakeFor(address _for, uint256 _amount) external;
    function withdrawFor(address _for, uint256 _amount) external;
    function balanceOf(address account) external view returns (uint256);
    function updateVote() external;
    function totalSupply() external view returns (uint256);
}