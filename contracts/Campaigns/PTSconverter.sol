// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/ManagerUpgradeable.sol";
import "../QMilesPts.sol";

contract PTSconverter is OwnableUpgradeable {
    uint256 public rate;
    uint256 public constant ONE = 1e18;

    address public vlQuoV2;
    address public qMiles;
    address public quo;

    function initialize(
        uint256 _rate,
        address _vlQuoV2,
        address _qMiles,
        address _quo
    ) external initializer {
        __Ownable_init();
        rate = _rate;
        vlQuoV2 = _vlQuoV2;
        qMiles = _qMiles;
        quo = _quo;
    }

    function changeRate(uint256 newRate) public onlyOwner{
        rate = newRate;
    }

    function getUserData(
        address _user,
        uint256 _amount
    ) public returns (uint256) {
        // only vlQUO can call
        require(
            msg.sender == vlQuoV2,
            "only vlQuov2 can call to this function"
        );

        require(_amount > 0, "Dont have reward for user");

        QMilesPts(qMiles).burn(_user, _amount);

        uint256 amountToTransfer = (_amount * rate) / ONE;

        IERC20(quo).transfer(vlQuoV2, amountToTransfer);

        return amountToTransfer;
    }
}
