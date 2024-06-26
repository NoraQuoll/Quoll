// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./BribeManager.sol";

contract NoniHolderReward is OwnableUpgradeable {
    struct UserReward {
        address user;
        address[] tokens;
        uint256[] amount;
        bool isReward;
    }

    mapping(uint256 => mapping(address => UserReward)) public rewardData;
    uint256 public rewardLength;
    address public noniAddress;

    address public bribeManager;

    event AddReward(uint256 rewardIndex, address[] users);

    event UserClaim(
        uint256 rewardIndex,
        address[] tokens,
        uint256[] amount,
        address user
    );

    function initialize(
        address _noniAddress,
        address _bribeManager
    ) public initializer {
        __Ownable_init();
        noniAddress = _noniAddress;
        bribeManager = _bribeManager;
    }

    function addRewardForUser(
        address[] memory users,
        uint256[] memory vlQuoVoted,
        address[] memory rewardsToken,
        uint256[] memory rewardsAmount
    ) public onlyOwner {
        require(users.length == vlQuoVoted.length, "invalid input");
        require(
            rewardsToken.length == rewardsAmount.length,
            "invalid token input"
        );

        //calculate totalShared
        uint256 totalVoted;
        for (uint256 i = 0; i < vlQuoVoted.length; i++) {
            totalVoted += vlQuoVoted[i];
        }

        // transfer to address this
        for (uint256 i = 0; i < rewardsToken.length; i++) {
            ERC20(rewardsToken[i]).transferFrom(
                msg.sender,
                address(this),
                rewardsAmount[i]
            );
        }

        for (uint256 i = 0; i < vlQuoVoted.length; i++) {
            address[] memory _rewardToken = new address[](rewardsToken.length);
            uint256[] memory _rewardAmount = new uint256[](rewardsToken.length);
            if (vlQuoVoted[i] > 0) {
                for (uint256 j = 0; j < rewardsToken.length; j++) {
                    _rewardToken[j] = rewardsToken[j];
                    _rewardAmount[j] =
                        (rewardsAmount[j] * vlQuoVoted[i]) /
                        totalVoted;
                }
                rewardData[rewardLength][users[i]] = UserReward({
                    user: users[i],
                    tokens: _rewardToken,
                    amount: _rewardAmount,
                    isReward: false
                });
            }
        }

        emit AddReward(rewardLength, users);
        rewardLength++;
    }

    function claimRewardSlot(
        address user
    ) public view returns (uint256[] memory) {
        uint256 sum;
        for (uint256 i = 0; i < rewardLength; i++) {
            UserReward memory reward = rewardData[i][user];
            if (reward.tokens.length > 0 && !reward.isReward) {
                sum++;
            }
        }

        uint256[] memory result = new uint256[](sum);
        uint256 index;
        for (uint256 i = 0; i < rewardLength; i++) {
            UserReward memory reward = rewardData[i][user];
            if (reward.tokens.length > 0 && !reward.isReward) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    function claimRewards(uint256[] memory indexes) public {
        for (uint256 k = 0; k < indexes.length; k++) {
            UserReward storage reward = rewardData[indexes[k]][msg.sender];

            if (reward.tokens.length > 0 && !reward.isReward) {
                for (uint256 i = 0; i < reward.tokens.length; i++) {
                    ERC20(reward.tokens[i]).transfer(
                        msg.sender,
                        reward.amount[i]
                    );
                }

                emit UserClaim(
                    indexes[k],
                    reward.tokens,
                    reward.amount,
                    msg.sender
                );

                reward.isReward = true;
            }
        }
    }

    function claimReward(uint256 index) public {
        UserReward storage reward = rewardData[index][msg.sender];

        if (reward.tokens.length > 0 && !reward.isReward) {
            for (uint256 i = 0; i < reward.tokens.length; i++) {
                ERC20(reward.tokens[i]).transfer(msg.sender, reward.amount[i]);
            }

            emit UserClaim(index, reward.tokens, reward.amount, msg.sender);

            reward.isReward = true;
        }
    }

    function snapshotData(
        address lp
    ) public view returns (address[] memory, uint256[] memory) {
        address[] memory users = getAllUser();
        uint256[] memory amount = new uint256[](users.length);

        uint256 realUserLength = 0;

        for (uint256 i = 0; i < users.length; i++) {
            amount[i] = getUserVotedForPool(users[i], lp);
            if (amount[i] > 0) {
                realUserLength++;
            }
        }

        address[] memory usersValid = new address[](realUserLength);
        uint256[] memory amountValid = new uint256[](realUserLength);

        uint256 index = 0;

        for (uint256 i = 0; i < users.length; i++) {
            if (amount[i] > 0) {
                usersValid[index] = users[i];
                amountValid[index] = amount[i];
                index++;
            }
        }

        return (usersValid, amountValid);
    }

    function getAllUser() public view returns (address[] memory _users) {
        uint256 totalSupply = ERC721(noniAddress).totalSupply();

        address[] memory temp = new address[](totalSupply);
        uint256 tempLength;

        for (uint256 i = 1; i <= totalSupply; i++) {
            address _tempUser = ERC721(noniAddress).ownerOf(i);
            if (!isContains(temp, _tempUser)) {
                temp[tempLength] = _tempUser;
                tempLength++;
            }
        }

        _users = new address[](tempLength);

        for (uint256 i = 0; i < tempLength; i++) {
            _users[i] = temp[i];
        }
    }

    function getUserVotedForPool(
        address _user,
        address pool
    ) public view returns (uint256) {
        return
            BribeManager(payable(bribeManager)).getUserVoteForPool(pool, _user);
    }

    function isContains(
        address[] memory addresses,
        address _user
    ) public pure returns (bool) {
        for (uint256 i = 0; i < addresses.length; i++) {
            if (addresses[i] == _user) {
                return true;
            }
        }
        return false;
    }
}
