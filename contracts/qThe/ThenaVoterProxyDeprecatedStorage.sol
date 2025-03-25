// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;
pragma experimental ABIEncoderV2;

/// @dev These storage locations are no longer used but kept for reference and compilation compatibility
abstract contract ThenaVoterProxyDeprecatedStorage {

    /// @deprecated
    struct PoolVotes {
        uint256 vlQuoVoted; /// @deprecated
        mapping(address => uint256) userVote; /// @deprecated
        address[] usersWithVotes; /// @deprecated
        bool hadVotesBefore; /// @deprecated
        uint256 indexInArray; /// @deprecated
    }

    /// @deprecated
    struct UserDelegatedVote {
        uint256 vlQuoDelegated; /// @deprecated
        bool hadDelegatedBefore; /// @deprecated
        uint256 indexInArray; /// @deprecated
    }

    /// @deprecated
    struct DelegatedVote {
        address pool; /// @deprecated
        uint256 percent; /// @deprecated
    }

    /// @deprecated
    struct EpochVotes {
        uint256 vlQuoVoted; /// @deprecated
        uint256 vlQuoDelegated; /// @deprecated
        mapping(address => PoolVotes) pools; /// @deprecated
        mapping(address => uint256) userVlQuoVoted; /// @deprecated
        address[] poolsWithVotes; /// @deprecated
        mapping(address => UserDelegatedVote) delegatedVotes; /// @deprecated
        address[] usersWhoDelegated; /// @deprecated
        bool isVoteCasted; /// @deprecated
    }

    /// @custom:storage-location erc7201:openzeppelin.storage.ThenaVoterProxy
    struct ThenaVoterProxyStorage {
        address vlQuo; /// @deprecated
        address the; /// @deprecated
        address veThe; /// @deprecated
        address depositor; /// @deprecated
        address voter; /// @deprecated
        address thenaRewardsDistributor; /// @deprecated
        address quollRewardsDistributor; /// @deprecated
        uint256 veTheTokenId; /// @deprecated
        address delegationAdmin; /// @deprecated
        uint256 currentEpochTimestamp; /// @deprecated
        uint256 nextIncreaseUnlockTime; /// @deprecated
        mapping(uint256 => EpochVotes) votes; /// @deprecated
        DelegatedVote[] delegatedVotes; /// @deprecated
    }
}
