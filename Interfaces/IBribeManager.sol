// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface IBribeManager {
    function isPoolActive(address pool) external view returns (bool);

    function getUserVoteForPool(address _lp, address _user)
        external
        view
        returns (uint256);

    function getUserVoteForPools(address[] calldata _lps, address _user)
        external
        view
        returns (uint256[] memory votes);

    function vote(address[] calldata _lps, int256[] calldata _deltas) external;

    function unvote(address _lp) external;

    function getRewardAll()
        external
        returns (
            address[][] memory rewardTokens,
            uint256[][] memory earnedRewards
        );
}
