// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./Interfaces/IVlQuoV2.sol";

contract VlQuoV2 is
    IVlQuoV2,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 public quo;

    uint256 public maxLockLength;

    uint256 public constant WEEK = 86400 * 7;
    uint256 public constant MAX_LOCK_WEEKS = 52;

    struct LockInfo {
        uint256 quoAmount;
        uint256 vlQuoAmount;
        uint256 lockTime;
        uint256 unlockTime;
    }

    mapping(address => LockInfo[]) public userLocks;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    mapping(uint256 => uint256) public weeklyTotalWeight;
    mapping(address => mapping(uint256 => uint256)) public weeklyUserWeight;

    // when set to true, other accounts cannot call `lock` on behalf of an account
    mapping(address => bool) public blockThirdPartyActions;

    address[] public rewardTokens;
    mapping(address => bool) public isRewardToken;

    // reward token address => queued rewards
    mapping(address => uint256) public queuedRewards;

    // reward token address => week => rewards
    mapping(address => mapping(uint256 => uint256)) public weeklyRewards;

    // user address => last claimed week
    mapping(address => uint256) public lastClaimedWeek;

    mapping(address => bool) public access;

    event Locked(address indexed _user, uint256 _amount, uint256 _weeks);

    event Unlocked(
        address indexed _user,
        uint256 _unlockTime,
        uint256 _quoAmount,
        uint256 _vlQuoAmount
    );

    event RewardTokenAdded(address indexed _rewardToken);

    event RewardAdded(address indexed _rewardToken, uint256 _reward);

    event RewardPaid(
        address indexed _user,
        address indexed _rewardToken,
        uint256 _reward
    );

    event AccessSet(address indexed _address, bool _status);

    function initialize(address _quo) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init_unchained();
        __Pausable_init_unchained();

        quo = IERC20(_quo);

        maxLockLength = 10000;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setMaxLockLength(uint256 _maxLockLength) external onlyOwner {
        maxLockLength = _maxLockLength;
    }

    // Allow or block third-party calls on behalf of the caller
    function setBlockThirdPartyActions(bool _block) external {
        blockThirdPartyActions[msg.sender] = _block;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _user) external view override returns (uint256) {
        return _balances[_user];
    }

    function getUserLocks(address _user)
        external
        view
        returns (LockInfo[] memory)
    {
        return userLocks[_user];
    }

    function lock(
        address _user,
        uint256 _amount,
        uint256 _weeks
    ) external nonReentrant whenNotPaused {
        require(_user != address(0), "invalid _user!");
        require(
            msg.sender == _user || !blockThirdPartyActions[_user],
            "Cannot lock on behalf of this account"
        );

        require(_weeks > 0, "Min 1 week");
        require(_weeks <= MAX_LOCK_WEEKS, "Exceeds MAX_LOCK_WEEKS");
        require(_amount > 0, "Amount must be nonzero");

        require(userLocks[_user].length < maxLockLength, "locks too much");

        quo.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 vlQuoAmount = _amount.mul(_weeks);
        uint256 unlockTime = _getNextWeek().add(_weeks.mul(WEEK));
        userLocks[_user].push(
            LockInfo(_amount, vlQuoAmount, block.timestamp, unlockTime)
        );

        _totalSupply += vlQuoAmount;
        _balances[_user] += vlQuoAmount;

        for (uint256 week = _getNextWeek(); week < unlockTime; week += WEEK) {
            weeklyTotalWeight[week] += vlQuoAmount;
            weeklyUserWeight[_user][week] += vlQuoAmount;
        }

        if (lastClaimedWeek[_user] == 0) {
            lastClaimedWeek[_user] = _getCurWeek();
        }

        emit Locked(_user, _amount, _weeks);
    }

    function unlock(uint256 _slot) external nonReentrant whenNotPaused {
        uint256 length = userLocks[msg.sender].length;
        require(_slot < length, "wut?");

        LockInfo memory lockInfo = userLocks[msg.sender][_slot];
        require(lockInfo.unlockTime <= block.timestamp, "not yet meh");

        // remove slot
        if (_slot != length - 1) {
            userLocks[msg.sender][_slot] = userLocks[msg.sender][length - 1];
        }
        userLocks[msg.sender].pop();

        quo.transfer(msg.sender, lockInfo.quoAmount);

        _totalSupply -= lockInfo.vlQuoAmount;
        _balances[msg.sender] -= lockInfo.vlQuoAmount;

        emit Unlocked(
            msg.sender,
            lockInfo.unlockTime,
            lockInfo.quoAmount,
            lockInfo.vlQuoAmount
        );
    }

    function getReward() external {
        uint256 userLastClaimedWeek = lastClaimedWeek[msg.sender];
        if (
            userLastClaimedWeek == 0 ||
            userLastClaimedWeek >= _getCurWeek().sub(WEEK)
        ) {
            return;
        }
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address rewardToken = rewardTokens[i];
            uint256 reward = earned(msg.sender, rewardToken);
            if (reward > 0) {
                IERC20(rewardToken).safeTransfer(msg.sender, reward);

                emit RewardPaid(msg.sender, rewardToken, reward);
            }
        }

        lastClaimedWeek[msg.sender] = _getCurWeek().sub(WEEK);
    }

    function getRewardTokensLength() external view returns (uint256) {
        return rewardTokens.length;
    }

    function _addRewardToken(address _rewardToken) internal {
        if (isRewardToken[_rewardToken]) {
            return;
        }
        rewardTokens.push(_rewardToken);
        isRewardToken[_rewardToken] = true;

        emit RewardTokenAdded(_rewardToken);
    }

    function earned(address _user, address _rewardToken)
        public
        view
        returns (uint256)
    {
        // return 0 if user has never locked
        if (lastClaimedWeek[_user] == 0) {
            return 0;
        }

        uint256 startWeek = lastClaimedWeek[_user].add(WEEK);
        uint256 finishedWeek = _getCurWeek().sub(WEEK);
        uint256 amount = 0;

        for (
            uint256 cur = startWeek;
            cur <= finishedWeek;
            cur = cur.add(WEEK)
        ) {
            uint256 totalW = weeklyTotalWeight[cur];
            if (totalW == 0) {
                continue;
            }
            amount = amount.add(
                weeklyRewards[_rewardToken][cur]
                    .mul(weeklyUserWeight[_user][cur])
                    .div(totalW)
            );
        }
        return amount;
    }

    function donate(address _rewardToken, uint256 _amount) external {
        require(isRewardToken[_rewardToken], "invalid token");
        IERC20(_rewardToken).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        queuedRewards[_rewardToken] = queuedRewards[_rewardToken].add(_amount);
    }

    function queueNewRewards(address _rewardToken, uint256 _rewards) external {
        require(access[msg.sender], "!auth");

        _addRewardToken(_rewardToken);

        IERC20(_rewardToken).safeTransferFrom(
            msg.sender,
            address(this),
            _rewards
        );

        uint256 curWeek = _getCurWeek();
        uint256 totalWeight = weeklyTotalWeight[curWeek];
        if (totalWeight == 0) {
            queuedRewards[_rewardToken] = queuedRewards[_rewardToken].add(
                _rewards
            );
            return;
        }

        _rewards = _rewards.add(queuedRewards[_rewardToken]);
        queuedRewards[_rewardToken] = 0;

        weeklyRewards[_rewardToken][curWeek] = weeklyRewards[_rewardToken][
            curWeek
        ].add(_rewards);
        emit RewardAdded(_rewardToken, _rewards);
    }

    function setAccess(address _address, bool _status) external onlyOwner {
        require(_address != address(0), "invalid _address!");

        access[_address] = _status;
        emit AccessSet(_address, _status);
    }

    function _getCurWeek() internal view returns (uint256) {
        return block.timestamp.div(WEEK).mul(WEEK);
    }

    function _getNextWeek() internal view returns (uint256) {
        return _getCurWeek().add(WEEK);
    }
}