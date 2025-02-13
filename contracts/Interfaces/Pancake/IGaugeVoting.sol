// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IGaugeVoting {
    function gauges(
        uint256 _gaugeId
    )
        external
        view
        returns (
            uint256 pid,
            address masterChef,
            uint256 chainId,
            address pairAddress,
            uint256 boostMultiplier,
            uint256 maxVoteCap
        );

    function gaugeCount() external view returns (uint256 gauge_count);

    function gaugeIndex_(
        bytes32 _hash
    ) external view returns (uint256 gauge_idx);

    function getGaugeWeight(
        address gauge_addr,
        uint256 _chainId,
        bool inCap
    ) external view returns (uint256);

    function voteForGaugeWeights(
        address _gauge_addr,
        uint256 _user_weight,
        uint256 _chainId,
        bool _skipNative,
        bool _skipProxy
    ) external;

    function voteUserPower(address _user) external view returns (uint256);

    function voteUserSlopes(
        address _user,
        bytes32 _gaugeHash
    ) external view returns (uint256 slope, uint256 power, uint256 end);
}
