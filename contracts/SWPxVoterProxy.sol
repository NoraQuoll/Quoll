// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./Interfaces/SWPX/ISWPxVoterProxy.sol";
import "./Interfaces/SWPX/IRevenueSharingPool.sol";
import "./Interfaces/Pancake/IMasterChef.sol";
import "./Interfaces/SWPX/IVotingEscrowV1_1.sol";
import "./Interfaces/ISwapXVoterV3.sol";

import "./lib/TransferHelper.sol";

contract SWPxVoterProxy is
    ISWPxVoterProxy,
    IERC721Receiver,
    OwnableUpgradeable
{
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
    uint256 nextIncreaseUnlockAt;

    // 7 days, to use as denominator in lock calculation
    uint256 private constant WEEK = 604800;
    // 2 years
    uint256 private constant MAX_LOCK_DURATION = 63_072_000; // 2 years
    address public constant VOTER_V3 =
        0xC1AE2779903cfB84CB9DEe5c03EcEAc32dc407F2;

    event SWPxLockMinted(uint256 tokenId);
    event SWPxLocked(uint256 amount);
    event SWPxLockDurationIncreased(uint256 lockedUntil);
    event veSWPxReceived(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );

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
        address _swpx,
        address _veSWPx,
        address _booster,
        address _depositor
    ) external onlyOwner {
        require(booster == address(0), "!init");

        // require(_masterChef != address(0), "invalid _masterChef!");
        require(_swpx != address(0), "invalid _cake!");
        // require(_veSWPx != address(0), "invalid _veSWPx!");
        // require(_booster != address(0), "invalid _booster!");
        require(_depositor != address(0), "invalid _depositor!");

        masterChef = IMasterChefV2(_masterChef);
        swpx = _swpx;
        veSWPx = _veSWPx;

        booster = _booster;
        depositor = _depositor;

        emit BoosterUpdated(_booster);
        emit DepositorUpdated(_depositor);
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

    function lockSWPx(uint256 _lockDays) external override onlyDepositor {
        uint256 balance = IERC20(swpx).balanceOf(address(this));
        if (balance == 0) return;

        IERC20(swpx).approve(veSWPx, 0);
        IERC20(swpx).approve(veSWPx, balance);

        //check is lock if created
        if (lockedTokenId == 0) {
            // // First time deposit: need to create a new lock, this will mint a new NFT and we save the token id
            (uint256 newTokenId, ) = IVotingEscrowV1_1(veSWPx).create_lock(
                balance,
                MAX_LOCK_DURATION
            );
            lockedTokenId = newTokenId;
            // Will relock in one week
            nextIncreaseUnlockAt = ((block.timestamp + WEEK) / WEEK) * WEEK;
            emit SWPxLockMinted(lockedTokenId);
            emit SWPxLocked(balance);
        } else {
            // Lock expired? (no deposits for 2 years?)

            if (
                block.timestamp >
                IVotingEscrowV1_1(veSWPx).locked__end(lockedTokenId)
            ) {
                IVotingEscrowV1_1(veSWPx).withdraw(lockedTokenId);
                balance = IERC20(swpx).balanceOf(address(this));
                //create a new lock
                (lockedTokenId, ) = IVotingEscrowV1_1(veSWPx).create_lock(
                    balance,
                    MAX_LOCK_DURATION
                );
                // will relock in one week
                nextIncreaseUnlockAt = ((block.timestamp + WEEK) / WEEK) * WEEK;

                emit SWPxLockMinted(lockedTokenId);
                emit SWPxLocked(balance);
            } else {
                // Increase lock amount
                IVotingEscrowV1_1(veSWPx).increase_amount(
                    lockedTokenId,
                    balance
                );
                emit SWPxLocked(balance);
                // Lock is still active, just increase the lock duration
                if (
                    ((block.timestamp + MAX_LOCK_DURATION) / WEEK) * WEEK >
                    IVotingEscrowV1_1(veSWPx).locked__end(lockedTokenId)
                ) {
                    IVotingEscrowV1_1(veSWPx).increase_unlock_time(
                        lockedTokenId,
                        MAX_LOCK_DURATION
                    );
                    // SWPx rounds the lock down to the week
                    emit SWPxLockDurationIncreased(
                        ((block.timestamp + MAX_LOCK_DURATION) / WEEK) * WEEK
                    );
                    // Once a week, increase the lock
                    nextIncreaseUnlockAt =
                        ((block.timestamp + WEEK) / WEEK) *
                        WEEK;
                }
            }
        }
    }

    function setApporval(address _operator, bool _approved) external onlyOwner {
        IVotingEscrowV1_1(veSWPx).setApprovalForAll(_operator, _approved);
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

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        require(msg.sender == veSWPx, "Only accept veSWPx NFTs");
        emit veSWPxReceived(operator, from, tokenId, data);

        if (lockedTokenId == 0) {
            lockedTokenId = tokenId;
            emit SWPxLockMinted(lockedTokenId);
        } else {
            IVotingEscrowV1_1(veSWPx).merge(tokenId, lockedTokenId);
        }
        return this.onERC721Received.selector;
    }

    //claims function

    /// @notice claim bribes rewards given a TokenID
    function claimBribes(
        address[] memory _bribes,
        address[][] memory _tokens
    ) external onlyOwner {
        require(lockedTokenId != 0, "can not claim without lockedTokenId");
        ISwapXVoterV3(VOTER_V3).claimBribes(_bribes, _tokens, lockedTokenId);
    }

    /// @notice claim fees rewards given a TokenID
    function claimFees(
        address[] memory _fees,
        address[][] memory _tokens
    ) external onlyOwner {
        require(lockedTokenId != 0, "can not claim without lockedTokenId");
        ISwapXVoterV3(VOTER_V3).claimFees(_fees, _tokens, lockedTokenId);
    }

    function deployerClaimReward(
        address[] memory _tokens,
        uint256[] memory amounts
    ) external onlyOwner {
        for (uint256 i = 0; i < _tokens.length; i++) {
            IERC20(_tokens[i]).transfer(msg.sender, amounts[i]);
        }
    }

    function transferLockedNFT( address _recipient) external onlyOwner{
        require(lockedTokenId != 0, "no NFT to transfer");
        ISwapXVoterV3(VOTER_V3).reset(lockedTokenId); //reset vote to
        IVotingEscrowV1_1(veSWPx).safeTransferFrom(address(this), _recipient, lockedTokenId);
        lockedTokenId = 0; 
    }
}
