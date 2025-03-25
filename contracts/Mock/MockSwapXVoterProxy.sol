// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract MockSwapXVoterProxy {
    function getCurrentVotesForUser(address _user) external view returns (address[] memory, uint256[] memory){
        address[] memory pools = new  address[](0);
        uint256[] memory userVotes = new uint256[](0);
        return (pools, userVotes);
    }

}