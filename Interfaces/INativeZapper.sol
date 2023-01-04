// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface INativeZapper {
    function getAmountOut(address _from, uint256 _amount)
        external
        view
        returns (uint256);

    function zapInToken(
        address _from,
        uint256 _amount,
        address _receiver
    ) external returns (uint256 nativeAmount);

    event ZapIn(
        address indexed _from,
        uint256 _amount,
        address indexed _receiver,
        uint256 _amountOut
    );
    event AccessSet(address indexed _address, bool _status);
}
