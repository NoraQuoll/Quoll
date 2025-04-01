// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface IThenaVoterProxy {
    event TheLocked(uint256 amount);
    event TheLockDurationIncreased(uint256 lockedUntil);
    event TheLockMinted(uint256 tokenId);
    event TheLockBurned(uint256 tokenId);
    event VoteUpdated(uint256 indexed _epoch, address indexed _user, address indexed _pool, uint256 _amount);
    event DelegationUpdated(uint256 indexed _epoch, address indexed _user, uint256 _amount);
    event VotingEpochChanged(uint256 _epoch);
    event ERC721Received(address operator, address from, uint256 tokenId, bytes data);

    function lockThe() external;
    function unlockThe(bool withdraw) external;

    function getCurrentEpoch() external view returns (uint256);
    function vote(address[] calldata _pools, uint256[] calldata _weights) external;
    function voteByDelegatePool(address[] calldata _pools, uint256[] calldata _weights) external;
    function claimAllEpochs() external;
    function resetVote() external;
    function claimAll(uint256 _epoch) external;
    function claimableByUser(uint256 _epoch, address _user) external view returns (address[] memory _pools, address[][] memory _tokens, uint256[][] memory _amounts);
    function getClaimableEpochsForUser(address _user) external view returns (uint256[] memory);
    function getCurrentUserTotalVote(address _user) external view returns (uint256);
    function rewards(uint256 _epoch) external view returns (address[] memory _pool, address[][] memory _tokens, uint256[][] memory _amounts) ;
}
