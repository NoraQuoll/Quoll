// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;


interface ProxyAmin {
    function upgradeAndCall(
        address proxy,
        address implementation,
        bytes memory data
    ) external;
}
