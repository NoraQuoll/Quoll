// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IMasterChefV2 {
    function CAKE() external view returns (address);

    function poolInfo(uint256 _pid)
        external
        view
        returns (
            uint256 accCakePerShare,
            uint256 lastRewardBlock,
            uint256 allocPoint,
            uint256 totalBoostedShare,
            bool isRegular
        );

    function lpToken(uint256 _pid) external view returns (address);

    function userInfo(uint256 _pid, address _user)
        external
        view
        returns (
            uint256 amount,
            uint256 rewardDebt,
            uint256 boostMultiplier
        );

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function emergencyWithdraw(uint256 _pid) external;
}
