// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface IBribeManagerPCS {
    function isPoolActive(
        address _gauge,
        uint256 _chainId
    ) external view returns (bool);

    function getUserTotalVote(address _user) external view returns (uint256);

    function getUserVoteForPool(
        address _gauge,
        uint256 _chainId,
        address _user
    ) external view returns (uint256);

    function getUserVoteForPools(
        address[] calldata _gauges,
        uint256[] calldata _chainIds,
        address _user
    ) external view returns (uint256[] memory votes);

    function vote(
        address[] calldata _gauges,
        uint256[] calldata _chainIds,
        int256[] calldata _deltas
    ) external;

    function unvote(address _gauge, uint256 _chainId) external;

    // function getRewardAll()
    //     external
    //     returns (
    //         address[][] memory rewardTokens,
    //         uint256[][] memory earnedRewards
    //     );

    event PoolAdded(
        address indexed _gauge,
        uint256 indexed _chainId,
        address indexed _rewarder
    );

    event AllVoteReset();

    event VoteUpdated(
        address indexed _user,
        bytes32 indexed _gaugeHash,
        uint256 _amount
    );
}
