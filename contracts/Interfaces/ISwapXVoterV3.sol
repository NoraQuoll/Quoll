// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
 
interface ISwapXVoterV3 {

     /// @notice claim LP gauge rewards
    function claimRewards(address[] memory _gauges) external;

    /// @notice claim bribes rewards given a TokenID
    function claimBribes(
        address[] memory _bribes,
        address[][] memory _tokens,
        uint256 _tokenId
    ) external;

    /// @notice claim fees rewards given a TokenID
    function claimFees(
        address[] memory _fees,
        address[][] memory _tokens,
        uint256 _tokenId
    ) external;

    /// @notice claim bribes rewards given an address
    function claimBribes(
        address[] memory _bribes,
        address[][] memory _tokens
    ) external;

     /// @notice claim fees rewards given an address
    function claimFees(
        address[] memory _bribes,
        address[][] memory _tokens
    ) external ;


}