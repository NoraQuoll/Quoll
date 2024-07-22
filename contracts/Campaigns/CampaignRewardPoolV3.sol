// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/TransferHelper.sol";
import "../lib/ManagerUpgradeable.sol";
import "../Interfaces/IVlQuoV2.sol";
import "../Interfaces/IThenaDepositor.sol";

contract CampaignRewardPoolV2 is ManagerUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using TransferHelper for address;

    IERC20 public stakingToken; // qThe
    address public thena;
    address public quo;
    address public thenaDepositor;
    address public vlQuoV2;
    address public treasury;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public lockWeeks;
    uint256 public penalty;

    uint256 public duration;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    event RewardAdded(uint256 _rewards);
    event Staked(address indexed _user, uint256 _amount);
    event Withdrawn(address indexed _user, uint256 _amount);
    event RewardPaid(address indexed _user, uint256 _reward);

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _stakingToken,
        address _thena,
        address _quo,
        address _thenaDepositor,
        address _vlquoV2,
        address _treasury
    ) external onlyOwner {
        require(quo == address(0), "params have already been set");

        require(_stakingToken != address(0), "invalid _stakingToken!");
        require(_thena != address(0), "invalid _thena!");
        require(_quo != address(0), "invalid _quo!");
        require(_thenaDepositor != address(0), "invalid _thenaDepositor!");
        require(_vlquoV2 != address(0), "invalid _vlquoV2!");
        require(_treasury != address(0), "invalid _treasury!");

        stakingToken = IERC20(_stakingToken);
        thena = _thena;
        quo = _quo;
        thenaDepositor = _thenaDepositor;
        vlQuoV2 = _vlquoV2;
        treasury = _treasury;
    }

    function initPool(
        uint256 _lockWeeks,
        uint256 _penalty,
        uint256 _duration
    ) external onlyManager {
        require(rewardRate == 0, "!one time");

        require(_lockWeeks > 0, "invalid _lockWeeks!");
        require(_penalty >= 0, "invalid _penalty!");
        require(_penalty <= DENOMINATOR, "invalid _penalty!");
        require(_duration > 0, "invalid _duration!");

        lockWeeks = _lockWeeks;
        penalty = _penalty;
        duration = _duration;

        uint256 rewardsAvailable = IERC20(quo).balanceOf(address(this));
        require(rewardsAvailable > 0, "!balance");

        rewardRate = rewardsAvailable.div(duration);

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(duration);

        IERC20(quo).safeApprove(vlQuoV2, type(uint256).max);

        emit RewardAdded(rewardsAvailable);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    modifier updateReward(address _user) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (_user != address(0)) {
            rewards[_user] = earned(_user);
            userRewardPerTokenPaid[_user] = rewardPerTokenStored;
        }

        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address _user) public view returns (uint256) {
        return
            balanceOf(_user)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[_user]))
                .div(1e18)
                .add(rewards[_user]);
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "RewardPool : Cannot stake 0");
        require(rewardRate > 0, "Only when Campaign ready");

        _totalSupply = _totalSupply.add(_amount);
        _balances[msg.sender] = _balances[msg.sender].add(_amount);

        IERC20(thena).safeTransferFrom(msg.sender, address(this), _amount);
        _approveTokenIfNeeded(thena, thenaDepositor, _amount);
        IThenaDepositor(thenaDepositor).deposit(_amount, false);

        emit Staked(msg.sender, _amount);
    }

    function withdraw(
        uint256 _amount,
        bool _lock
    ) external updateReward(msg.sender) {
        require(_amount > 0, "RewardPool : Cannot withdraw 0");
        require(rewardRate > 0, "Only when Campaign ready");

        _totalSupply = _totalSupply.sub(_amount);
        _balances[msg.sender] = _balances[msg.sender].sub(_amount);

        stakingToken.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);

        getReward(_lock);
    }

    function getReward(bool _lock) public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            if (_lock) {
                // lock 6 weeks
                IVlQuoV2(vlQuoV2).lock(msg.sender, reward, lockWeeks);
            } else {
                uint256 penaltyAmount = reward.mul(penalty).div(DENOMINATOR);
                IERC20(quo).safeTransfer(treasury, penaltyAmount);
                IERC20(quo).safeTransfer(msg.sender, reward.sub(penaltyAmount));
            }
            emit RewardPaid(msg.sender, reward);
        }
    }

    function _approveTokenIfNeeded(
        address _token,
        address _to,
        uint256 _amount
    ) internal {
        if (IERC20(_token).allowance(address(this), _to) < _amount) {
            IERC20(_token).safeApprove(_to, 0);
            IERC20(_token).safeApprove(_to, type(uint256).max);
        }
    }
}
