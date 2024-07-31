// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../Interfaces/IQuollExternalToken.sol";
import "../Interfaces/IQuollRewardPool.sol";
import "../Interfaces/IThenaVoterProxy.sol";
import "../Interfaces/IThenaDepositor.sol"; 
import "../Interfaces/Thena/IVotingEscrow.sol";

contract ThenaDepositor is OwnableUpgradeable {
    address public the;
    address public voterProxy;
    address public qThe;
    address public rewardPool;

    uint256[50] private __gap;

    event Deposited(address indexed _user, uint256 _amount);

    function initialize(address _the, address _qThe) public initializer {
        __Ownable_init();

        the = _the;
        qThe = _qThe;
    }

    function setRewardPool(address _rewardPool) external onlyOwner {
        rewardPool = _rewardPool;
    }

    function setVoterProxy(address _voterProxy) external onlyOwner {
        voterProxy = _voterProxy;
    }

    function _lockThe() internal {
        // Send tokens to the voterProxy if there are any
        if (IERC20(the).balanceOf(address(this)) > 0) {
            IERC20(the).transfer(voterProxy, IERC20(the).balanceOf(address(this)));
        }

        // Lock the tokens
        IThenaVoterProxy(voterProxy).lockThe();
    }

    function lockThe() external onlyOwner {
        _lockThe();
    }

    // deposit the for qThe
    function deposit(uint256 _amount, bool _stake) public {
        require(_amount > 0, "_amount must be greater than 0");

        if (voterProxy == address(0)) {
            IERC20(the).transferFrom(msg.sender, address(this), _amount);
        } else {
            IERC20(the).transferFrom(msg.sender, voterProxy, _amount);
            _lockThe();
        }

        if (!_stake || rewardPool == address(0)) {
            // mint for msg.sender
            IQuollExternalToken(qThe).mint(msg.sender, _amount);
        } else {
            // mint here
            IQuollExternalToken(qThe).mint(address(this), _amount);

            // stake for msg.sender
            IERC20(qThe).approve(rewardPool, 0);
            IERC20(qThe).approve(rewardPool, _amount);
            IQuollRewardPool(rewardPool).stakeFor(msg.sender, _amount);
        }

        emit Deposited(msg.sender, _amount);
    }

    function depositAll(bool _stake) external {
        uint256 theBal = IERC20(the).balanceOf(msg.sender);
        deposit(theBal, _stake);
    }

    function rescueETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function rescueERC20(address _token) external onlyOwner {
        IERC20(_token).transfer(owner(), IERC20(_token).balanceOf(address(this)));
    }

    function rescueERC721(address _token, uint256 _tokenId) external onlyOwner {
        IERC721(_token).transferFrom(address(this), owner(), _tokenId);
    }

    receive() external payable {}

}
