// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() public ERC20("Test Token", "Test Token") {}

    function mint(address user, uint256 amount) public {
        _mint(user, amount);
    }
}
