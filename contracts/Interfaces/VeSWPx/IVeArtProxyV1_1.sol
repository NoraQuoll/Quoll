// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

interface IVeArtProxyV1_1 {
    function _tokenURI(uint256 _tokenId, uint256 _balanceOf, uint256 _locked_end, uint256 _value)
        external
        view
        returns (string memory output);
    function _tokenURI(uint256 _tokenId, uint256 _balanceOf, uint256 _locked_end, uint256 _value, bool _isListable)
        external
        view
        returns (string memory output);
}
