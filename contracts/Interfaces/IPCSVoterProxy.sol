// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface IPCSVoterProxy {
    function lockCake(uint256 _lockDays) external;

    // --- Events ---
    event BoosterUpdated(address _booster);
    event DepositorUpdated(address _depositor);

    event Deposited(uint256 _pid, uint256 _amount);
    event DepositedV2(address _masterWombat, uint256 _pid, uint256 _amount);

    event Withdrawn(uint256 _pid, uint256 _amount);
    event WithdrawnV2(address _masterWombat, uint256 _pid, uint256 _amount);

    event RewardsClaimed(uint256 _pid, uint256 _amount);
    event RewardsClaimedV2(
        address _masterWombat,
        uint256 _pid,
        uint256 _amount
    );

    event BonusRewardsClaimed(
        uint256 _pid,
        address _bonusTokenAddress,
        uint256 _bonusTokenAmount
    );

    event BonusRewardsClaimedV2(
        address _masterWombat,
        uint256 _pid,
        address _bonusTokenAddress,
        uint256 _bonusTokenAmount
    );

    event WomLocked(uint256 _amount, uint256 _lockDays);
    event WomUnlocked(uint256 _slot);

    event Voted(
        address[] _lpVote,
        int256[] _deltas,
        address[] _rewarders,
        address _caller
    );

    event RevenueSharingPoolAdded(address _revenueSharingPool);
}
