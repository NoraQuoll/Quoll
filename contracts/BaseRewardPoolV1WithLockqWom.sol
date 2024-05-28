// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
/**
 *Submitted for verification at Etherscan.io on 2020-07-17
 */

/*
   ____            __   __        __   _
  / __/__ __ ___  / /_ / /  ___  / /_ (_)__ __
 _\ \ / // // _ \/ __// _ \/ -_)/ __// / \ \ /
/___/ \_, //_//_/\__//_//_/\__/ \__//_/ /_\_\
     /___/

* Synthetix: BaseRewardPoolV1.sol
*
* Docs: https://docs.synthetix.io/
*
*
* MIT License
* ===========
*
* Copyright (c) 2020 Synthetix
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*/

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IBaseRewardPoolV1WithLockqWom.sol";
import "./Interfaces/IWombatBooster.sol";
import "./Interfaces/IPancakePath.sol";
import "./Interfaces/Pancake/IPancakeRouter.sol";
import "./lib/TransferHelper.sol";

contract BaseRewardPoolV1WithLockqWom is
    IBaseRewardPoolV1WithLockqWom,
    OwnableUpgradeable
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using TransferHelper for address;

    address public operator;
    address public booster;
    uint256 public pid;

    IERC20 public override stakingToken;
    address[] public rewardTokens;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    mapping(address => bool) public isRewardToken;

    mapping(address => bool) public access;

    mapping(address => bool) public grants;

    mapping(address => uint256) public rewardRate;
    uint256 public lockTime;

    struct LockState {
        uint256 amountStaking;
        address[] tokensReward;
        uint256[] rewards;
        uint256 timeStartLock;
        uint256 timeUnlock;
    }

    struct UserState {
        uint256 startIndex;
        LockState[] lockStates;
    }

    mapping(address => UserState) public userState;

    function initialize(address _operator) public initializer {
        __Ownable_init();

        operator = _operator;

        emit OperatorUpdated(_operator);
    }

    function getUserStateLockIndex(
        address user,
        uint256 index
    ) public view returns (LockState memory) {
        return userState[user].lockStates[index];
    }

    function setParams(
        address _booster,
        uint256 _pid,
        address _stakingToken,
        address _rewardToken
    ) external override {
        require(msg.sender == owner() || msg.sender == operator, "!auth");

        require(booster == address(0), "params has already been set");
        require(_booster != address(0), "invalid _booster!");
        require(_stakingToken != address(0), "invalid _stakingToken!");
        require(_rewardToken != address(0), "invalid _rewardToken!");

        booster = _booster;

        pid = _pid;
        stakingToken = IERC20(_stakingToken);

        addRewardToken(_rewardToken);

        access[_booster] = true;

        emit BoosterUpdated(_booster);
    }

    function setRewardRate(address token, uint256 rate) external {
        require(msg.sender == owner() || msg.sender == operator, "!auth");
        if (!isRewardToken[token]) {
            return;
        }
        rewardRate[token] = rate;
    }

    function setLockTime(uint256 _lockTime) external {
        require(msg.sender == owner() || msg.sender == operator, "!auth");
        require(lockTime < _lockTime, "invalid");
        lockTime = _lockTime;
    }

    function addRewardToken(address _rewardToken) public {
        require(access[msg.sender], "!auth");
        require(_rewardToken != address(0), "invalid _rewardToken!");
        if (isRewardToken[_rewardToken]) {
            return;
        }
        rewardTokens.push(_rewardToken);
        isRewardToken[_rewardToken] = true;

        emit RewardTokenAdded(_rewardToken);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function getRewardTokens()
        external
        view
        override
        returns (address[] memory)
    {
        return rewardTokens;
    }

    function getRewardTokensLength() external view override returns (uint256) {
        return rewardTokens.length;
    }

    function lock(uint256 _amount) public override {
        require(_amount > 0, "RewardPool : Cannot stake 0");

        _totalSupply = _totalSupply.add(_amount);
        _balances[msg.sender] = _balances[msg.sender].add(_amount);

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        address[] memory rewardTokensLocal = new address[](rewardTokens.length);
        uint256[] memory rewardAmount = new uint256[](rewardTokens.length);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            rewardTokensLocal[i] = rewardTokens[i];
            rewardAmount[i] =
                (rewardRate[rewardTokens[i]] * _amount) /
                10 ** 18;
        }

        userState[msg.sender].lockStates.push(
            LockState({
                amountStaking: _amount,
                tokensReward: rewardTokensLocal,
                rewards: rewardAmount,
                timeStartLock: block.timestamp,
                timeUnlock: block.timestamp + lockTime
            })
        );

        emit Staked(msg.sender, _amount);
    }

    function lockAll() external override {
        uint256 balance = stakingToken.balanceOf(msg.sender);
        lock(balance);
    }

    function lockFor(address _for, uint256 _amount) external override {
        require(_for != address(0), "invalid _for!");
        require(_amount > 0, "RewardPool : Cannot stake 0");

        //give to _for
        _totalSupply = _totalSupply.add(_amount);
        _balances[_for] = _balances[_for].add(_amount);

        //take away from sender
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // get rewards
        address[] memory rewardTokensLocal = new address[](rewardTokens.length);
        uint256[] memory rewardAmount = new uint256[](rewardTokens.length);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            rewardTokensLocal[i] = rewardTokens[i];
            rewardAmount[i] =
                (rewardRate[rewardTokens[i]] * _amount) /
                10 ** 18;
        }

        userState[_for].lockStates.push(
            LockState({
                amountStaking: _amount,
                tokensReward: rewardTokensLocal,
                rewards: rewardAmount,
                timeStartLock: block.timestamp,
                timeUnlock: block.timestamp + lockTime
            })
        );

        emit Staked(_for, _amount);
    }

    function getPendingReward(
        address user
    )
        public
        view
        returns (
            address[] memory pendingRewardsToken,
            uint256[] memory pendingRewards,
            uint256 newStartIndex,
            uint256 amountOfStakingToken
        )
    {
        pendingRewardsToken = new address[](rewardTokens.length);
        pendingRewards = new uint256[](rewardTokens.length);
        for (
            uint256 i = userState[user].startIndex;
            i < userState[user].lockStates.length;
            i++
        ) {
            LockState memory localState = userState[user].lockStates[i];
            if (localState.timeUnlock > block.timestamp) {
                newStartIndex = i;
                break;
            } else {
                // pendingRewards += userState[user].lockStates[i].
                for (uint256 j = 0; j < localState.tokensReward.length; j++) {
                    pendingRewardsToken[j] = localState.tokensReward[j];
                    pendingRewards[j] += localState.rewards[j];
                }
                amountOfStakingToken += localState.amountStaking;
            }
        }
    }

    function relock() external {
        _relock(msg.sender);
    }

    function earned(address user, address token) public view returns (uint256) {
        (
            address[] memory pendingRewardsToken,
            uint256[] memory pendingRewards,
            uint256 newStartIndex,
            uint256 amountOfStakingToken
        ) = getPendingReward(user);

        for (uint256 i = 0; i < pendingRewardsToken.length; i++) {
            if (token == pendingRewardsToken[i]) return pendingRewards[i];
        }
        return 0;
    }

    function _relock(address _account) internal virtual {
        // claim reward
        uint256 stakingAmount = getReward(_account);

        if (stakingAmount > 0) {
            // _totalSupply = _totalSupply.sub(stakingAmount);
            // _balances[_account] = _balances[_account].sub(stakingAmount);

            userState[_account].startIndex += 1;

            address[] memory rewardTokensLocal = new address[](
                rewardTokens.length
            );
            uint256[] memory rewardAmount = new uint256[](rewardTokens.length);
            for (uint256 i = 0; i < rewardTokens.length; i++) {
                rewardTokensLocal[i] = rewardTokens[i];
                rewardAmount[i] =
                    (rewardRate[rewardTokens[i]] * stakingAmount) /
                    10 ** 18;
            }

            userState[_account].lockStates.push(
                LockState({
                    amountStaking: stakingAmount,
                    tokensReward: rewardTokensLocal,
                    rewards: rewardAmount,
                    timeStartLock: block.timestamp,
                    timeUnlock: block.timestamp + lockTime
                })
            );
            // stakingToken.safeTransfer(_account, stakingAmount);
        }
    }

    function unlock() external override {
        _unlock(msg.sender);
    }

    function _unlock(address _account) internal virtual {
        // claim reward
        uint256 stakingAmount = getReward(_account);

        if (stakingAmount > 0) {
            _totalSupply = _totalSupply.sub(stakingAmount);
            _balances[_account] = _balances[_account].sub(stakingAmount);

            userState[_account].startIndex += 1;
            stakingToken.safeTransfer(_account, stakingAmount);
        }
    }

    // Return amount of Quo will get
    function getReward(address _account) public override returns (uint256) {
        (
            address[] memory pendingRewardsToken,
            uint256[] memory pendingRewards,
            uint256 newStartIndex,
            uint256 amountOfStakingToken
        ) = getPendingReward(_account);

        if (pendingRewardsToken.length == 0) {
            return 0;
        }

        for (uint256 i = 0; i < pendingRewardsToken.length; i++) {
            if (pendingRewards[i] > 0) {
                pendingRewardsToken[i].safeTransferToken(
                    _account,
                    pendingRewards[i]
                );

                IWombatBooster(booster).rewardClaimed(
                    pid,
                    _account,
                    pendingRewardsToken[i],
                    pendingRewards[i]
                );
                emit RewardPaid(
                    _account,
                    pendingRewardsToken[i],
                    pendingRewards[i]
                );
            }
        }

        userState[_account].startIndex = newStartIndex - 1;
        userState[_account]
            .lockStates[newStartIndex - 1]
            .amountStaking = amountOfStakingToken;
        userState[_account]
            .lockStates[newStartIndex - 1]
            .tokensReward = new address[](0);
        userState[_account]
            .lockStates[newStartIndex - 1]
            .rewards = new uint256[](0);
        userState[_account].lockStates[newStartIndex - 1].timeStartLock = block
            .timestamp;
        userState[_account].lockStates[newStartIndex - 1].timeUnlock = block
            .timestamp;

        return amountOfStakingToken;
    }

    // function donate(
    //     address _rewardToken,
    //     uint256 _amount
    // ) external payable override {
    //     require(isRewardToken[_rewardToken], "invalid token");
    //     if (AddressLib.isPlatformToken(_rewardToken)) {
    //         require(_amount == msg.value, "invalid amount");
    //     } else {
    //         require(msg.value == 0, "invalid msg.value");
    //         IERC20(_rewardToken).safeTransferFrom(
    //             msg.sender,
    //             address(this),
    //             _amount
    //         );
    //     }

    //     rewards[_rewardToken].queuedRewards = rewards[_rewardToken]
    //         .queuedRewards
    //         .add(_amount);
    // }

    // function queueNewRewards(
    //     address _rewardToken,
    //     uint256 _rewards
    // ) external payable override {
    //     require(access[msg.sender], "!auth");

    //     addRewardToken(_rewardToken);

    //     if (AddressLib.isPlatformToken(_rewardToken)) {
    //         require(_rewards == msg.value, "invalid amount");
    //     } else {
    //         require(msg.value == 0, "invalid msg.value");
    //         IERC20(_rewardToken).safeTransferFrom(
    //             msg.sender,
    //             address(this),
    //             _rewards
    //         );
    //     }

    //     Reward storage rewardInfo = rewards[_rewardToken];

    //     if (totalSupply() == 0) {
    //         rewardInfo.queuedRewards = rewardInfo.queuedRewards.add(_rewards);
    //         return;
    //     }

    //     _rewards = _rewards.add(rewardInfo.queuedRewards);
    //     rewardInfo.queuedRewards = 0;

    //     rewardInfo.rewardPerTokenStored = rewardInfo.rewardPerTokenStored.add(
    //         _rewards.mul(1e18).div(totalSupply())
    //     );
    //     emit RewardAdded(_rewardToken, _rewards);
    // }

    function grant(address _address, bool _grant) external onlyOwner {
        require(_address != address(0), "invalid _address!");

        grants[_address] = _grant;
        emit Granted(_address, _grant);
    }

    function setAccess(
        address _address,
        bool _status
    ) external override onlyOwner {
        require(_address != address(0), "invalid _address!");

        access[_address] = _status;
        emit AccessSet(_address, _status);
    }

    receive() external payable {}

    uint256[100] private __gap;
}
