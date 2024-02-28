// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IPancakePath {
    function setPath(
        address _from,
        address _to,
        address[] calldata _path
    ) external;

    function getPath(address _from, address _to)
        external
        view
        returns (address[] memory);
}
