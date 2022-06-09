// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IWomDepositor {
    function deposit(uint256) external;

    event Deposited(address indexed _user, uint256 _amount);
}
