// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IWombatBooster.sol";
import "./Interfaces/IWombatVoterProxy.sol";
import "./Interfaces/IDepositToken.sol";
import "./Interfaces/IQuollToken.sol";
import "./Interfaces/IBaseRewardPool.sol";

contract WombatBooster is IWombatBooster, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public wom;

    uint256 public lockIncentive; //incentive to wom stakers
    uint256 public stakerIncentive; //incentive to native token stakers
    uint256 public platformFee; //possible fee to build treasury
    uint256 public constant MaxFees = 2000;
    uint256 public constant FEE_DENOMINATOR = 10000;

    address public voterProxy;
    address public quo;
    address public treasury;
    address public stakerRewards; //quo rewards
    address public lockRewards; //qWom rewards(wom)

    bool public isShutdown;

    struct PoolInfo {
        address lptoken;
        address token;
        uint256 masterWombatPid;
        address rewardPool;
        bool shutdown;
    }

    //index(pid) -> pool
    PoolInfo[] public override poolInfo;

    function initialize() public initializer {
        __Ownable_init();
    }

    /// SETTER SECTION ///

    function setParams(
        address _wom,
        address _voterProxy,
        address _quo,
        address _stakerRewards,
        address _lockRewards,
        address _treasury
    ) external onlyOwner {
        require(voterProxy == address(0), "params has already been set");

        isShutdown = false;

        wom = _wom;

        voterProxy = _voterProxy;
        quo = _quo;

        stakerRewards = _stakerRewards;
        lockRewards = _lockRewards;

        treasury = _treasury;

        lockIncentive = 1000;
        stakerIncentive = 450;
        platformFee = 0;
    }

    function setFees(
        uint256 _lockFees,
        uint256 _stakerFees,
        uint256 _platform
    ) external onlyOwner {
        uint256 total = _lockFees.add(_stakerFees).add(_platform);
        require(total <= MaxFees, ">MaxFees");

        //values must be within certain ranges
        if (
            _lockFees >= 1000 &&
            _lockFees <= 1500 &&
            _stakerFees >= 300 &&
            _stakerFees <= 600 &&
            _platform <= 200
        ) {
            lockIncentive = _lockFees;
            stakerIncentive = _stakerFees;
            platformFee = _platform;
        }
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /// END SETTER SECTION ///

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    //create a new pool
    function addPool(
        uint256 _masterWombatPid,
        address _token,
        address _rewardPool
    ) external onlyOwner returns (bool) {
        require(!isShutdown, "!add");

        //the next pool's pid
        uint256 pid = poolInfo.length;

        // config wom rewards
        IBaseRewardPool(_rewardPool).setParams(address(this), pid, _token, wom);

        //add the new pool
        poolInfo.push(
            PoolInfo({
                lptoken: IWombatVoterProxy(voterProxy).getLpToken(
                    _masterWombatPid
                ),
                token: _token,
                masterWombatPid: _masterWombatPid,
                rewardPool: _rewardPool,
                shutdown: false
            })
        );
        return true;
    }

    //shutdown pool
    function shutdownPool(uint256 _pid) external onlyOwner returns (bool) {
        PoolInfo storage pool = poolInfo[_pid];

        //withdraw from gauge
        try
            IWombatVoterProxy(voterProxy).withdrawAll(pool.masterWombatPid)
        {} catch {}

        pool.shutdown = true;
        return true;
    }

    //shutdown this contract.
    //  unstake and pull all lp tokens to this address
    //  only allow withdrawals
    function shutdownSystem() external onlyOwner {
        isShutdown = true;

        for (uint256 i = 0; i < poolInfo.length; i++) {
            PoolInfo storage pool = poolInfo[i];
            if (pool.shutdown) {
                continue;
            }

            //withdraw from gauge
            try
                IWombatVoterProxy(voterProxy).withdrawAll(pool.masterWombatPid)
            {
                pool.shutdown = true;
            } catch {}
        }
    }

    //deposit lp tokens and stake
    function deposit(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) public returns (bool) {
        require(!isShutdown, "shutdown");
        PoolInfo memory pool = poolInfo[_pid];
        require(pool.shutdown == false, "pool is closed");

        //send to proxy to stake
        address lptoken = pool.lptoken;
        IERC20(lptoken).safeTransferFrom(msg.sender, voterProxy, _amount);

        //stake
        IWombatVoterProxy(voterProxy).deposit(pool.masterWombatPid, _amount);

        // rewards are claimed when depositing
        _earmarkRewards(_pid);

        address token = pool.token;
        if (_stake) {
            //mint here and send to rewards on user behalf
            IDepositToken(token).mint(address(this), _amount);
            address rewardContract = pool.rewardPool;
            IERC20(token).safeApprove(rewardContract, 0);
            IERC20(token).safeApprove(rewardContract, _amount);
            IBaseRewardPool(rewardContract).stakeFor(msg.sender, _amount);
        } else {
            //add user balance directly
            IDepositToken(token).mint(msg.sender, _amount);
        }

        emit Deposited(msg.sender, _pid, _amount);
        return true;
    }

    //deposit all lp tokens and stake
    function depositAll(uint256 _pid, bool _stake) external returns (bool) {
        address lptoken = poolInfo[_pid].lptoken;
        uint256 balance = IERC20(lptoken).balanceOf(msg.sender);
        deposit(_pid, balance, _stake);
        return true;
    }

    //withdraw lp tokens
    function _withdraw(
        uint256 _pid,
        uint256 _amount,
        address _from,
        address _to
    ) internal {
        PoolInfo memory pool = poolInfo[_pid];
        address lptoken = pool.lptoken;

        //remove lp balance
        address token = pool.token;
        IDepositToken(token).burn(_from, _amount);

        //pull from gauge if not shutdown
        // if shutdown tokens will be in this contract
        if (!pool.shutdown) {
            IWombatVoterProxy(voterProxy).withdraw(
                pool.masterWombatPid,
                _amount
            );
            // rewards are claimed when withdrawing
            _earmarkRewards(_pid);
        }

        //return lp tokens
        IERC20(lptoken).safeTransfer(_to, _amount);

        emit Withdrawn(_to, _pid, _amount);
    }

    //withdraw lp tokens
    function withdraw(uint256 _pid, uint256 _amount) public returns (bool) {
        _withdraw(_pid, _amount, msg.sender, msg.sender);
        return true;
    }

    //withdraw all lp tokens
    function withdrawAll(uint256 _pid) public returns (bool) {
        address token = poolInfo[_pid].token;
        uint256 userBal = IERC20(token).balanceOf(msg.sender);
        withdraw(_pid, userBal);
        return true;
    }

    //allow reward contracts to send here and withdraw to user
    function withdrawTo(
        uint256 _pid,
        uint256 _amount,
        address _to
    ) external override {
        address rewardContract = poolInfo[_pid].rewardPool;
        require(msg.sender == rewardContract, "!auth");

        _withdraw(_pid, _amount, msg.sender, _to);
    }

    //claim wom and extra rewards and disperse to reward contracts
    function _earmarkRewards(uint256 _pid) internal {
        PoolInfo memory pool = poolInfo[_pid];
        require(pool.shutdown == false, "pool is closed");

        //claim wom and bonus token rewards
        IWombatVoterProxy(voterProxy).claimRewards(_pid);

        //wom balance
        uint256 womBal = IERC20(wom).balanceOf(address(this));
        emit WomClaimed(_pid, womBal);

        if (womBal > 0) {
            uint256 _lockIncentive = womBal.mul(lockIncentive).div(
                FEE_DENOMINATOR
            );
            uint256 _stakerIncentive = womBal.mul(stakerIncentive).div(
                FEE_DENOMINATOR
            );

            //send treasury
            if (
                treasury != address(0) &&
                treasury != address(this) &&
                platformFee > 0
            ) {
                //only subtract after address condition check
                uint256 _platform = womBal.mul(platformFee).div(
                    FEE_DENOMINATOR
                );
                womBal = womBal.sub(_platform);
                IERC20(wom).safeTransfer(treasury, _platform);
            }

            //remove incentives from balance
            womBal = womBal.sub(_lockIncentive).sub(_stakerIncentive);

            //send wom to lp provider reward contract
            address rewardContract = pool.rewardPool;
            IERC20(wom).safeTransfer(rewardContract, womBal);
            IRewards(rewardContract).queueNewRewards(wom, womBal);

            //check if there are extra rewards
            address bonusToken = IWombatVoterProxy(voterProxy).getBonusToken(
                pool.masterWombatPid
            );
            if (bonusToken != address(0) && bonusToken != wom) {
                uint256 bonusTokenBalance = IERC20(bonusToken).balanceOf(
                    address(this)
                );
                IERC20(bonusToken).safeTransfer(
                    rewardContract,
                    bonusTokenBalance
                );
                IRewards(rewardContract).queueNewRewards(
                    bonusToken,
                    bonusTokenBalance
                );
            }

            //send lockers' share of wom to reward contract
            IERC20(wom).safeTransfer(lockRewards, _lockIncentive);
            IRewards(lockRewards).queueNewRewards(wom, _lockIncentive);

            //send stakers's share of wom to reward contract
            IERC20(wom).safeTransfer(stakerRewards, _stakerIncentive);
            IRewards(stakerRewards).queueNewRewards(wom, _stakerIncentive);
        }
    }

    function earmarkRewards(uint256 _pid) external returns (bool) {
        require(!isShutdown, "shutdown");
        _earmarkRewards(_pid);
        return true;
    }

    //callback from reward contract when wom is received.
    function rewardClaimed(
        uint256 _pid,
        address _account,
        address _token,
        uint256 _amount
    ) external override {
        address rewardContract = poolInfo[_pid].rewardPool;
        require(
            msg.sender == rewardContract || msg.sender == lockRewards,
            "!auth"
        );

        if (_token != wom || isShutdown) {
            return;
        }

        //mint reward tokens
        IQuollToken(quo).mint(_account, _amount);
    }
}
