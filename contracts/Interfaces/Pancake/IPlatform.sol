// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IPlatform {
    function createBounty(
        address gauge,
        uint256 chainId,
        address manager,
        address rewardToken,
        uint8 numberOfEpochs,
        uint256 maxRewardPerVote,
        uint256 totalRewardAmount,
        address[] calldata blacklist,
        bool upgradeable
    ) external returns (uint256);
    function nextID() external view returns (uint256);
    function bounties(uint256) external view returns (address gauge , uint256 chainId , address manager ,address  rewardToken , uint8 numberOfEpochs , uint256 endTimestamp ,uint256  maxRewardPerVote , uint256 totalRewardAmount );
    function claimable (address user, uint256 bounty ) external view returns (uint256);    
    function claim(uint256 bountyId) external returns (uint256);
    function claimAll(uint256[] calldata ids) external ;
    function claimAllFor(address _user, uint256[] calldata ids) external;
     function increaseBountyDuration(
        uint256 _bountyId,
        uint8 _additionnalEpochs,
        uint256 _increasedAmount,
        uint256 _newMaxPricePerVote
    ) external;
} 