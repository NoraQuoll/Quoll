// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "@shared/lib-contracts/contracts/Dependencies/ManagerUpgradeable.sol";
import "@shared/lib-contracts/contracts/Dependencies/TransferHelper.sol";
import "./Interfaces/IBribeManager.sol";
import "./Interfaces/IVirtualBalanceRewardPool.sol";

contract DelegateVotePool is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using TransferHelper for address;

    address public bribeManager;
    IVirtualBalanceRewardPool public rewardPool;
    address public feeCollector;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public protocolFee;

    address[] public votePools;
    mapping(address => bool) public isVotePool;
    mapping(address => uint256) public votingWeights;
    uint256 public totalWeight;

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _bribeManager,
        address _rewardPool,
        address _feeCollector
    ) external onlyOwner {
        require(bribeManager == address(0), "params have already been set");

        require(_bribeManager != address(0), "invalid _bribeManager!");
        require(_rewardPool != address(0), "invalid _rewardPool!");
        require(_feeCollector != address(0), "invalid _feeCollector!");

        bribeManager = _bribeManager;
        rewardPool = IVirtualBalanceRewardPool(_rewardPool);
        feeCollector = _feeCollector;

        protocolFee = 500;
    }

    modifier onlyBribeManager() {
        require(msg.sender == bribeManager, "Only BribeManager");
        _;
    }

    modifier harvest() {
        // handle bribes reward
        (
            address[][] memory rewardTokensList,
            uint256[][] memory earnedRewards
        ) = IBribeManager(bribeManager).getRewardAll();
        for (uint256 i = 0; i < rewardTokensList.length; i++) {
            for (uint256 j = 0; j < rewardTokensList[i].length; j++) {
                address rewardToken = rewardTokensList[i][j];
                uint256 earnedReward = earnedRewards[i][j];
                if (protocolFee > 0 && feeCollector != address(0)) {
                    uint256 fee = protocolFee.mul(earnedReward).div(
                        DENOMINATOR
                    );
                    rewardToken.safeTransferToken(feeCollector, fee);
                    earnedReward = earnedReward.sub(fee);
                }
                if (AddressLib.isPlatformToken(rewardToken)) {
                    rewardPool.queueNewRewards{value: earnedReward}(
                        rewardToken,
                        earnedReward
                    );
                } else {
                    _approveTokenIfNeeded(
                        rewardToken,
                        address(rewardPool),
                        earnedReward
                    );
                    rewardPool.queueNewRewards(rewardToken, earnedReward);
                }
            }
        }
        _;
    }

    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        require(_protocolFee < DENOMINATOR, "invalid _protocolFee!");
        protocolFee = _protocolFee;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "invalid _feeCollector!");
        feeCollector = _feeCollector;
    }

    function updateWeight(address _lp, uint256 _weight) external onlyManager {
        require(_lp != address(this), "??");
        if (!isVotePool[_lp]) {
            require(
                IBribeManager(bribeManager).isPoolActive(_lp),
                "Pool not active"
            );
            isVotePool[_lp] = true;
            votePools.push(_lp);
        }
        totalWeight = totalWeight - votingWeights[_lp] + _weight;
        votingWeights[_lp] = _weight;
    }

    function deletePool(address _lp) external onlyOwner {
        require(isVotePool[_lp], "invalid _lp!");
        require(
            !IBribeManager(bribeManager).isPoolActive(_lp),
            "Pool still active"
        );

        isVotePool[_lp] = false;
        uint256 length = votePools.length;
        address[] memory newVotePool = new address[](length - 1);
        uint256 indexShift;
        for (uint256 i; i < length; i++) {
            if (votePools[i] == _lp) {
                indexShift = 1;
            } else {
                newVotePool[i - indexShift] = votePools[i];
            }
        }
        votePools = newVotePool;
        totalWeight = totalWeight - votingWeights[_lp];
        votingWeights[_lp] = 0;
        if (_getVoteForLp(_lp) > 0) {
            IBribeManager(bribeManager).unvote(_lp);
        }
        _updateVote();
    }

    function getPoolsLength() external view returns (uint256) {
        return votePools.length;
    }

    function getRewardTokens() public view returns (address[] memory) {
        return rewardPool.getRewardTokens();
    }

    function totalSupply() public view returns (uint256) {
        return rewardPool.totalSupply();
    }

    function balanceOf(address account) public view returns (uint256) {
        return rewardPool.balanceOf(account);
    }

    function earned(address _account, address _rewardToken)
        external
        view
        returns (uint256)
    {
        return rewardPool.earned(_account, _rewardToken);
    }

    function harvestManually() external harvest {
        return;
    }

    function stakeFor(address _for, uint256 _amount)
        external
        onlyBribeManager
        harvest
        returns (bool)
    {
        rewardPool.stakeFor(_for, _amount);
        _updateVote();
    }

    function withdrawFor(address _for, uint256 _amount)
        external
        onlyBribeManager
        harvest
    {
        rewardPool.withdrawFor(_for, _amount);
        _updateVote();
    }

    function getReward(address _for)
        external
        onlyBribeManager
        returns (
            address[] memory rewardTokensList,
            uint256[] memory earnedRewards
        )
    {
        rewardTokensList = getRewardTokens();
        uint256 length = rewardTokensList.length;
        earnedRewards = new uint256[](length);
        for (uint256 index = 0; index < length; ++index) {
            address rewardToken = rewardTokensList[index];
            earnedRewards[index] = rewardPool.earned(_for, rewardToken);
        }
        rewardPool.getReward(_for);
    }

    function _getVoteForLp(address _lp) internal view returns (uint256) {
        return
            IBribeManager(bribeManager).getUserVoteForPool(_lp, address(this));
    }

    function _updateVote() internal {
        uint256 length = votePools.length;
        int256[] memory deltas = new int256[](length);
        for (uint256 index = 0; index < length; ++index) {
            address pool = votePools[index];
            uint256 targetVote = votingWeights[pool].mul(totalSupply()).div(
                totalWeight
            );
            uint256 currentVote = _getVoteForLp(pool);
            deltas[index] = int256(targetVote) - int256(currentVote);
        }
        IBribeManager(bribeManager).vote(votePools, deltas);
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

    receive() external payable {}
}
