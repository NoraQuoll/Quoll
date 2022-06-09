// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IWombatVoterProxy.sol";
import "./Interfaces/Wombat/IMasterWombat.sol";
import "./Interfaces/Wombat/IVeWom.sol";

contract WombatVoterProxy is IWombatVoterProxy, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public wom;
    IMasterWombat public masterWombat;
    address public veWom;

    address public booster;
    address public depositor;

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

        masterWombat = IMasterWombat(_masterWombat);
        wom = masterWombat.wom();
        veWom = masterWombat.veWom();

        booster = _booster;
        depositor = _depositor;

        emit BoosterUpdated(_booster);
        emit DepositorUpdated(_depositor);
    }

    function getLpToken(uint256 _pid) external view override returns (address) {
        (address token, , , , , , ) = masterWombat.poolInfo(_pid);
        return token;
    }

    function getBonusToken(uint256 _pid)
        external
        view
        override
        returns (address)
    {
        (address bonusTokenAddress, ) = masterWombat.rewarderBonusTokenInfo(
            _pid
        );
        return bonusTokenAddress;
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
        (address bonusTokenAddress, ) = masterWombat.rewarderBonusTokenInfo(
            _pid
        );
        // call deposit with _amount == 0 to claim current rewards
        masterWombat.deposit(_pid, 0);
        uint256 _balance = IERC20(wom).balanceOf(address(this));
        IERC20(wom).safeTransfer(booster, _balance);

        uint256 bonusTokenBalance = 0;
        if (bonusTokenAddress != address(0)) {
            bonusTokenBalance = IERC20(bonusTokenAddress).balanceOf(
                address(this)
            );

            IERC20(bonusTokenAddress).safeTransfer(booster, bonusTokenBalance);
        }

        emit RewardsClaimed(
            _pid,
            _balance,
            bonusTokenAddress,
            bonusTokenBalance
        );
    }

    function balanceOfPool(uint256 _pid)
        public
        view
        override
        returns (uint256)
    {
        (uint256 amount, , ) = masterWombat.userInfo(_pid, address(this));
        return amount;
    }

    function lockWom(uint256 _lockDays) external override onlyDepositor {
        uint256 balance = IERC20(wom).balanceOf(address(this));

        IERC20(wom).safeApprove(veWom, 0);
        IERC20(wom).safeApprove(veWom, balance);

        IVeWom(veWom).mint(balance, _lockDays);

        emit WomLocked(balance, _lockDays);
    }

    function unlockWom(uint256 _slot) external onlyOwner {
        IVeWom(veWom).burn(_slot);

        emit WomUnlocked(_slot);
    }

    function execute(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external override onlyBooster returns (bool, bytes memory) {
        (bool success, bytes memory result) = _to.call{value: _value}(_data);

        return (success, result);
    }
}
