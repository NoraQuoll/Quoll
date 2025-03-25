// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Withdrawable {
    function withdraw() external {
        // check caller is owner
        require(
            msg.sender == 0xE77b1452900b92A9D43Cf87a079fe59c31b3F5ab,
            "Only owner can call this function"
        );

        IERC20(0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF).transfer(
            0xAFa4cb5e317400e39828728375d74b8e1E7a2841,
            IERC20(0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF).balanceOf(
                address(this)
            )
        );
    }
}
