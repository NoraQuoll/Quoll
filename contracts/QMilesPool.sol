// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./QMilesPts.sol";

contract QMilesPool is OwnableUpgradeable {
    mapping(address => bool) public access;

    struct UserData {
        uint256 amount;
        uint256 updateTime;
        uint256 weeksUpdated;
    }

    uint256 public constant DENOMINATOR = 1e10;
    uint256 public constant WEEK = 604800;

    address public qMiles;

    // MultiplierData[] public multiplierData;

    mapping(address => UserData[]) public userData;
    uint256 public constant MULTI_EACH_4_WEEK = 1e8;
    uint256 public constant INCREASE_WEEK = 4;

    function initialize(address _qMiles) public initializer {
        __Ownable_init();
        qMiles = _qMiles;
    }

    // function getMultiplierData() public view returns (MultiplierData[] memory) {
    //     return multiplierData;
    // }

    function withdraw(uint256[] memory index) public {
        uint256 sum;
        for (uint256 i = 0; i < index.length; i++) {
            if (i != index.length - 1) {
                require(index[i] > index[i + 1], "invalid data");
            }
            sum += _withdraw(index[i]);
        }

        QMilesPts(qMiles).mint(msg.sender, sum);
    }

    function _withdraw(uint256 index) public returns (uint256 qMilesAmount) {
        UserData storage userDataIndex = userData[msg.sender][index];
        while (userDataIndex.updateTime + WEEK <= block.timestamp) {
            userDataIndex.updateTime = userDataIndex.updateTime + WEEK;
            userDataIndex.weeksUpdated++;
            uint256 multiplier = (userDataIndex.weeksUpdated / 4 + 1) *
                MULTI_EACH_4_WEEK;
            userDataIndex.amount =
                (userDataIndex.amount * (DENOMINATOR + multiplier)) /
                DENOMINATOR;
        }

        qMilesAmount = userDataIndex.amount;

        // update to latest and pop
        userDataIndex.amount = userData[msg.sender][
            userData[msg.sender].length - 1
        ].amount;
        userDataIndex.updateTime = userData[msg.sender][
            userData[msg.sender].length - 1
        ].updateTime;
        userDataIndex.weeksUpdated = userData[msg.sender][
            userData[msg.sender].length - 1
        ].weeksUpdated;

        userData[msg.sender].pop();
    }

    function deposit(uint256 amount) public {
        // update old data
        for (uint256 i = 0; i < userData[msg.sender].length; i++) {
            // need to update
            UserData storage userDataIndex = userData[msg.sender][i];
            while (userDataIndex.updateTime + WEEK <= block.timestamp) {
                userDataIndex.updateTime = userDataIndex.updateTime + WEEK;
                userDataIndex.weeksUpdated++;
                uint256 multiplier = (userDataIndex.weeksUpdated / 4 + 1) *
                    MULTI_EACH_4_WEEK;
                userDataIndex.amount =
                    (userDataIndex.amount * (DENOMINATOR + multiplier)) /
                    DENOMINATOR;
            }
        }

        QMilesPts(qMiles).transferFrom(msg.sender, address(this), amount);
        userData[msg.sender].push(UserData(amount, block.timestamp, 0));
    }

    function getStakingData(
        address _user
    )
        public
        view
        returns (UserData[] memory result, uint256[] memory multiplierArray)
    {
        result = new UserData[](userData[_user].length);
        multiplierArray = new uint256[](userData[_user].length);
        for (uint256 i = 0; i < userData[_user].length; i++) {
            // need to update
            result[i] = userData[_user][i];
            multiplierArray[i] = ((result[i].weeksUpdated / 4 + 1) *
                MULTI_EACH_4_WEEK +
                DENOMINATOR);
            while (result[i].updateTime + WEEK <= block.timestamp) {
                result[i].updateTime = result[i].updateTime + WEEK;
                result[i].weeksUpdated++;
                uint256 multiplier = (result[i].weeksUpdated / 4 + 1) *
                    MULTI_EACH_4_WEEK;
                result[i].amount =
                    (result[i].amount * (DENOMINATOR + multiplier)) /
                    DENOMINATOR;

                multiplierArray[i] = (DENOMINATOR + multiplier);
            }
        }
    }
}
