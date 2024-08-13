// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./Interfaces/IQuollExternalToken.sol";

contract QuollExternalToken is
    IQuollExternalToken,
    ERC20Upgradeable,
    OwnableUpgradeable
{
    address public operator;

    mapping(address => bool) public operators;

    // --- Events ---
    event OperatorUpdated(address _operator, bool status);

    function initialize(
        string memory _name,
        string memory _symbol
    ) public initializer {
        __Ownable_init();

        __ERC20_init_unchained(_name, _symbol);

        // emit OperatorUpdated(msg.sender, true);
    }

    function setOperator(address _operator, bool status) external onlyOwner {
        // require(operator == address(0), "already set!");
        operators[_operator] = status;

        emit OperatorUpdated(_operator, status);
    }

    function mint(address _to, uint256 _amount) external override {
        require(operators[msg.sender], "!authorized");

        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external override {
        require(operators[msg.sender], "!authorized");

        _burn(_from, _amount);
    }
}
