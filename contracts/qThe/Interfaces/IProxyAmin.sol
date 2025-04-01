// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;


interface ProxyAmin {
    function upgradeAndCall(
        address proxy,
        address implementation,
        bytes memory data
    ) external;

    function upgradeTo(address newImplementation) external;
    function upgrade(address proxy, address implementation) external;

    function upgradeToAndCall(address newImplementation, bytes calldata data)external payable;
}
