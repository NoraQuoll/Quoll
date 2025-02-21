// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/SWPX/ISWPxVoterProxy.sol";
import "./Interfaces/SWPX/IRevenueSharingPool.sol";
import "./Interfaces/Pancake/IMasterChef.sol";
import "./Interfaces/SWPX/IVotingEscrowV1_1.sol";

import "./lib/TransferHelper.sol";

contract SWPxVoterProxy is ISWPxVoterProxy, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public swpx;
    IMasterChefV2 public masterChef;
    address public veSWPx;

    address public booster;
    address public depositor;

    address public bribeManager;
    uint256 constant FEE_DENOMINATOR = 10000;
    uint256 public bribeCallerFee;
    uint256 public bribeProtocolFee;
    address public bribeFeeCollector;

    address[] public revenueSharingPools;

    uint256 lockedTokenId = 0;

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

    function lockSWPx(uint256 _lockDays) external override {
        uint256 balance = IERC20(swpx).balanceOf(address(this));
        if (balance == 0) return;

        IERC20(swpx).safeApprove(veSWPx, 0);
        IERC20(swpx).safeApprove(veSWPx, balance);

        // check is lock if created
        if (lockedTokenId == 0){
            (uint256 newTokenId, ) = IVotingEscrowV1_1(veSWPx)
            .create_lock(balance, _lockDays * 86400);
            lockedTokenId = newTokenId;
        }
        else {
            IVotingEscrowV1_1(veSWPx).deposit_for(lockedTokenId, balance);
            IVotingEscrowV1_1(veSWPx).increase_unlock_time(lockedTokenId,  _lockDays * 86400 );
        }
      
    }

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
