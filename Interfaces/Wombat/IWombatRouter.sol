// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IWombatRouter {
    function getAmountIn(
        address[] calldata tokenPath,
        address[] calldata poolPath,
        uint256 amountOut
    ) external view returns (uint256 amountIn, uint256[] memory haircuts);

    function getAmountOut(
        address[] calldata tokenPath,
        address[] calldata poolPath,
        int256 amountIn
    ) external view returns (uint256 amountOut, uint256[] memory haircuts);

    function swapExactTokensForTokens(
        address[] calldata tokenPath,
        address[] calldata poolPath,
        uint256 amountIn,
        uint256 minimumamountOut,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
