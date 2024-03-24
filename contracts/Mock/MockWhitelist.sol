// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract MockWhitelist {
    function check(address a) public pure returns (bool) {
        return true;
    }
}
