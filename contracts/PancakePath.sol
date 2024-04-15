// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IPancakePath.sol";

contract PancakePath is IPancakePath, OwnableUpgradeable {
    mapping(address => mapping(address => address[])) public paths;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setPath(
        address _from,
        address _to,
        address[] calldata _path
    ) external override onlyOwner {
        if (_path.length == 0) {
            delete paths[_from][_to];
            return;
        }
        require(_path.length >= 2, "invalid path length");
        require(_path[0] == _from, "invalid path");
        require(_path[_path.length - 1] == _to, "invalid path");

        paths[_from][_to] = _path;
    }

    function getPath(address _from, address _to)
        external
        view
        override
        returns (address[] memory)
    {
        return paths[_from][_to];
    }
}
