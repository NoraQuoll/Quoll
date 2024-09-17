// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VlQuoRewardPool is OwnableUpgradeable, ReentrancyGuardUpgradeable {
  // Info of each user.
  struct UserInfo {
    // storage slot 1
    // uint256 amount; // 20.18 fixed point. How many vlQuo the user has provided.
    uint256 rewardDebt; //
    uint256 pendingToken; // 20.18 fixed point. Amount of pending wom
  }

  struct RewardInfo {
    uint256 periodFinish;
    uint256 rewardRate;
    uint256 lastRewardTimestamp;
    uint256 accTokenPerShare;
  }

  event RewardTokenAdded(address indexed _rewardToken);
  event AccessSet(address indexed _address, bool _status);
  event Harvest(address rewardToken, address user, uint256 amount);

  uint256 public constant ACC_TOKEN_PRECISION = 1e12;

  mapping(address => RewardInfo) public rewardInfos;

  // user -> reward token
  mapping(address => mapping(address => UserInfo)) public userRewardsData;

  address[] public rewardTokens;
  mapping(address => bool) public isRewardToken;

  mapping(address => bool) public access;

  address public vlQuo;

  function initialize(address _vlQuo) external initializer {
    __Ownable_init();
    __ReentrancyGuard_init_unchained();
    vlQuo = _vlQuo;
  }

  function setAccess(address _address, bool _status) external onlyOwner {
    require(_address != address(0), "invalid _address!");

    access[_address] = _status;
    emit AccessSet(_address, _status);
  }

  function setVlQuo(address _vlQuo) external onlyOwner {
    vlQuo = _vlQuo;
  }

  function _addRewardToken(address _rewardToken) internal {
    if (isRewardToken[_rewardToken]) {
      return;
    }
    rewardTokens.push(_rewardToken);
    isRewardToken[_rewardToken] = true;

    emit RewardTokenAdded(_rewardToken);
  }

  function addRewardToken(address _rewardToken) external {
    require(access[msg.sender], "!auth");
    _addRewardToken(_rewardToken);
  }

  function queueNewReward(
    address _rewardToken,
    uint256 _amount,
    uint256 _periodFinish
  ) external {
    require(access[msg.sender], "!auth");

    _addRewardToken(_rewardToken);

    require(
      _periodFinish > block.timestamp,
      "period finish must greater than current time"
    );
    require(_amount > 0, "notifyRewardAmount: zero amount");
    IERC20(_rewardToken).transferFrom(msg.sender, address(this), _amount);

    // this line reverts if asset is not in the list

    RewardInfo storage rewardInfo = rewardInfos[_rewardToken];
    if (rewardInfo.lastRewardTimestamp == 0) {
      rewardInfo.lastRewardTimestamp = block.timestamp;
    }

    if (rewardInfo.lastRewardTimestamp >= rewardInfo.periodFinish) {
      rewardInfo.rewardRate = _amount / (_periodFinish - block.timestamp);
    } else {
      uint256 remainingTime = rewardInfo.periodFinish -
        rewardInfo.lastRewardTimestamp;
      uint256 leftoverReward = remainingTime * rewardInfo.rewardRate;
      rewardInfo.rewardRate =
        (_amount + leftoverReward) /
        (_periodFinish - block.timestamp);
    }

    rewardInfo.lastRewardTimestamp = block.timestamp;
    rewardInfo.periodFinish = _periodFinish;
  }

  function withdrawReward(address token, uint256 amount) public onlyOwner {
    IERC20(token).transfer(msg.sender, amount);
  }

  function getRewardTokens() public view returns (address[] memory) {
    return rewardTokens;
  }

  function getReward() external returns (uint256[] memory pendingRewards) {
    pendingRewards = new uint256[](rewardTokens.length);
    for (uint256 i = 0; i < rewardTokens.length; i++) {
      address _rewardToken = rewardTokens[i];
      _updatePool(_rewardToken, IERC20(vlQuo).totalSupply());

      UserInfo storage user = userRewardsData[msg.sender][_rewardToken];
      uint256 userAmount = IERC20(vlQuo).balanceOf(msg.sender);
      if (userAmount > 0 || user.pendingToken > 0) {
        RewardInfo storage rewardInfo = rewardInfos[_rewardToken];
        // increase pending to send all rewards once
        uint256 poolRewards = (userAmount * rewardInfo.accTokenPerShare) /
          ACC_TOKEN_PRECISION +
          user.pendingToken -
          user.rewardDebt;

        user.pendingToken = 0;

        // update reward debt
        user.rewardDebt =
          (userAmount * rewardInfo.accTokenPerShare) /
          ACC_TOKEN_PRECISION;
        emit Harvest(_rewardToken, msg.sender, poolRewards);
        IERC20(_rewardToken).transfer(msg.sender, poolRewards);
        pendingRewards[i] = poolRewards;
      }
    }
  }

  function updateBalVlquoV2(
    address _user,
    uint256 _userCurrentBal,
    uint256 _userNewBal,
    uint256 _totalLocked
  ) public {
    require(access[msg.sender], "!auth");
    for (uint256 i = 0; i < rewardTokens.length; i++) {
      address _rewardToken = rewardTokens[i];
      _updatePool(_rewardToken, _totalLocked);
      _updateUserAmount(_rewardToken, _user, _userCurrentBal, _userNewBal);
    }
  }

  function _updatePool(address _rewardToken, uint256 _totalLocked) private {
    RewardInfo storage rewardInfo = rewardInfos[_rewardToken];

    if (block.timestamp > rewardInfo.lastRewardTimestamp) {
      uint256 accTokenPerShare = calRewardPerUnit(_rewardToken, _totalLocked);
      rewardInfo.accTokenPerShare = accTokenPerShare;
      rewardInfo.lastRewardTimestamp = lastTimeRewardApplicable(
        rewardInfo.periodFinish
      );
    }
  }

  function _updateUserAmount(
    address _rewardToken,
    address _user,
    uint256 _userCurrentBal,
    uint256 _userNewBal
  ) internal returns (uint256 reward) {
    RewardInfo storage rewardInfo = rewardInfos[_rewardToken];

    UserInfo storage user = userRewardsData[_user][_rewardToken];

    // Harvest WOM
    if (_userCurrentBal > 0 || user.pendingToken > 0) {
      reward =
        ((_userCurrentBal * rewardInfo.accTokenPerShare) /
          ACC_TOKEN_PRECISION) +
        user.pendingToken -
        user.rewardDebt;
      user.pendingToken = reward;
    }

    // update reward debt
    user.rewardDebt =
      (_userNewBal * rewardInfo.accTokenPerShare) /
      ACC_TOKEN_PRECISION;
  }

  function calRewardPerUnit(
    address _rewardToken,
    uint256 _totalLocked
  ) public view returns (uint256 accTokenPerShare) {
    RewardInfo memory rewardInfo = rewardInfos[_rewardToken];
    uint256 secondsElapsed = lastTimeRewardApplicable(rewardInfo.periodFinish) -
      rewardInfo.lastRewardTimestamp;

    uint256 tokenReward = secondsElapsed * rewardInfo.rewardRate;

    accTokenPerShare = rewardInfo.accTokenPerShare;
    if (_totalLocked != 0) {
      accTokenPerShare += (tokenReward * ACC_TOKEN_PRECISION) / (_totalLocked);
    }
  }

  function lastTimeRewardApplicable(
    uint256 _periodFinish
  ) public view returns (uint256) {
    return block.timestamp < _periodFinish ? block.timestamp : _periodFinish;
  }
}
