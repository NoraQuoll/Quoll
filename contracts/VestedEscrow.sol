// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./lib/ManagerUpgradeable.sol";

contract VestedEscrow is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 public constant PRECISION = 1e4;

    IERC20 public token;

    uint256 public startTime;
    // initial lock duration in second
    uint256 public lockDuration;
    uint256 public lockPercent;
    // linear release duration in second
    uint256 public releaseDuration;

    mapping(address => uint256) public totalAmounts;
    mapping(address => uint256) public claimedAmounts;

    event Funded(address indexed _recipient, uint256 _amount);
    event Claimed(address indexed _recipient, uint256 _amount);

    function initialize(
        address _token,
        uint256 _startTime,
        uint256 _lockDuration,
        uint256 _lockPercent,
        uint256 _releaseDuration
    ) public initializer {
        __Ownable_init();

        require(_token != address(0), "invalid _token!");
        require(_lockPercent <= PRECISION, "invalid _lockPercent!");
        require(_releaseDuration > 0, "invalid _releaseDuration!");

        token = IERC20(_token);
        startTime = _startTime;
        lockDuration = _lockDuration;
        lockPercent = _lockPercent;
        releaseDuration = _releaseDuration;
    }

    function fund(address[] calldata _recipients, uint256[] calldata _amounts)
        external
        onlyManager
    {
        require(
            _recipients.length == _amounts.length && _recipients.length > 0,
            "invalid _recipients or _amounts"
        );
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];
            require(recipient != address(0), "invalid recipient!");
            require(amount != 0, "invalid amount!");
            require(totalAmounts[recipient] == 0, "recipient already funded!");
            totalAmounts[recipient] = amount;
            totalAmount = totalAmount.add(amount);

            emit Funded(recipient, amount);
        }

        token.safeTransferFrom(msg.sender, address(this), totalAmount);
    }

    function getClaimableAmount(address _user) public view returns (uint256) {
        // lock duration has not passed yet
        if (block.timestamp < startTime + lockDuration) {
            return 0;
        }
        uint256 totalAmount = totalAmounts[_user];
        if (totalAmount == 0) {
            return 0;
        }
        uint256 claimedAmount = claimedAmounts[_user];
        if (claimedAmount >= totalAmount) {
            return 0;
        }
        uint256 lockedAmount = lockPercent.mul(totalAmount).div(PRECISION);
        uint256 unlockedAmount = totalAmount.sub(lockedAmount);
        if (unlockedAmount == 0) {
            return lockedAmount;
        }
        uint256 elapsed = Math.min(
            releaseDuration,
            block.timestamp - startTime - lockDuration
        );
        uint256 releasedAmount = unlockedAmount.mul(elapsed).div(
            releaseDuration
        );
        return
            Math.min(
                lockedAmount.add(releasedAmount).sub(claimedAmount),
                totalAmount.sub(claimedAmount)
            );
    }

    function claim() external {
        uint256 claimableAmount = getClaimableAmount(msg.sender);
        if (claimableAmount == 0) {
            return;
        }

        claimedAmounts[msg.sender] = claimedAmounts[msg.sender].add(
            claimableAmount
        );
        token.safeTransfer(msg.sender, claimableAmount);

        emit Claimed(msg.sender, claimableAmount);
    }
}
