// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IBaseRewardPoolV1.sol";
import "./Interfaces/SWPX/ISWPxDepositor.sol";
import "./Interfaces/SWPX/ISWPxVoterProxy.sol";
import "./Interfaces/IQuollExternalToken.sol";


contract SWPxDepositor is ISWPxDepositor, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public swpx;
    address public voterProxy;
    address public qSWPx;

    uint256 private maxLockDays;
    uint256 public lockTimeInterval;
    uint256 public lastLockTime;

    address public qSWPxRewardPool;

    address public qSWPxRewardPoolLock;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _swpx,
        address _voterProxy,
        address _qSWPx,
        address _qSWPxRewardPool
    ) external onlyOwner {
        require(voterProxy == address(0), "params has already been set");
        require(_swpx != address(0), "invalid _swpx");
        require(_qSWPx != address(0), "invalid _qSWPx");
        require(_qSWPxRewardPool != address(0), "invalid _qSWPxRewardPool");

        swpx = _swpx;
        voterProxy = _voterProxy;
        qSWPx = _qSWPx;
        qSWPxRewardPool = _qSWPxRewardPool;
        maxLockDays = 730;
        lockTimeInterval = 1 days;
        lastLockTime = block.timestamp;

    }
    function _lockSWPx() internal {
        uint256 swpxBalance = IERC20(swpx).balanceOf(address(this));
        if (swpxBalance > 0){
            IERC20(swpx).transfer(voterProxy, swpxBalance);
        }

        //increase amount 
        uint256 swpxBalanceVoterProxy = IERC20(swpx).balanceOf(voterProxy);
        if (swpxBalance == 0){
            return;
        }

        ISWPxVoterProxy(voterProxy).lockSWPx(maxLockDays);

        
    }

    function lockSWPx() external onlyOwner {
        _lockSWPx();
    }

    function deposit(uint256 _amount, bool _stake) public override {
        require(_amount > 0, "!>0");
        if (block.timestamp > lastLockTime.add(lockTimeInterval)){
            //lock immediately, transfer directly to voterProxy to skip an erc20 transfer
            IERC20(swpx).safeTransferFrom(msg.sender, voterProxy, _amount);
            _lockSWPx();

        }
        else {
            //move tokens here
            IERC20(swpx).transferFrom(msg.sender, address(this), _amount);

        }

        if (!_stake) {
            //mint for msg.sender
            IQuollExternalToken(qSWPx).mint(msg.sender, _amount);
            
        }else {
            //mint here
            IQuollExternalToken(qSWPx).mint(address(this), _amount);

            //stake for msg.sender
            IERC20(qSWPx).safeApprove(qSWPxRewardPool, 0);
            IERC20(qSWPx).safeApprove(qSWPxRewardPool, _amount);

            IBaseRewardPoolV1(qSWPxRewardPool).stakeFor(msg.sender, _amount);
        }
        emit Deposited(msg.sender, _amount);

    }

    function depositAll (bool _stake) external {
        uint swpxBal = IERC20(swpx).balanceOf(msg.sender);
        deposit(swpxBal, _stake);
    }

}
