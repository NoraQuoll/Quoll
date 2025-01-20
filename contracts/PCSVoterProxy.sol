// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IVirtualBalanceRewardPool.sol";
import "./Interfaces/IPCSVoterProxy.sol";

import "./Interfaces/Pancake/IGaugeVoting.sol";
import "./Interfaces/Pancake/IMasterChef.sol";
import "./Interfaces/Pancake/IRevenueSharingPool.sol";

// import "./Interfaces/IWombatVoterProxy.sol";
// import "./Interfaces/Wombat/IBribe.sol";
// import "./Interfaces/Wombat/IMasterWombatV2.sol";
// import "./Interfaces/Wombat/IMasterWombatV3.sol";
// import "./Interfaces/Wombat/IVeWom.sol";
// import "./Interfaces/Wombat/IVoter.sol";
import "./lib/TransferHelper.sol";

contract PCSVoterProxy is IPCSVoterProxy, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using TransferHelper for address;

    address public cake;
    IMasterChefV2 public masterChef;
    address public veCake;

    address public booster;
    address public depositor;

    IGaugeVoting public gaugeVoting;
    address public bribeManager;
    uint256 constant FEE_DENOMINATOR = 10000;
    uint256 public bribeCallerFee;
    uint256 public bribeProtocolFee;
    address public bribeFeeCollector;

    address[] public revenueSharingPools;

    modifier onlyBooster() {
        require(msg.sender == booster, "!auth");
        _;
    }

    modifier onlyDepositor() {
        require(msg.sender == depositor, "!auth");
        _;
    }

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _masterChef,
        address _cake,
        address _veCake,
        address _booster,
        address _depositor
    ) external onlyOwner {
        require(booster == address(0), "!init");

        require(_masterChef != address(0), "invalid _masterChef!");
        require(_cake != address(0), "invalid _cake!");
        require(_veCake != address(0), "invalid _veCake!");
        require(_booster != address(0), "invalid _booster!");
        require(_depositor != address(0), "invalid _depositor!");

        masterChef = IMasterChefV2(_masterChef);
        cake = _cake;
        veCake = _veCake;

        booster = _booster;
        depositor = _depositor;

        emit BoosterUpdated(_booster);
        emit DepositorUpdated(_depositor);
    }

    function setVoter(address _gaugeVoting) external onlyOwner {
        require(_gaugeVoting != address(0), "invalid _gaugeVoting!");

        gaugeVoting = IGaugeVoting(_gaugeVoting);
    }

    function setBribeManager(address _bribeManager) external onlyOwner {
        require(_bribeManager != address(0), "invald _bribeManager!");

        bribeManager = _bribeManager;
    }

    function setBribeCallerFee(uint256 _bribeCallerFee) external onlyOwner {
        require(_bribeCallerFee <= 100, "invalid _bribeCallerFee!");
        bribeCallerFee = _bribeCallerFee;
    }

    function setBribeProtocolFee(uint256 _bribeProtocolFee) external onlyOwner {
        require(_bribeProtocolFee <= 2000, "invalid _bribeProtocolFee!");
        bribeProtocolFee = _bribeProtocolFee;
    }

    function setBribeFeeCollector(
        address _bribeFeeCollector
    ) external onlyOwner {
        require(
            _bribeFeeCollector != address(0),
            "invalid _bribeFeeCollector!"
        );
        bribeFeeCollector = _bribeFeeCollector;
    }

    function addRevenueSharingPool(
        address _revenueSharingPool
    ) external onlyOwner {
        revenueSharingPools.push(_revenueSharingPool);

        emit RevenueSharingPoolAdded(_revenueSharingPool);
    }

    function lockCake(uint256 _lockDays) external override onlyDepositor {}

    // function vote(
    //     address[] calldata _lpVote,
    //     int256[] calldata _deltas,
    //     address[] calldata _rewarders,
    //     address _caller
    // )
    //     external
    //     override
    //     returns (address[][] memory rewardTokens, uint256[][] memory feeAmounts)
    // {
    //     require(msg.sender == bribeManager, "!auth");
    //     uint256 length = _lpVote.length;
    //     require(length == _rewarders.length, "Not good rewarder length");
    //     uint256[][] memory bribeRewards = voter.vote(_lpVote, _deltas);

    //     rewardTokens = new address[][](length);
    //     feeAmounts = new uint256[][](length);

    //     for (uint256 i = 0; i < length; i++) {
    //         uint256[] memory rewardAmounts = bribeRewards[i];
    //         (, , , , , , address bribesContract) = voter.infos(_lpVote[i]);
    //         feeAmounts[i] = new uint256[](rewardAmounts.length);
    //         if (bribesContract != address(0)) {
    //             rewardTokens[i] = _getBribeRewardTokens(bribesContract);
    //             for (uint256 j = 0; j < rewardAmounts.length; j++) {
    //                 uint256 rewardAmount = rewardAmounts[j];
    //                 if (rewardAmount > 0) {
    //                     uint256 protocolFee = bribeFeeCollector != address(0)
    //                         ? rewardAmount.mul(bribeProtocolFee).div(
    //                             FEE_DENOMINATOR
    //                         )
    //                         : 0;
    //                     if (protocolFee > 0) {
    //                         rewardTokens[i][j].safeTransferToken(
    //                             bribeFeeCollector,
    //                             protocolFee
    //                         );
    //                     }
    //                     uint256 callerFee = _caller != address(0)
    //                         ? rewardAmount.mul(bribeCallerFee).div(
    //                             FEE_DENOMINATOR
    //                         )
    //                         : 0;
    //                     if (callerFee != 0) {
    //                         rewardTokens[i][j].safeTransferToken(
    //                             bribeManager,
    //                             callerFee
    //                         );
    //                         feeAmounts[i][j] = callerFee;
    //                     }
    //                     rewardAmount = rewardAmount.sub(protocolFee).sub(
    //                         callerFee
    //                     );

    //                     if (AddressLib.isPlatformToken(rewardTokens[i][j])) {
    //                         IVirtualBalanceRewardPool(_rewarders[i])
    //                             .queueNewRewards{value: rewardAmount}(
    //                             rewardTokens[i][j],
    //                             rewardAmount
    //                         );
    //                     } else {
    //                         _approveTokenIfNeeded(
    //                             rewardTokens[i][j],
    //                             _rewarders[i],
    //                             rewardAmount
    //                         );
    //                         IVirtualBalanceRewardPool(_rewarders[i])
    //                             .queueNewRewards(
    //                                 rewardTokens[i][j],
    //                                 rewardAmount
    //                             );
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     emit Voted(_lpVote, _deltas, _rewarders, _caller);
    // }

    // function pendingRevenueSharingPoolCallerFee(
    //     address[] calldata _pendingPools
    // )
    //     external
    //     view
    //     override
    //     returns (
    //         address[][] memory rewardTokens,
    //         uint256[][] memory callerFeeAmount
    //     )
    // {
    //     // Warning: Arguments do not take into account repeated elements in the pendingPools list
    //     (
    //         address[][] memory bribeTokenAddresses,
    //         ,
    //         uint256[][] memory bribeRewards
    //     ) = voter.pendingBribes(_pendingPools, address(this));
    //     uint256 length = bribeTokenAddresses.length;
    //     rewardTokens = new address[][](length);
    //     callerFeeAmount = new uint256[][](length);
    //     for (uint256 i; i < length; i++) {
    //         rewardTokens[i] = new address[](bribeTokenAddresses[i].length);
    //         callerFeeAmount[i] = new uint256[](bribeTokenAddresses[i].length);
    //         for (uint256 j; j < bribeTokenAddresses[i].length; j++) {
    //             // if rewardToken is 0, native token is used as reward token
    //             if (bribeTokenAddresses[i][j] == address(0)) {
    //                 rewardTokens[i][j] = AddressLib.PLATFORM_TOKEN_ADDRESS;
    //             } else {
    //                 rewardTokens[i][j] = bribeTokenAddresses[i][j];
    //             }
    //             callerFeeAmount[i][j] = bribeRewards[i][j]
    //                 .mul(bribeCallerFee)
    //                 .div(FEE_DENOMINATOR);
    //         }
    //     }
    // }

    function _getRevenueSharingPoolRewardToken(
        address _sharingPool
    ) internal view returns (address) {
        address rewardToken = IRevenueSharingPool(_sharingPool).rewardToken();
        if (rewardToken == address(0)) {
            rewardToken = AddressLib.PLATFORM_TOKEN_ADDRESS;
        }
        return rewardToken;
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
