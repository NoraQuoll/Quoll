// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IKalmyLpWar {
    function Kalm() external returns (address);

    function poolInfo(uint256)
        external
        view
        returns (
            address want, // Address of the want token.
            uint256 allocPoint, // How many allocation points assigned to this pool. Kalm to distribute per block.
            uint256 lastRewardTime, // Last reward time that Kalm distribution occurs.
            uint256 accKalmPerShare, // Accumulated Kalm per share, times 1e12. See below.
            address strat // Strategy address that will Kalm compound want tokens
        );

    function deposit(uint256 _pid, uint256 _wantAmt) external;

    function withdraw(uint256 _pid, uint256 _wantAmt) external;
}
