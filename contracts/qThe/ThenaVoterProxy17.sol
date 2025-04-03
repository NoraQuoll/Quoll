// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
pragma experimental ABIEncoderV2;

import "./@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IVlQuoV2.sol";
import "./Interfaces/Thena/IVoterV3.sol";
import "./Interfaces/Thena/IVotingEscrow.sol";
import "../Interfaces/Thena/IRewardsDistributor.sol";
import "./ThenaVoterProxyDeprecatedStorage.sol";
import "./Interfaces/IThenaDelegatePool.sol";

contract ThenaVoterProxy17 is
    ThenaVoterProxyDeprecatedStorage,
    IERC721Receiver,
    OwnableUpgradeable
{
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
        uint256 lastCastedAt; // last time votes were casted to Thena
        mapping(address => PoolReward) rewards; // mapping(pool => reward)
    }

    /// @custom:storage-location erc7201:openzeppelin.storage.UserVotesStorage
    struct UserVotesStorage {
        mapping(uint256 => Epoch) epochs;
        mapping(address => uint256[]) claimableEpochs; // epochs to be claimed by user: mapping(user => epochs)
    }

    /// @custom:storage-location erc7201:openzeppelin.storage.DataStorage
    struct DataStorage {
        uint256 veTheTokenId;
        uint256 currentEpoch;
        uint256 nextIncreaseUnlockAt;
        address quollRewardsDistributor;
        mapping(address => bool) delegationAdmins;
        mapping(address => bool) rewardAdmins;
        uint256 protocolFeePer1000;
        bool claimEnabled;
        uint256 maintenanceFeePer1000;
    }

    // Free space for future upgrades
    uint256[50] private __gap;

    // -----------------------------------------------------------------------------------------------------------------
    // CONSTANTS
    // -----------------------------------------------------------------------------------------------------------------
    // 7 days, to use as denominator in lock calculation
    uint256 private constant WEEK = 604800;

    // 2 years
    uint256 private constant MAX_LOCK_DURATION = 63_072_000; // 2 years

    address private constant QUO = 0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF;
    address private constant VL_QUO =
        0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60;
    address private constant THE = 0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11;
    address private constant Q_THE = 0x0427dF380aECdB4657b1334aB608DA16b7526Ab2;
    address private constant VE_THE =
        0xfBBF371C9B0B994EebFcC977CEf603F7f31c070D;
    address private constant THE_DEPOSITOR =
        0x7Ca6A84eb52478df142981a590c7836d5b49D179;
    address private constant THENA_VOTER_V3 =
        0x3A1D0952809F4948d15EBCe8d345962A282C4fCb;
    address private constant TREASURY =
        0xE77b1452900b92A9D43Cf87a079fe59c31b3F5ab;
    address private constant MAINTAINER =
        0x082fBa9AF99B195224Cbe061f061D60303998Ec2;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.UserVotesStorage")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant USER_VOTES_STORAGE_LOCATION =
        0x2eb6f4d6739bdcfb853a78734eacb73fd5255c791e78cd7fc1cb476b6b3efc00;
    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.DataStorage")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant DATA_STORAGE_LOCATION =
        0xc71dc29fd54b52d8e57671e39c8708c047ee755caa028ff177d008e83d685500;
    address public constant DELEGATE_VOTE_POOL =
        0x5d34F95157558af63dfD8091dA329D36Fe5C64b6;
    // -----------------------------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------------------------
    event TheLocked(uint256 amount);
    event TheLockDurationIncreased(uint256 lockedUntil);
    event TheLockMinted(uint256 tokenId);
    event TheLockBurned(uint256 tokenId);
    event VoteUpdated(
        uint256 indexed _epoch,
        address indexed _user,
        address indexed _pool,
        uint256 _amount
    );
    event DelegationUpdated(
        uint256 indexed _epoch,
        address indexed _user,
        uint256 _amount
    );
    event VotingEpochChanged(uint256 _epoch);
    event ERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );
    event RewardClaimed(
        uint256 indexed _epoch,
        address indexed _user,
        address indexed _pool,
        address _token,
        uint256 _amount
    );
    event RewardRegistered(
        uint256 indexed _epoch,
        address indexed _pool,
        address _token,
        uint256 _amount
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Fixed storage definition
    // -----------------------------------------------------------------------------------------------------------------
    function _getDataStorage() private pure returns (DataStorage storage $) {
        assembly {
            $.slot := DATA_STORAGE_LOCATION
        }
    }

    function _getUserVotesStorage()
        private
        pure
        returns (UserVotesStorage storage $)
    {
        assembly {
            $.slot := USER_VOTES_STORAGE_LOCATION
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------------------------------------------------------
    modifier onlyDelegationAdmins() {
        DataStorage storage $ = _getDataStorage();
        require(
            $.delegationAdmins[msg.sender],
            "You are not a delegation admin"
        );
        _;
    }

    modifier onlyRewardsDistributor() {
        DataStorage storage $ = _getDataStorage();
        require(
            msg.sender == $.quollRewardsDistributor,
            "You are not a rewards distributor"
        );
        _;
    }

    modifier onlyOperator() {
        require(
            msg.sender == owner() || msg.sender == MAINTAINER,
            "Only operator"
        );
        _;
    }

    modifier onlyDepositor() {
        require(msg.sender == THE_DEPOSITOR, "Only depositor");
        _;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------------------------------------------------
    function initialize() public reinitializer(17) {
        // DataStorage storage $data = _getDataStorage();
        // Do nothing
    }

    // -----------------------------------------------------------------------------------------------------------------
    // General getters
    // -----------------------------------------------------------------------------------------------------------------
    function getRewardDistributor() external view returns (address) {
        DataStorage storage $ = _getDataStorage();
        return $.quollRewardsDistributor;
    }

    function veTheTokenId() external view returns (uint256) {
        DataStorage storage $ = _getDataStorage();
        return $.veTheTokenId;
    }

    function getCurrentEpoch() external view returns (uint256) {
        return IVoterV3(THENA_VOTER_V3)._epochTimestamp();
    }

    function getLastVoteEpochTimestamp() external view returns (uint256) {
        DataStorage storage $ = _getDataStorage();
        return $.currentEpoch;
    }

    function getBalanceOfVeThe() external view returns (uint256) {
        DataStorage storage $ = _getDataStorage();
        return IVotingEscrow(VE_THE).balanceOfNFT($.veTheTokenId);
    }

    function getVeTheTokenId() external view returns (uint256) {
        DataStorage storage $ = _getDataStorage();
        return $.veTheTokenId;
    }

    /// @dev View function to get the list of pools with votes for a specific epoch.
    function getPoolsWithVotes(
        uint256 _epoch
    ) external view returns (address[] memory) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        return $.epochs[_epoch].poolsWithVotes;
    }

    function getVotes(
        uint256 _epoch
    )
        external
        view
        returns (address[] memory _pools, uint256[] memory _amounts)
    {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];
        uint256 i = 0;
        _pools = new address[](epoch.poolsWithVotes.length);
        _amounts = new uint256[](epoch.poolsWithVotes.length);

        for (i = 0; i < epoch.poolsWithVotes.length; i++) {
            _pools[i] = epoch.poolsWithVotes[i];
            _amounts[i] = epoch.poolWeights[epoch.poolsWithVotes[i]];
        }
    }

    /// @dev View function to get the list of users with votes for a specific epoch.
    function getUsersWithVotes(
        uint256 _epoch
    ) external view returns (address[] memory) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        return $.epochs[_epoch].usersWithVotes;
    }

    /// @dev View function to get the total vlQuo voting power used for a specific pool at a specific epoch.
    function getPoolVotes(
        uint256 _epoch,
        address _pool
    ) external view returns (uint256) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        return $.epochs[_epoch].poolWeights[_pool];
    }

    /// @dev View function to get the total vlQuo voting power used by the user for a specific epoch.
    function getTotalVlQuoVoted(
        uint256 _epoch
    ) external view returns (uint256) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        return $.epochs[_epoch].totalWeight;
    }

    /// @dev View function to get the total vlQuo voting power used by the user for a specific epoch.
    function getVotesForUserAtEpoch(
        uint256 _epoch,
        address _user
    ) public view returns (address[] memory, uint256[] memory) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        // Must calculate the size of the array first as we cannot push to a memory array
        uint256 count = 0;
        for (uint256 i = 0; i < epoch.poolsWithVotes.length; i++) {
            address poolAddress = epoch.poolsWithVotes[i];
            if (epoch.votes[poolAddress][_user] > 0) {
                count++;
            }
        }

        // Populate return data
        address[] memory poolsAddresses = new address[](count);
        uint256[] memory userVotes = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < epoch.poolsWithVotes.length; i++) {
            address poolAddress = epoch.poolsWithVotes[i];
            if (epoch.votes[poolAddress][_user] > 0) {
                poolsAddresses[index] = poolAddress;
                userVotes[index] = epoch.votes[poolAddress][_user];
                index++;
            }
        }

        return (poolsAddresses, userVotes);
    }

    /// @dev View function to get the total vlQuo voting power used by the user at the current epoch.
    function getCurrentVotesForUser(
        address _user
    ) external view returns (address[] memory, uint256[] memory) {
        DataStorage storage $ = _getDataStorage();
        return getVotesForUserAtEpoch($.currentEpoch, _user);
    }

    //to block unlock to much vlQuo
    function getCurrentUserTotalVote(
        address _user
    ) external view returns (uint256) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        DataStorage storage $data = _getDataStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];
        uint256 userWeightThisEpoch = epoch.userWeights[_user];
        uint256 userWeightDelegate = IThenaDelegatePool(DELEGATE_VOTE_POOL)
            .balanceOf(_user);
        return
            userWeightThisEpoch > userWeightDelegate
                ? userWeightThisEpoch
                : userWeightDelegate;
    }

    function getClaimableEpochsForUser(
        address _user
    ) public view returns (uint256[] memory) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        return $.claimableEpochs[_user];
    }

    function getDelegatedWeights() public view returns (uint256) {
        return IThenaDelegatePool(DELEGATE_VOTE_POOL).totalSupply();
    }

    function getUserWeightInDelegatePool(
        address _user
    ) public view returns (uint256) {
        return IThenaDelegatePool(DELEGATE_VOTE_POOL).balanceOf(_user);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Functions related to veTHE
    // -----------------------------------------------------------------------------------------------------------------
    function lockThe(uint256 _amount) external onlyDepositor {
        DataStorage storage $ = _getDataStorage();

        if (_amount == 0) {
            return;
        }

        uint256 theBalance = IERC20(THE).balanceOf(address(this));
        if (_amount > theBalance) {
            revert("Not enough THE");
        }

        if ($.veTheTokenId == 0) {
            // First time deposit: need to create a new lock, this will mint a new NFT and we save the token id
            IERC20(THE).approve(VE_THE, _amount);
            // 2 years rounded down to the week
            $.veTheTokenId = IVotingEscrow(VE_THE).create_lock(
                _amount,
                MAX_LOCK_DURATION
            );
            // Will relock in one week
            $.nextIncreaseUnlockAt = ((block.timestamp + WEEK) / WEEK) * WEEK;

            emit TheLockMinted($.veTheTokenId);
            emit TheLocked(_amount);
        } else {
            IERC20(THE).approve(VE_THE, _amount);

            // Lock expired? (no deposits for 2 years?)
            if (
                block.timestamp >=
                IVotingEscrow(VE_THE).locked__end($.veTheTokenId)
            ) {
                // Lock has expired, need to withdraw and create a new lock, this will destroy our veTHE NFT
                _unlockThe();

                // Create a new lock
                $.veTheTokenId = IVotingEscrow(VE_THE).create_lock(
                    _amount,
                    MAX_LOCK_DURATION
                );

                // Will relock in one week
                $.nextIncreaseUnlockAt =
                    ((block.timestamp + WEEK) / WEEK) *
                    WEEK;

                emit TheLockMinted($.veTheTokenId);
                emit TheLocked(_amount);
            } else {
                // Increase lock amount
                IVotingEscrow(VE_THE).increase_amount($.veTheTokenId, _amount);
                emit TheLocked(_amount);

                // Lock is still active, just increase the lock duration
                if (block.timestamp > $.nextIncreaseUnlockAt) {
                    IVotingEscrow(VE_THE).increase_unlock_time(
                        $.veTheTokenId,
                        MAX_LOCK_DURATION
                    );

                    // Thena rounds the lock down to the week
                    emit TheLockDurationIncreased(
                        ((block.timestamp + MAX_LOCK_DURATION) / WEEK) * WEEK
                    );

                    // Once a week, increase the lock
                    $.nextIncreaseUnlockAt =
                        ((block.timestamp + WEEK) / WEEK) *
                        WEEK;
                }
            }
        }
    }

    function unlockThe(bool withdraw) external onlyOwner {
        DataStorage storage $ = _getDataStorage();

        require($.veTheTokenId != 0, "No lock");
        require(
            block.timestamp >=
                IVotingEscrow(VE_THE).locked__end($.veTheTokenId),
            "Lock not expired"
        );

        _unlockThe();

        if (withdraw) {
            IERC20(THE).transfer(
                msg.sender,
                IERC20(THE).balanceOf(address(this))
            );
        }
    }

    function _unlockThe() internal {
        DataStorage storage $ = _getDataStorage();

        IVotingEscrow(VE_THE).withdraw($.veTheTokenId);
        emit TheLockBurned($.veTheTokenId);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Functions related to votes
    // -----------------------------------------------------------------------------------------------------------------
    function _updateCurrentVotingEpochIfNeeded() internal {
        UserVotesStorage storage $ = _getUserVotesStorage();
        DataStorage storage $data = _getDataStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];

        // Update the current voting epoch if needed
        if (IVoterV3(THENA_VOTER_V3)._epochTimestamp() != $data.currentEpoch) {
            $data.currentEpoch = IVoterV3(THENA_VOTER_V3)._epochTimestamp();
            emit VotingEpochChanged($data.currentEpoch);

            //keep delegated weight from last epoch
            IThenaDelegatePool(DELEGATE_VOTE_POOL).updateVote();
            epoch.totalWeight += epoch.userWeights[DELEGATE_VOTE_POOL];
        }
        require(
            block.timestamp <=
                (IVoterV3(THENA_VOTER_V3)._epochTimestamp() +
                    IVoterV3(THENA_VOTER_V3).MAX_VOTE_DELAY()),
            "Voting period ended"
        );
    }

    function updateCurrentVotingEpoch() external onlyOwner {
        _updateCurrentVotingEpochIfNeeded();
    }

    /// @dev Function for users to submit their vote. Only the last vote will be counted.
    function vote(
        address[] calldata _pools,
        uint256[] calldata _weights
    ) external {
        // Check input
        require(_pools.length == _weights.length, "Invalid input length");
        require(
            _pools.length > 0 && _pools.length < 50,
            "You must vote for 1 to 50 pools"
        );
        uint256 weightsSum = 0;
        for (uint256 i = 0; i < _weights.length; i++) {
            require(_weights[i] > 0, "Invalid weight: cannot be == 0");
            weightsSum += _weights[i];
        }

        // Update the current voting epoch if needed
        _updateCurrentVotingEpochIfNeeded();

        // Load storage data
        UserVotesStorage storage $ = _getUserVotesStorage();
        DataStorage storage $data = _getDataStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];

        // If the user has votes for this epoch, reset everything
        if (epoch.userWeights[msg.sender] > 0) {
            _resetVote($data.currentEpoch, msg.sender);
        }

        uint256 vlQuoBalance = IVlQuoV2(VL_QUO).balanceOf(msg.sender);
        require(vlQuoBalance > 0, "You need vlQUO to vote");

        // Count the vote in the storage. At this point we are sure the user hasn't voted before in this epoch as we
        // force a reset in the _resetVote function.
        uint256 totalPower = 0; // prevent rounding errors
        for (uint256 i = 0; i < _pools.length; i++) {
            // Check if the pool is valid. Can use the CA instead of a pool to specify a delegated vote
            address pool = _pools[i];
            require(
                pool == DELEGATE_VOTE_POOL ||
                    IVoterV3(THENA_VOTER_V3).gauges(pool) != address(0),
                "Pool is either invalid or doesn't have a gauge"
            );

            // Calculate the actual vote value in terms of vlQuo
            uint256 vlQuoVotePower = (_weights[i] * vlQuoBalance) / weightsSum;
            totalPower += vlQuoVotePower;

            if (epoch.poolWeights[pool] == 0) {
                // Add the pool to the list of pools with votes
                epoch.poolsWithVotes.push(pool);
            }
            epoch.poolWeights[pool] += vlQuoVotePower;
            epoch.votes[pool][msg.sender] = vlQuoVotePower;

            //if it is a delegate pool
            if (
                DELEGATE_VOTE_POOL != address(0) && pool == DELEGATE_VOTE_POOL
            ) {
                uint256 userCurrentWeight = IThenaDelegatePool(
                    DELEGATE_VOTE_POOL
                ).balanceOf(msg.sender);
                //update delegated pool weight
                if (vlQuoVotePower != userCurrentWeight) {
                    if (vlQuoVotePower > userCurrentWeight) {
                        IThenaDelegatePool(DELEGATE_VOTE_POOL).stakeFor(
                            msg.sender,
                            (vlQuoVotePower - userCurrentWeight)
                        );
                    } else {
                        IThenaDelegatePool(DELEGATE_VOTE_POOL).withdrawFor(
                            msg.sender,
                            (userCurrentWeight - vlQuoVotePower)
                        );
                    }
                }
            }
            emit VoteUpdated(
                $data.currentEpoch,
                msg.sender,
                _pools[i],
                vlQuoVotePower
            );
        }

        // Add the user into the userWithVotes array
        epoch.userIndexInArray[msg.sender] = epoch.usersWithVotes.length;
        epoch.usersWithVotes.push(msg.sender);
        epoch.userWeights[msg.sender] = totalPower;
        $.claimableEpochs[msg.sender].push($data.currentEpoch);

        // Increment totals and dates
        epoch.totalWeight += totalPower;
        epoch.lastVotedAt = block.timestamp;
    }

    /// @dev Function for delegate vote pool to submit vote with delegated power. Only the last vote will be counted.

    function voteByDelegatePool(
        address[] calldata _pools,
        uint256[] calldata _weights
    ) external {
        require(msg.sender == DELEGATE_VOTE_POOL, "Only delegate vote pool");
        // Check input
        require(_pools.length == _weights.length, "Invalid input length");
        require(
            _pools.length > 0 && _pools.length < 50,
            "You must vote for 1 to 50 pools"
        );
        uint256 weightsSum = 0;
        for (uint256 i = 0; i < _weights.length; i++) {
            require(_weights[i] > 0, "Invalid weight: cannot be == 0");
            weightsSum += _weights[i];
        }

        // Update the current voting epoch if needed
        _updateCurrentVotingEpochIfNeeded();

        // Load storage data
        UserVotesStorage storage $ = _getUserVotesStorage();
        DataStorage storage $data = _getDataStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];

        // If the delegate pool has voted for this epoch, reset everything
        uint256 votedWeight = epoch.userWeights[msg.sender];
        if (votedWeight > 0) {
            //because total weight remain unchange when delegate pool votes to this proxy
            //but decrease when reset vote
            //so it should be recovered
            epoch.totalWeight += votedWeight;
            _resetVote($data.currentEpoch, msg.sender);
        }

        uint256 delegatedPower = IThenaDelegatePool(DELEGATE_VOTE_POOL)
            .totalSupply();

        if (delegatedPower == 0) return;
        for (uint256 i = 0; i < _pools.length; i++) {
            // Check if the pool is valid. Can use the CA instead of a pool to specify a delegated vote
            require(
                IVoterV3(THENA_VOTER_V3).gauges(_pools[i]) != address(0),
                "Pool is either invalid or doesn't have a gauge"
            );

            address pool = _pools[i];
            // Calculate the actual vote value in terms of vlQuo
            uint256 vlQuoVotePower = (_weights[i] * delegatedPower) /
                weightsSum;

            if (epoch.poolWeights[pool] == 0) {
                // Add the pool to the list of pools with votes
                epoch.poolsWithVotes.push(pool);
            }

            epoch.poolWeights[pool] += vlQuoVotePower;
            epoch.votes[pool][msg.sender] = vlQuoVotePower;

            emit VoteUpdated(
                $data.currentEpoch,
                msg.sender,
                pool,
                vlQuoVotePower
            );
        }

        // Add the user into the userWithVotes array
        epoch.userIndexInArray[msg.sender] = epoch.usersWithVotes.length;
        epoch.usersWithVotes.push(msg.sender);
        epoch.userWeights[msg.sender] = delegatedPower;
        $.claimableEpochs[msg.sender].push($data.currentEpoch);

        // Increment totals and dates
        // epoch.totalWeight += delegatedPower; //total weights was added when user voted for delegate
        epoch.lastVotedAt = block.timestamp;
    }

    function _removeEpochFromClaimableArray(
        uint256 _epoch,
        address _user
    ) internal {
        UserVotesStorage storage $ = _getUserVotesStorage();
        if ($.claimableEpochs[_user].length == 0) {
            return;
        }
        for (
            int256 ii = int256($.claimableEpochs[_user].length - 1);
            ii >= 0;
            ii--
        ) {
            uint256 i = uint256(ii);
            if ($.claimableEpochs[_user][i] == _epoch) {
                $.claimableEpochs[_user][i] = $.claimableEpochs[_user][
                    $.claimableEpochs[_user].length - 1
                ];
                $.claimableEpochs[_user].pop();
            }
        }
    }

    function resetVote() external {
        DataStorage storage $ = _getDataStorage();
        uint256 userDelegatedWeight = IThenaDelegatePool(DELEGATE_VOTE_POOL)
            .balanceOf(msg.sender);
        _resetVote($.currentEpoch, msg.sender);
        //if user has voted delegate pool
        if (userDelegatedWeight > 0) {
            IThenaDelegatePool(DELEGATE_VOTE_POOL).withdrawFor(
                msg.sender,
                IThenaDelegatePool(DELEGATE_VOTE_POOL).balanceOf(msg.sender) // withdraw all staked amount
            );
        }
    }

    function _resetVote(uint256 _epoch, address _user) internal {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        // Reset the user votes
        for (uint256 i = 0; i < epoch.poolsWithVotes.length; i++) {
            address pool = epoch.poolsWithVotes[i];
            if (epoch.votes[pool][_user] > 0) {
                epoch.poolWeights[pool] -= epoch.votes[pool][_user];
                epoch.votes[pool][_user] = 0;
            }
        }

        // Remove these votes from the total, the state will be fully consistent at this stage
        epoch.totalWeight -= epoch.userWeights[_user];
        epoch.userWeights[_user] = 0;

        // Clean the poolsWithVotes from empty values by iterating from the end to the beginning
        for (
            int256 ii = int256(epoch.poolsWithVotes.length - 1);
            ii >= 0;
            ii--
        ) {
            uint256 i = uint256(ii);
            address pool = epoch.poolsWithVotes[i];
            if (epoch.poolWeights[pool] == 0) {
                // Remove the pool from poolsWithVotes
                epoch.poolsWithVotes[i] = epoch.poolsWithVotes[
                    epoch.poolsWithVotes.length - 1
                ];
                epoch.poolsWithVotes.pop();
            }
        }

        // Remove the epoch from the claimableEpochs
        _removeEpochFromClaimableArray(_epoch, _user);

        // Clean the usersWithVotes from this user
        uint256 index = epoch.userIndexInArray[_user];
        epoch.usersWithVotes[index] = epoch.usersWithVotes[
            epoch.usersWithVotes.length - 1
        ];
        epoch.userIndexInArray[epoch.usersWithVotes[index]] = index;
        delete epoch.userIndexInArray[_user];
        epoch.usersWithVotes.pop();
    }

    function getVoteToBeCasted(
        uint256 _epoch
    ) public view returns (address[] memory, uint256[] memory) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];
        uint256 i = 0;
        address[] memory poolsArg = new address[](epoch.poolsWithVotes.length);
        uint256[] memory weightsArg = new uint256[](
            epoch.poolsWithVotes.length
        );

        for (i = 0; i < epoch.poolsWithVotes.length; i++) {
            poolsArg[i] = epoch.poolsWithVotes[i];
            weightsArg[i] = epoch.poolWeights[epoch.poolsWithVotes[i]];
        }

        return (poolsArg, weightsArg);
    }

    /// @dev previous function will cast an empty vote when a new epoch has just started
    /// so cast final vote from the last epoch
    function castVote() external {
        _updateCurrentVotingEpochIfNeeded();

        DataStorage storage $data = _getDataStorage();
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];

        address[] memory poolsArg;
        uint256[] memory weightsArg;
        if (epoch.lastCastedAt > 0) {
            IVoterV3(THENA_VOTER_V3).reset($data.veTheTokenId);
        }
        (poolsArg, weightsArg) = getVoteToBeCasted($data.currentEpoch);
        IVoterV3(THENA_VOTER_V3).vote($data.veTheTokenId, poolsArg, weightsArg);

        epoch.lastCastedAt = block.timestamp;
    }

    function castNeeded() external view returns (bool) {
        DataStorage storage $data = _getDataStorage();
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[$data.currentEpoch];
        return epoch.lastVotedAt > epoch.lastCastedAt;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Functions related to rewards
    // -----------------------------------------------------------------------------------------------------------------
    function registerReward(
        uint256 _epoch,
        address _pool,
        address _token,
        uint256 _amount
    ) external onlyRewardsDistributor {
        DataStorage storage $data = _getDataStorage();
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        // Amount must be > 0
        if (_amount == 0) {
            revert("Amount must be > 0");
        }

        uint256 distribuable = _amount;
        if ($data.protocolFeePer1000 > 0) {
            uint256 protocolFee = (_amount * $data.protocolFeePer1000) / 1000;
            IERC20(_token).transfer(TREASURY, protocolFee);
            distribuable -= protocolFee;
        }
        if ($data.maintenanceFeePer1000 > 0) {
            uint256 maintenanceFee = (_amount * $data.maintenanceFeePer1000) /
                1000;
            IERC20(_token).transfer(MAINTAINER, maintenanceFee);
            distribuable -= maintenanceFee;
        }

        // If this pool didn't have rewards yet, add it to the list
        if (epoch.rewards[_pool].amounts[_token] == 0) {
            epoch.rewards[_pool].tokens.push(_token);
        }
        epoch.rewards[_pool].amounts[_token] += distribuable;

        emit RewardRegistered(_epoch, _pool, _token, distribuable);
    }

    function _claimable(
        uint256 _epoch,
        address _user,
        address _pool,
        address _token
    ) internal view returns (uint256) {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        if (epoch.poolWeights[_pool] == 0) {
            return 0;
        }

        return
            ((epoch.rewards[_pool].amounts[_token] *
                epoch.votes[_pool][_user]) / epoch.poolWeights[_pool]) -
            epoch.rewards[_pool].userClaimed[_token][_user];
    }

    function claimableByUserAndPool(
        uint256 _epoch,
        address _user,
        address _pool
    )
        public
        view
        returns (address[] memory _tokens, uint256[] memory _amounts)
    {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];
        uint256 i = 0;
        _tokens = new address[](epoch.rewards[_pool].tokens.length);
        _amounts = new uint256[](epoch.rewards[_pool].tokens.length);

        for (i = 0; i < epoch.rewards[_pool].tokens.length; i++) {
            // Calculate remaining claimable reward of the user, based on the user's share in the pool
            _tokens[i] = epoch.rewards[_pool].tokens[i];
            _amounts[i] = _claimable(_epoch, _user, _pool, _tokens[i]);
        }
    }

    function rewards(
        uint256 _epoch
    )
        external
        view
        returns (
            address[] memory _pool,
            address[][] memory _tokens,
            uint256[][] memory _amounts
        )
    {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        uint256 i;
        uint256 j;

        _pool = new address[](epoch.poolsWithVotes.length);
        _tokens = new address[][](epoch.poolsWithVotes.length);
        _amounts = new uint256[][](epoch.poolsWithVotes.length);

        for (i = 0; i < epoch.poolsWithVotes.length; i++) {
            address pool = epoch.poolsWithVotes[i];
            _pool[i] = pool;
            _tokens[i] = new address[](epoch.rewards[pool].tokens.length);
            _amounts[i] = new uint256[](epoch.rewards[pool].tokens.length);
            for (j = 0; j < epoch.rewards[pool].tokens.length; j++) {
                _tokens[i][j] = epoch.rewards[pool].tokens[j];
                _amounts[i][j] = epoch.rewards[pool].amounts[_tokens[i][j]];
            }
        }
    }

    function rewardsByPool(
        uint256 _epoch,
        address _pool
    )
        external
        view
        returns (address[] memory _tokens, uint256[] memory _amounts)
    {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];
        uint256 i = 0;
        _tokens = new address[](epoch.rewards[_pool].tokens.length);
        _amounts = new uint256[](epoch.rewards[_pool].tokens.length);

        for (i = 0; i < epoch.rewards[_pool].tokens.length; i++) {
            _tokens[i] = epoch.rewards[_pool].tokens[i];
            _amounts[i] = epoch.rewards[_pool].amounts[_tokens[i]];
        }
    }

    function claimableByUser(
        uint256 _epoch,
        address _user
    )
        public
        view
        returns (
            address[] memory _pools,
            address[][] memory _tokens,
            uint256[][] memory _amounts
        )
    {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        uint256 i;
        uint256 j;

        _pools = new address[](epoch.poolsWithVotes.length);
        _tokens = new address[][](epoch.poolsWithVotes.length);
        _amounts = new uint256[][](epoch.poolsWithVotes.length);

        for (i = 0; i < epoch.poolsWithVotes.length; i++) {
            address pool = epoch.poolsWithVotes[i];
            _pools[i] = pool;
            _tokens[i] = new address[](epoch.rewards[pool].tokens.length);
            _amounts[i] = new uint256[](epoch.rewards[pool].tokens.length);
            for (j = 0; j < epoch.rewards[pool].tokens.length; j++) {
                _tokens[i][j] = epoch.rewards[pool].tokens[j];
                _amounts[i][j] = _claimable(_epoch, _user, pool, _tokens[i][j]);
            }
        }
    }

    function _claim(
        uint256 _epoch,
        address _user,
        address _pool,
        address _token
    ) internal {
        UserVotesStorage storage $ = _getUserVotesStorage();
        Epoch storage epoch = $.epochs[_epoch];

        uint256 amount = _claimable(_epoch, _user, _pool, _token);
        if (amount > 0) {
            if (IERC20(_token).balanceOf(address(this)) < amount) {
                revert("CA doesn't hold enough");
            }

            IERC20(_token).transfer(_user, amount);
            epoch.rewards[_pool].userClaimed[_token][_user] += amount;
            emit RewardClaimed(_epoch, _user, _pool, _token, amount);
        }
    }

    function claimAll(uint256 _epoch) public {
        DataStorage storage $data = _getDataStorage();

        // Ignore claims for the current and the previous epoch because rewards are distributed after 2 weeks
        if (_epoch >= $data.currentEpoch - WEEK) {
            return;
        }

        if (
            !$data.claimEnabled &&
            msg.sender != MAINTAINER &&
            msg.sender != TREASURY &&
            msg.sender != owner()
        ) {
            revert(
                "Claiming is temporarily disabled during reward distribution. Please try again later."
            );
        }

        (
            address[] memory pools,
            address[][] memory tokens,
            uint256[][] memory amounts
        ) = claimableByUser(_epoch, msg.sender);
        uint256 i;
        uint256 j;

        for (i = 0; i < pools.length; i++) {
            for (j = 0; j < tokens[i].length; j++) {
                if (amounts[i][j] > 0) {
                    _claim(_epoch, msg.sender, pools[i], tokens[i][j]);
                }
            }
        }

        // Remove the epoch from the claimableEpochs
        _removeEpochFromClaimableArray(_epoch, msg.sender);
    }

    function claimAllEpochs() external {
        // Copy the array to memory because we will pop entries from the storage during the loop
        uint256[] memory claimableEpochs = getClaimableEpochsForUser(
            msg.sender
        );
        for (uint256 i = 0; i < claimableEpochs.length; i++) {
            claimAll(claimableEpochs[i]);
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Other functions
    // -----------------------------------------------------------------------------------------------------------------
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        DataStorage storage $data = _getDataStorage();
        require(msg.sender == VE_THE, "Only accept veTHE NFTs");
        emit ERC721Received(operator, from, tokenId, data);

        if ($data.veTheTokenId == 0) {
            $data.veTheTokenId = tokenId;
            emit TheLockMinted(tokenId);
        } else {
            // Merge the new NFT with the existing one
            IVotingEscrow(VE_THE).merge(tokenId, $data.veTheTokenId);
        }

        return this.onERC721Received.selector;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Operator functions
    // -----------------------------------------------------------------------------------------------------------------
    function setClaimEnabled(bool _claimEnabled) external onlyOperator {
        DataStorage storage $ = _getDataStorage();
        $.claimEnabled = _claimEnabled;
    }

    function pushClaimableEpochs(
        uint256 _epoch,
        address[] memory _users
    ) external onlyOperator {
        UserVotesStorage storage $ = _getUserVotesStorage();
        for (uint256 i = 0; i < _users.length; i++) {
            $.claimableEpochs[_users[i]].push(_epoch);
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Admin functions
    // -----------------------------------------------------------------------------------------------------------------
    function mergeVeThe(uint256[] memory _tokenIds) external onlyOwner {
        DataStorage storage $data = _getDataStorage();
        require($data.veTheTokenId != 0, "No lock");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            IVotingEscrow(VE_THE).merge(_tokenIds[i], $data.veTheTokenId);
        }
    }

    function setDelegationAdmin(
        address _delegationAdmin,
        bool _value
    ) external onlyOwner {
        DataStorage storage $data = _getDataStorage();
        $data.delegationAdmins[_delegationAdmin] = _value;
    }

    function setDelegateVotePool(address _delegateVotePool) external onlyOwner {
        require(_delegateVotePool != address(0), "invalid _delegateVotePool");
        DELEGATE_VOTE_POOL = _delegateVotePool;
    }

    function increaseLockDuration(uint256 _duration) external onlyOwner {
        DataStorage storage $data = _getDataStorage();
        IVotingEscrow(VE_THE).increase_unlock_time(
            $data.veTheTokenId,
            _duration
        );
        $data.nextIncreaseUnlockAt =
            ((block.timestamp + _duration) / WEEK) *
            WEEK;
    }

    function setQuollRewardsDistributor(
        address _quollRewardsDistributor
    ) external onlyOwner {
        DataStorage storage $data = _getDataStorage();
        // Remove the approval for the old distributor
        if ($data.quollRewardsDistributor != address(0)) {
            IVotingEscrow(VE_THE).setApprovalForAll(
                $data.quollRewardsDistributor,
                false
            );
        }
        // Update the distributor
        $data.quollRewardsDistributor = _quollRewardsDistributor;
        // Approve the new distributor
        IVotingEscrow(VE_THE).setApprovalForAll(_quollRewardsDistributor, true);
    }

    function resetVeThe() external onlyOwner {
        DataStorage storage $data = _getDataStorage();
        IVoterV3(THENA_VOTER_V3).reset($data.veTheTokenId);
    }

    function rescueETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function rescueERC20(address _token) external onlyOwner {
        IERC20(_token).transfer(
            owner(),
            IERC20(_token).balanceOf(address(this))
        );
    }

    function rescueERC721(address _token, uint256 _tokenId) external onlyOwner {
        IERC721(_token).transferFrom(address(this), owner(), _tokenId);
    }

    receive() external payable {}
}
