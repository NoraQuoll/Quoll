// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract VlQuoV2Lens is OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 public constant CONST_30_DAYS = 86400 * 30;

    struct UserReward {
        address user;
        uint256 amountQuo;
        bool isReward;
    }

    mapping(address => UserReward) public userData;

    address public vlQuoV2;

    uint256 public startTime;

    address public wom;

    uint256 public constant DENOMINATOR = 1000;
    uint256 public penalty;

    function initialize() external initializer {
        __Ownable_init();
    }

    function initUserGetReward(
        address[] calldata users,
        uint256[] memory amounts,
        uint256 _startTime,
        address _wom,
        uint256 _penalty,
        address _vlQuoV2
    ) public onlyOwner {
        require(startTime == 0, "Already init");

        require(_startTime > block.timestamp, "start time invalid");
        startTime = _startTime;

        require(users.length == amounts.length, "Invalid args");

        for (uint256 i = 0; i < users.length; i++) {
            if (amounts[i] > 0) {
                userData[users[i]] = UserReward(users[i], amounts[i], false);
            }
        }

        wom = _wom;
        penalty = _penalty;
        vlQuoV2 = _vlQuoV2;
    }

    function claimTokenWom() public onlyOwner {
        require(startTime != 0, "Not init yet");
        require(
            block.timestamp > startTime + CONST_30_DAYS,
            "Could not claim token before 30 days"
        );

        IERC20(wom).safeTransfer(
            msg.sender,
            IERC20(wom).balanceOf(address(this))
        );
    }

    function getUserData(
        address _user,
        uint256 _weeks
    ) public returns (uint256) {
        // only vlQUO can call
        require(
            msg.sender == vlQuoV2,
            "only vlQuov2 can call to this function"
        );

        // need to init
        require(startTime != 0, "Not init yet");

        // only can call within 30 days
        require(block.timestamp > startTime, "Not yet start");
        require(
            block.timestamp <= startTime + CONST_30_DAYS,
            "Only can claim within 30 days"
        );

        require(_weeks == 26 || _weeks == 52, "invalid lock week");

        require(!userData[_user].isReward, "Already reward");
        require(userData[_user].amountQuo > 0, "Dont have reward for user");

        userData[_user].isReward = true;

        if (_weeks == 26) {
            uint256 amountToTransfer = userData[_user].amountQuo -
                (userData[_user].amountQuo * penalty) /
                DENOMINATOR;

            IERC20(wom).transfer(vlQuoV2, amountToTransfer);
            return amountToTransfer;
        } else {
            uint256 amountToTransfer = userData[_user].amountQuo;
            IERC20(wom).transfer(vlQuoV2, amountToTransfer);
            return amountToTransfer;
        }
    }
}
