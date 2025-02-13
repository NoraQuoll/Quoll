// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IBaseRewardPoolV1.sol";
import "./Interfaces/IBaseRewardPoolV1WithLockqWom.sol";

import "./Interfaces/IPCSDepositor.sol";
import "./Interfaces/IQuollExternalToken.sol";
import "./Interfaces/IQuollRewardPool.sol";
import "./Interfaces/IPCSVoterProxy.sol";

contract PCSDepositor is IPCSDepositor, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public cake;

    address public voterProxy;
    address public qCake;

    uint256 private maxLockDays;
    uint256 public lockTimeInterval;
    uint256 public lastLockTime;

    address public qCakeRewardPool;

    address public qCakeRewardPoolLock;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _cake,
        address _voterProxy,
        address _qCake,
        address _qCakeRewardPool
    ) external onlyOwner {
        require(voterProxy == address(0), "params has already been set");

        require(_cake != address(0), "invalid _cake!");
        require(_voterProxy != address(0), "invalid _voterProxy!");
        require(_qCake != address(0), "invalid _qCake!");
        require(_qCakeRewardPool != address(0), "invalid _qCakeRewardPool!");

        cake = _cake;

        voterProxy = _voterProxy;
        qCake = _qCake;

        qCakeRewardPool = _qCakeRewardPool;

        maxLockDays = 1461;
        lockTimeInterval = 1 days;
        lastLockTime = block.timestamp;
    }

    function setUpgradeParams(address _qCakeRewardPoolLock) external onlyOwner {
        require(
            _qCakeRewardPoolLock != address(0),
            "invalid _qCakeRewardPoolLock!"
        );

        qCakeRewardPoolLock = _qCakeRewardPoolLock;
    }

    function setQCakeRewardPool(address _qCakeRewardPool) external onlyOwner {
        qCakeRewardPool = _qCakeRewardPool;
    }

    function setLockTimeInterval(uint256 _lockTimeInterval) external onlyOwner {
        lockTimeInterval = _lockTimeInterval;
    }

    //lock wom
    function _lockCake() internal {
        uint256 cakeBalance = IERC20(cake).balanceOf(address(this));
        if (cakeBalance > 0) {
            IERC20(cake).safeTransfer(voterProxy, cakeBalance);
        }

        //increase amount
        uint256 cakeBalanceVoterProxy = IERC20(cake).balanceOf(voterProxy);
        if (cakeBalanceVoterProxy == 0) {
            return;
        }

        //increase amount
        IPCSVoterProxy(voterProxy).lockCake(maxLockDays);
        lastLockTime = block.timestamp;
    }

    function lockCake() external onlyOwner {
        _lockCake();
    }

    function deposit(uint256 _amount, bool _stake) public override {
        require(_amount > 0, "!>0");

        if (block.timestamp > lastLockTime.add(lockTimeInterval)) {
            //lock immediately, transfer directly to voterProxy to skip an erc20 transfer
            IERC20(cake).safeTransferFrom(msg.sender, voterProxy, _amount);
            _lockCake();
        } else {
            //move tokens here
            IERC20(cake).safeTransferFrom(msg.sender, address(this), _amount);
        }

        if (!_stake) {
            //mint for msg.sender
            IQuollExternalToken(qCake).mint(msg.sender, _amount);
        } else {
            //mint here
            IQuollExternalToken(qCake).mint(address(this), _amount);
            //stake for msg.sender
            IERC20(qCake).safeApprove(qCakeRewardPool, 0);
            IERC20(qCake).safeApprove(qCakeRewardPool, _amount);
            IBaseRewardPoolV1(qCakeRewardPool).stakeFor(msg.sender, _amount);
        }

        emit Deposited(msg.sender, _amount);
    }

    function depositAll(bool _stake) external {
        uint256 cakeBal = IERC20(cake).balanceOf(msg.sender);
        deposit(cakeBal, _stake);
    }
}
