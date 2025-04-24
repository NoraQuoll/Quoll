// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/ManagerUpgradeable.sol";
import "../lib/TransferHelper.sol";
import "../Interfaces/INativeZapper.sol";
import "../Interfaces/IVirtualBalanceRewardPool.sol";
import "../Interfaces/IThenaVoterProxy.sol";
import "../Interfaces/Thena/IVoterV3.sol";
import "../Interfaces/IPancakePath.sol";

contract ThenaDelegatePool is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using TransferHelper for address;

    // 7 days, to use as denominator in lock calculation
    uint256 private constant WEEK = 604800;
    address private constant THENA_VOTER_V3 =
        0x3A1D0952809F4948d15EBCe8d345962A282C4fCb;
    uint256 public constant DENOMINATOR = 10000;

    address public quo;
    address public voterProxy;
    address public feeCollector;
    INativeZapper public nativeZapper;
    IVirtualBalanceRewardPool public rewardPool;
    address[] public votePools;

    uint256 public totalWeight;
    uint256 public protocolFee;
    uint256 public lastHarvest; //last epoch harvested

    mapping(address => bool) public isVotePool;
    mapping(address => uint256) public votingWeights;

    event WeightUpdate(address _lp, uint256 _weight);
    event PoolDeleted(address _lp);
    event QuoHarvested(uint256 _amount, uint256 _fee);
    event RewardHarvested(
        address rewardToken,
        uint256 earnedReward,
        uint256 fee
    );

    modifier onlyVoterProxy() {
        require(msg.sender == voterProxy, "Only voter proxy");
        _;
    }

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _quo,
        address _thenaVoterProxy,
        address _rewardPool,
        address _nativeZapper,
        address _feeCollector
    ) external onlyOwner {
        require(voterProxy == address(0), "params have already been set");
        require(_quo != address(0), "invalid _quo!");
        require(_rewardPool != address(0), "invalid _rewardPool!");
        require(_nativeZapper != address(0), "invalid _nativeZapper!");
        require(_feeCollector != address(0), "invalid _feeCollector!");

        quo = _quo;
        voterProxy = _thenaVoterProxy;
        nativeZapper = INativeZapper(_nativeZapper);
        feeCollector = _feeCollector;
        protocolFee = 500;
        rewardPool = IVirtualBalanceRewardPool(_rewardPool);
        lastHarvest = block.timestamp;
    }

    function setRewardPool(address _rewardPool) external onlyOwner {
        require(_rewardPool != address(0), "invalid _rewardPool!");
        rewardPool = IVirtualBalanceRewardPool(_rewardPool);
    }

    //thena voting rewards can be claimed atfter the next Epochs ends
    modifier harvest() {
        uint256 currentEpoch = IThenaVoterProxy(voterProxy).getCurrentEpoch();
        if (currentEpoch - lastHarvest > WEEK) {
            //get claimable epochs
            uint256[] memory epochs = IThenaVoterProxy(voterProxy)
                .getClaimableEpochsForUser(address(this));
            for (
                uint256 epochIndex = 0;
                epochIndex < epochs.length;
                epochIndex++
            ) {
                (
                    address[] memory pools,
                    address[][] memory rewardTokensList,
                    uint256[][] memory earnedRewards
                ) = IThenaVoterProxy(voterProxy).claimableByUser(
                        epochs[epochIndex],
                        address(this)
                    );
                //claim reward of each epoch from voter proxy
                IThenaVoterProxy(voterProxy).claimAll(epochs[epochIndex]);
                for (uint256 i = 0; i < rewardTokensList.length; i++) {
                    for (uint256 j = 0; j < rewardTokensList[i].length; j++) {
                        address rewardToken = rewardTokensList[i][j];
                        uint256 earnedReward = earnedRewards[i][j];
                        // queue reward immediately
                        if (earnedReward > 0) {
                            uint256 fee;
                            if (protocolFee > 0 && feeCollector != address(0)) {
                                fee = protocolFee.mul(earnedReward).div(
                                    DENOMINATOR
                                );
                                rewardToken.safeTransferToken(
                                    feeCollector,
                                    fee
                                );
                            }
                            uint256 amountToQueue = earnedReward.sub(fee);
                            _approveTokenIfNeeded(
                                rewardToken,
                                address(rewardPool),
                                amountToQueue
                            );
                            rewardPool.queueNewRewards(
                                rewardToken,
                                amountToQueue
                            );
                            emit RewardHarvested(
                                rewardToken,
                                earnedReward,
                                fee
                            );
                        }
                    }
                }
            }

            lastHarvest = currentEpoch;
        }
        _;
    }

    function updateWeights(
        address[] memory _lps,
        uint256[] memory _weights
    ) external onlyManager {
        require(_lps.length == _weights.length, "length mismatch");
        for (uint256 i = 0; i < _lps.length; i++) {
            address _lp = _lps[i];
            uint256 _weight = _weights[i];
            _updateWeight(_lp, _weight);
        }
    }

    function updateWeight(address _lp, uint256 _weight) external onlyManager {
        _updateWeight(_lp, _weight);
    }

    function _updateWeight(address _lp, uint256 _weight) internal {
        require(_lp != address(this), "??");
        if (!isVotePool[_lp]) {
            require(
                IVoterV3(THENA_VOTER_V3).gauges(_lp) != address(0),
                "Pool is either invalid or doesn't have a gauge"
            );
            isVotePool[_lp] = true;
            votePools.push(_lp);
        }
        totalWeight = totalWeight.sub(votingWeights[_lp]).add(_weight);
        votingWeights[_lp] = _weight;
        emit WeightUpdate(_lp, _weight);
    }

    function deletePool(address _lp) external onlyOwner {
        require(isVotePool[_lp], "invalid _lp!");
        require(
            IVoterV3(THENA_VOTER_V3).gauges(_lp) != address(0),
            "Pool is either invalid or doesn't have a gauge"
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
        _updateVote();
        emit PoolDeleted(_lp);
    }

    function getPoolsLength() external view returns (uint256) {
        return votePools.length;
    }

    function getRewardTokens() public view returns (address[] memory) {
        return rewardPool.getRewardTokens();
    }

    ///@dev return amount total amount vlQuo delegated
    function totalSupply() public view returns (uint256) {
        return rewardPool.totalSupply();
    }

    ///@dev return the weight of user vote for delegate vote pool
    function balanceOf(address account) public view returns (uint256) {
        return rewardPool.balanceOf(account);
    }

    function earned(
        address _account,
        address _rewardToken
    ) external view returns (uint256) {
        return rewardPool.earned(_account, _rewardToken);
    }

    function harvestManually(
        uint256 _epoch
    )
        external
        onlyOwner
        returns (
            address[] memory _pools,
            address[][] memory rewardTokensList,
            uint256[][] memory earnedRewards
        )
    {
        (_pools, rewardTokensList, earnedRewards) = IThenaVoterProxy(voterProxy)
            .claimableByUser(_epoch, address(this));

        //claim reward from proxy
        IThenaVoterProxy(voterProxy).claimAll(_epoch);
        for (uint256 i = 0; i < rewardTokensList.length; i++) {
            for (uint256 j = 0; j < rewardTokensList[i].length; j++) {
                address rewardToken = rewardTokensList[i][j];
                uint256 earnedReward = earnedRewards[i][j];

                // queue reward immediately
                if (earnedReward > 0) {
                    uint256 fee;
                    if (protocolFee > 0 && feeCollector != address(0)) {
                        fee = protocolFee.mul(earnedReward).div(DENOMINATOR);
                        rewardToken.safeTransferToken(feeCollector, fee);
                    }
                    uint256 amountToQueue = earnedReward.sub(fee);
                    _approveTokenIfNeeded(
                        rewardToken,
                        address(rewardPool),
                        amountToQueue
                    );
                    rewardPool.queueNewRewards(rewardToken, amountToQueue);
                    emit RewardHarvested(rewardToken, earnedReward, fee);
                }
            }
        }
    }

    function stakeFor(
        address _for,
        uint256 _amount
    ) external onlyVoterProxy harvest {
        rewardPool.stakeFor(_for, _amount);
        _updateVote();
    }

    function withdrawFor(
        address _for,
        uint256 _amount
    ) external onlyVoterProxy harvest {
        rewardPool.withdrawFor(_for, _amount);
        _updateVote();
    }

    function resetDelegateVoteByOwner(
        address[] calldata _users
    ) external onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];
            uint256 balance = balanceOf(user);
            if (balance > 0) {
                rewardPool.withdrawFor(user, balance);
            }
        }
        _updateVote();
    }

    function getReward() external {
        rewardPool.getReward(msg.sender);
    }

    //voter proxy will call this function in the first vote each new epoch
    //to keep the delegated vote weight from the previous epoch
    function updateVote() external harvest onlyVoterProxy {
        _updateVote();
    }

    function _updateVote() internal {
        uint256 length = votePools.length;
        if (length > 0) {
            uint256[] memory voteWeights = new uint256[](length);
            for (uint256 index = 0; index < length; index++) {
                address pool = votePools[index];
                voteWeights[index] = votingWeights[pool].mul(DENOMINATOR).div(
                    totalWeight
                );
            }

            IThenaVoterProxy(voterProxy).voteByDelegatePool(
                votePools,
                voteWeights
            );
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

    receive() external payable {}
}
