// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract QMilesPts is ERC20Upgradeable, OwnableUpgradeable {
    mapping(address => bool) public access;

    event AccessUpdated(address _operator, bool _access);

    function initialize() public initializer {
        __Ownable_init();

        __ERC20_init_unchained("qMILES", "qMILES");

        access[msg.sender] = true;

        emit AccessUpdated(msg.sender, true);
    }

    function setAccess(address _operator, bool _access) external onlyOwner {
        require(_operator != address(0), "invalid _operator!");
        access[_operator] = _access;

        emit AccessUpdated(_operator, _access);
    }

    function mint(address _to, uint256 _amount) external {
        require(access[msg.sender], "!auth");
        _mint(_to, _amount);
    }
}
