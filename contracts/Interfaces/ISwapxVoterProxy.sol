// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface ISwapxVoterProxy {
     // -----------------------------------------------------------------------------------------------------------------
    // STORAGE STRUCTS
    // -----------------------------------------------------------------------------------------------------------------
    // Rewards for one specific pool at one specific epoch
    struct PoolReward {
        address[] tokens;
        mapping(address => uint256) amounts;
        mapping(address => mapping(address => uint256)) userClaimed; // mapping(token => (mapping(user => claimed)))
    }

    struct Epoch {
        uint256 totalWeight; // all vlQuo voted
        mapping(address => uint256) poolWeights; // vlQuo voted by pool
        mapping(address => uint256) userWeights; // vlQuo voted by user
        mapping(address => mapping(address => uint256)) votes; // vlQuo voted by user for pool: mapping(pool => mapping(user => weight))
        address[] poolsWithVotes; // list of pools with votes
        address[] usersWithVotes; // list of users with votes
        mapping(address => uint256) userIndexInArray; // index of user in usersWithVotes
        uint256 lastVotedAt; // last time a vote was submitted
        uint256 lastCastedAt; // last time votes were casted to Swapx
        mapping(address => PoolReward) rewards; // mapping(pool => reward)
    }

    /// @custom:storage-location erc7201:openzeppelin.storage.UserVotesStorage
    struct UserVotesStorage {
        mapping(uint256 => Epoch) epochs;
        mapping(address => uint256[]) claimableEpochs; // epochs to be claimed by user: mapping(user => epochs)
    }

    /// @custom:storage-location erc7201:openzeppelin.storage.DataStorage
    struct DataStorage {
        uint256 veSwapxTokenId;
        uint256 currentEpoch;
        uint256 nextIncreaseUnlockAt;
        address quollRewardsDistributor;
        mapping(address => uint256) usersVotingPower;
        mapping(address => bool) rewardAdmins;
        uint256 protocolFeePer1000;
        uint256 maintenanceFeePer1000;
        bool claimEnabled;
    }

    function getCurrentEpoch() external view returns (uint256);
    function getCurrentVotesForUser(address _user) external view returns (address[] memory, uint256[] memory);
}