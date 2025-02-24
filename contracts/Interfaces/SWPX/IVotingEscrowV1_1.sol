// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IVotingEscrowV1_1 {
    /// @notice Get timestamp when `_tokenId`'s lock finishes
    /// @param _tokenId User NFT
    /// @return Epoch time of the lock end
    function locked__end(uint256 _tokenId) external view returns (uint256);

    /// @notice Deposit `_value` tokens for `msg.sender` and lock for `_lock_duration`
    /// @param _value Amount to deposit
    /// @param _lock_duration Number of seconds to lock tokens for (rounded down to nearest week)
    function create_lock(
        uint256 _value,
        uint256 _lock_duration
    ) external returns (uint256 newTokenId, uint256 votingPower);

    /// @notice Deposit `_value` tokens for `_tokenId` and add to the lock
    /// @dev Anyone (even a smart contract) can deposit for someone else, but
    ///      cannot extend their locktime and deposit for a brand new user
    /// @param _tokenId lock NFT
    /// @param _value Amount to add to user's lock
    function deposit_for(
        uint256 _tokenId,
        uint256 _value
    ) external returns (uint256 votingPower);

    /// @notice Deposit `_value` additional tokens for `_tokenId` without modifying the unlock time
    /// @param _value Amount of tokens to deposit and add to the lock
    function increase_amount(
        uint256 _tokenId,
        uint256 _value
    ) external returns (uint256 votingPower);

    function increase_unlock_time(
        uint256 _tokenId,
        uint256 _lock_duration
    ) external returns (uint256 votingPower);

    // @notice Withdraw all tokens for `_tokenId`
    /// @dev Only possible if the lock has expired
    function withdraw(uint256 _tokenId) external;
}
