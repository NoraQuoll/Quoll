// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IVirtualBalanceRewardPool.sol";
import "./Interfaces/IWombatVoterProxy.sol";
import "./Interfaces/Wombat/IBribe.sol";
import "./Interfaces/Wombat/IMasterWombatV2.sol";
import "./Interfaces/Wombat/IVeWom.sol";
import "./Interfaces/Wombat/IVoter.sol";
import "@shared/lib-contracts/contracts/Dependencies/TransferHelper.sol";

contract WombatVoterProxy is IWombatVoterProxy, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using TransferHelper for address;

    address public wom;
    IMasterWombatV2 public masterWombat;
    address public veWom;

    address public booster;
    address public depositor;

    IVoter public voter;
    address public bribeManager;
    uint256 constant FEE_DENOMINATOR = 10000;
    uint256 public bribeCallerFee;
    uint256 public bribeProtocolFee;
    address public bribeFeeCollector;

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
        address _masterWombat,
        address _booster,
        address _depositor
    ) external onlyOwner {
        require(booster == address(0), "!init");

        require(_masterWombat != address(0), "invalid _masterWombat!");
        require(_booster != address(0), "invalid _booster!");
        require(_depositor != address(0), "invalid _depositor!");

        masterWombat = IMasterWombatV2(_masterWombat);
        wom = masterWombat.wom();
        veWom = masterWombat.veWom();

        booster = _booster;
        depositor = _depositor;

        emit BoosterUpdated(_booster);
        emit DepositorUpdated(_depositor);
    }

    function setVoter(address _voter) external onlyOwner {
        require(_voter != address(0), "invalid _voter!");

        voter = IVoter(_voter);
    }

    function setBribeManager(address _bribeManager) external onlyOwner {
        require(_bribeManager != address(0), "invald _bribeManager!");

        bribeManager = _bribeManager;
    }

    function setBribeCallerFee(uint256 _bribeCallerFee) external onlyOwner {
        require(_bribeCallerFee < FEE_DENOMINATOR, "invalid _bribeCallerFee!");
        bribeCallerFee = _bribeCallerFee;
    }

    function setBribeProtocolFee(uint256 _bribeProtocolFee) external onlyOwner {
        require(
            _bribeProtocolFee < FEE_DENOMINATOR,
            "invalid _bribeProtocolFee!"
        );
        bribeProtocolFee = _bribeProtocolFee;
    }

    function setBribeFeeCollector(address _bribeFeeCollector)
        external
        onlyOwner
    {
        require(
            _bribeFeeCollector != address(0),
            "invalid _bribeFeeCollector!"
        );
        bribeFeeCollector = _bribeFeeCollector;
    }

    function getLpToken(uint256 _pid) external view override returns (address) {
        (address token, , , , , , ) = masterWombat.poolInfo(_pid);
        return token;
    }

    function getBonusTokens(uint256 _pid)
        public
        view
        override
        returns (address[] memory)
    {
        (address[] memory bonusTokenAddresses, ) = masterWombat
            .rewarderBonusTokenInfo(_pid);
        for (uint256 i = 0; i < bonusTokenAddresses.length; i++) {
            if (bonusTokenAddresses[i] == address(0)) {
                // bnb
                bonusTokenAddresses[i] = AddressLib.PLATFORM_TOKEN_ADDRESS;
            }
        }
        return bonusTokenAddresses;
    }

    function deposit(uint256 _pid, uint256 _amount)
        external
        override
        onlyBooster
    {
        (address token, , , , , , ) = masterWombat.poolInfo(_pid);
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= _amount, "insufficient balance");

        IERC20(token).safeApprove(address(masterWombat), 0);
        IERC20(token).safeApprove(address(masterWombat), balance);
        masterWombat.deposit(_pid, balance);
        _claimRewards(_pid);

        emit Deposited(_pid, balance);
    }

    // Withdraw partial funds
    function withdraw(uint256 _pid, uint256 _amount)
        public
        override
        onlyBooster
    {
        (address token, , , , , , ) = masterWombat.poolInfo(_pid);
        uint256 _balance = IERC20(token).balanceOf(address(this));
        if (_balance < _amount) {
            masterWombat.withdraw(_pid, _amount.sub(_balance));
            _claimRewards(_pid);
        }
        IERC20(token).safeTransfer(booster, _amount);

        emit Withdrawn(_pid, _amount);
    }

    function withdrawAll(uint256 _pid) external override onlyBooster {
        (address token, , , , , , ) = masterWombat.poolInfo(_pid);
        uint256 amount = balanceOfPool(_pid).add(
            IERC20(token).balanceOf(address(this))
        );
        withdraw(_pid, amount);
    }

    function claimRewards(uint256 _pid) external override onlyBooster {
        // call deposit with _amount == 0 to claim current rewards
        masterWombat.deposit(_pid, 0);

        _claimRewards(_pid);
    }

    // send claimed rewards to booster
    function _claimRewards(uint256 _pid) internal {
        address[] memory bonusTokenAddresses = getBonusTokens(_pid);
        uint256 _balance = IERC20(wom).balanceOf(address(this));
        IERC20(wom).safeTransfer(booster, _balance);
        emit RewardsClaimed(_pid, _balance);

        for (uint256 i = 0; i < bonusTokenAddresses.length; i++) {
            address bonusTokenAddress = bonusTokenAddresses[i];
            uint256 bonusTokenBalance = TransferHelper.balanceOf(
                bonusTokenAddress,
                address(this)
            );
            if (bonusTokenBalance == 0) {
                continue;
            }
            bonusTokenAddress.safeTransferToken(booster, bonusTokenBalance);

            emit BonusRewardsClaimed(
                _pid,
                bonusTokenAddress,
                bonusTokenBalance
            );
        }
    }

    function balanceOfPool(uint256 _pid)
        public
        view
        override
        returns (uint256)
    {
        (uint256 amount, , , ) = masterWombat.userInfo(_pid, address(this));
        return amount;
    }

    function lockWom(uint256 _lockDays) external override onlyDepositor {
        uint256 balance = IERC20(wom).balanceOf(address(this));

        if (balance == 0) {
            return;
        }

        IERC20(wom).safeApprove(veWom, 0);
        IERC20(wom).safeApprove(veWom, balance);

        IVeWom(veWom).mint(balance, _lockDays);

        emit WomLocked(balance, _lockDays);
    }

    function unlockWom(uint256 _slot) external onlyOwner {
        IVeWom(veWom).burn(_slot);

        emit WomUnlocked(_slot);
    }

    function vote(
        address[] calldata _lpVote,
        int256[] calldata _deltas,
        address[] calldata _rewarders,
        address _caller
    )
        external
        override
        returns (address[][] memory rewardTokens, uint256[][] memory feeAmounts)
    {
        require(msg.sender == bribeManager, "!auth");
        uint256 length = _lpVote.length;
        require(length == _rewarders.length, "Not good rewarder length");
        uint256[][] memory bribeRewards = voter.vote(_lpVote, _deltas);

        rewardTokens = new address[][](length);
        feeAmounts = new uint256[][](length);

        for (uint256 i = 0; i < length; i++) {
            uint256[] memory rewardAmounts = bribeRewards[i];
            (, , , , , , address bribesContract) = voter.infos(_lpVote[i]);
            feeAmounts[i] = new uint256[](rewardAmounts.length);
            if (bribesContract != address(0)) {
                rewardTokens[i] = IBribe(bribesContract).rewardTokens();
                for (uint256 j = 0; j < rewardAmounts.length; j++) {
                    uint256 rewardAmount = rewardAmounts[j];
                    if (rewardAmount > 0) {
                        uint256 protocolFee = rewardAmount
                            .mul(bribeProtocolFee)
                            .div(FEE_DENOMINATOR);
                        if (protocolFee > 0) {
                            IERC20(rewardTokens[i][j]).safeTransfer(
                                bribeFeeCollector,
                                protocolFee
                            );
                        }
                        if (_caller != address(0) && bribeCallerFee != 0) {
                            uint256 feeAmount = rewardAmount
                                .mul(bribeCallerFee)
                                .div(FEE_DENOMINATOR);
                            IERC20(rewardTokens[i][j]).safeTransfer(
                                bribeManager,
                                feeAmount
                            );
                            rewardAmount -= feeAmount;
                            feeAmounts[i][j] = feeAmount;
                        }
                        rewardAmount -= protocolFee;
                        _approveTokenIfNeeded(
                            rewardTokens[i][j],
                            _rewarders[i],
                            rewardAmount
                        );
                        IVirtualBalanceRewardPool(_rewarders[i])
                            .queueNewRewards(rewardTokens[i][j], rewardAmount);
                    }
                }
            }
        }

        emit Voted(_lpVote, _deltas, _rewarders, _caller);
    }

    function pendingBribeCallerFee(address[] calldata _pendingPools)
        external
        view
        override
        returns (
            address[][] memory rewardTokens,
            uint256[][] memory callerFeeAmount
        )
    {
        // Warning: Arguments do not take into account repeated elements in the pendingPools list
        uint256[][] memory pending = voter.pendingBribes(
            _pendingPools,
            address(this)
        );
        uint256 length = pending.length;
        rewardTokens = new address[][](length);
        callerFeeAmount = new uint256[][](length);
        for (uint256 i; i < length; i++) {
            (, , , , , , address bribesContract) = voter.infos(
                _pendingPools[i]
            );
            rewardTokens[i] = IBribe(bribesContract).rewardTokens();
            callerFeeAmount[i] = new uint256[](rewardTokens[i].length);
            for (uint256 j; j < pending[i].length; j++) {
                callerFeeAmount[i][j] = pending[i][j].mul(bribeCallerFee).div(
                    FEE_DENOMINATOR
                );
            }
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
