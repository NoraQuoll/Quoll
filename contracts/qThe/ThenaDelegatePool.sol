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

contract ThenaDelegatePool is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using TransferHelper for address;

    address public quo;
    address public voterProxy;

    IVirtualBalanceRewardPool public rewardPool;
    INativeZapper public nativeZapper;

    address public feeCollector;
    uint256 public constant DENOMINATOR = 10000;
    uint256 public protocolFee;

    address[] public votePools;
    mapping(address => bool) public isVotePool;
    mapping(address => uint256) public votingWeights;
    uint256 public totalWeight;

    // -----------------------------------------------------------------------------------------------------------------
    // 7 days, to use as denominator in lock calculation
    uint256 private constant WEEK = 604800;
    address private constant THENA_VOTER_V3 =
        0x3A1D0952809F4948d15EBCe8d345962A282C4fCb;

    event QuoHarvested(uint256 _amount, uint256 _fee);

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _quo,
        address _rewardPool,
        address _nativeZapper,
        address _feeCollector,
        address _thenaVoterProxy
    ) external onlyOwner {
        require(voterProxy == address(0), "params have already been set");

        require(_quo != address(0), "invalid _quo!");
        require(_rewardPool != address(0), "invalid _rewardPool!");
        require(_nativeZapper != address(0), "invalid _nativeZapper!");
        require(_feeCollector != address(0), "invalid _feeCollector!");

        quo = _quo;
        rewardPool = IVirtualBalanceRewardPool(_rewardPool);
        nativeZapper = INativeZapper(_nativeZapper);
        feeCollector = _feeCollector;
        voterProxy = _thenaVoterProxy;

        protocolFee = 500;
    }

    modifier onlyVoterProxy() {
        require(msg.sender == voterProxy, "Only BribeManager");
        _;
    }

    modifier harvest() {
        // handle bribes reward
        uint256[] memory claimableEpochs = IThenaVoterProxy(voterProxy)
            .getClaimableEpochsForUser(address(this));
        for (uint epoch = 0; epoch < claimableEpochs.length; epoch++) {
            (
                ,
                address[][] memory rewardTokensList,
                uint256[][] memory earnedRewards
            ) = IThenaVoterProxy(voterProxy).claimableByUser(
                    claimableEpochs[epoch],
                    address(this)
                );
            uint256 quoAmount = 0;
            for (uint256 i = 0; i < rewardTokensList.length; i++) {
                for (uint256 j = 0; j < rewardTokensList[i].length; j++) {
                    address rewardToken = rewardTokensList[i][j];
                    uint256 earnedReward = earnedRewards[i][j];
                    if (rewardToken == address(0) || earnedReward == 0) {
                        continue;
                    }
                    if (rewardToken == quo) {
                        quoAmount = quoAmount.add(earnedReward);
                        continue;
                    }
                    if (AddressLib.isPlatformToken(rewardToken)) {
                        quoAmount = quoAmount.add(
                            nativeZapper.swapToken{value: earnedReward}(
                                rewardToken,
                                quo,
                                earnedReward,
                                address(this)
                            )
                        );
                    } else {
                        _approveTokenIfNeeded(
                            rewardToken,
                            address(nativeZapper),
                            earnedReward
                        );
                        quoAmount = quoAmount.add(
                            nativeZapper.swapToken(
                                rewardToken,
                                quo,
                                earnedReward,
                                address(this)
                            )
                        );
                    }
                }
            }
            if (quoAmount > 0) {
                uint256 fee;
                if (protocolFee > 0 && feeCollector != address(0)) {
                    fee = protocolFee.mul(quoAmount).div(DENOMINATOR);
                    quo.safeTransferToken(feeCollector, fee);
                }
                emit QuoHarvested(quoAmount, fee);
                quoAmount = quoAmount.sub(fee);
                _approveTokenIfNeeded(quo, address(rewardPool), quoAmount);
                rewardPool.queueNewRewards(quo, quoAmount);
            }
        }

        IThenaVoterProxy(voterProxy).claimAllEpochs();
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

    function updateWeights(address[] memory _lps, uint256[] memory _weights) external onlyManager{
        require(_lps.length == _weights.length, "length mismatch");
        for(uint256 i = 0 ; i < _lps.length; i++){
            address _lp = _lps[i];
            uint256 _weight = _weights[i];
            _updateWeight(_lp, _weight);
        }
    }
    
    function updateWeight(address _lp, uint256 _weight)external onlyManager{
        _updateWeight(_lp, _weight);
    }

    function _updateWeight(address _lp, uint256 _weight) internal  {
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
        _updateVote();
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

    function earned(
        address _account,
        address _rewardToken
    ) external view returns (uint256) {
        return rewardPool.earned(_account, _rewardToken);
    }

    function harvestManually() external harvest {
        return;
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
    ) external onlyVoterProxy harvest harvest {
        rewardPool.withdrawFor(_for, _amount);
        _updateVote();
    }

    function _updateVote() internal {
        uint256 length = votePools.length;
        uint256[] memory voteWeights = new uint256[](length);
        for (uint256 index = 0; index < length; index++) {
            voteWeights[index] =
                (votingWeights[votePools[index]] * 100) /
                totalWeight;
        }
        IThenaVoterProxy(voterProxy).voteByDelegationAdmin(votePools, voteWeights);
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
