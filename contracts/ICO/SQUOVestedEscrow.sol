// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/ManagerUpgradeable.sol";

contract SQUOVestedEscrow is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 public constant PRECISION = 1e4;

    IERC20 public token; //SQUO
    IERC20 public purchaseToken; //USDT

    // For pre-seed and private sale it's a whitelist
    // For public sale it's for everyone
    bool public isWhitelist;
    bool public isAllocate;

    uint256 public startTime;
    // initial lock duration in second
    uint256 public lockDuration;
    uint256 public lockPercent;
    // linear release duration in second
    uint256 public releaseDuration;
    uint256 public tokenPrice; //10000 = 0.01 USDT
    uint256 public minBuyAmount;
    uint256 public supply;
    uint256 public sold;

    address purchaseRecipient;

    mapping(address => uint256) public limitAmounts;
    mapping(address => uint256) public totalAmounts;
    mapping(address => uint256) public claimedAmounts;
    mapping(address => bool) public whitelist;

    event Funded(address indexed _recipient, uint256 _amount);
    event Claimed(address indexed _recipient, uint256 _amount);
    event UserBought(address indexed _user, uint256 _amount);
    event TransferToAnotherAddress(address oldAddr, address newAddr);

    function initialize(
        address _token,
        uint256 _startTime,
        uint256 _lockDuration,
        uint256 _lockPercent,
        uint256 _releaseDuration,
        address _purchaseToken,
        uint256 _tokenPrice,
        uint256 _minBuyAmount,
        address _purchaseRecipient,
        bool _isWhitelist,
        bool _isAllocate
    ) public initializer {
        __Ownable_init();

        require(_token != address(0), "invalid _token!");
        require(_lockPercent <= PRECISION, "invalid _lockPercent!");
        require(_releaseDuration > 0, "invalid _releaseDuration!");
        require(_tokenPrice > 0, "invalid _tokenPrice");
        require(_purchaseToken != address(0), "invalid _purchaseToken");
        require(
            _purchaseRecipient != address(0),
            "!invalid _purchaseRecipient"
        );

        token = IERC20(_token);
        startTime = _startTime;
        lockDuration = _lockDuration;
        lockPercent = _lockPercent;
        releaseDuration = _releaseDuration;
        purchaseToken = IERC20(_purchaseToken);
        tokenPrice = _tokenPrice;
        purchaseRecipient = _purchaseRecipient;
        minBuyAmount = _minBuyAmount;
        isWhitelist = _isWhitelist;
        isAllocate = _isAllocate;
        sold = 0;
    }

    function addWhitelist(address[] calldata _users) external onlyManager {
        for (uint i = 0; i < _users.length; i++) {
            whitelist[_users[i]] = true;
        }
    }

    function removeWhiteList(address[] calldata _users) external onlyManager {
        for (uint i = 0; i < _users.length; i++) {
            delete whitelist[_users[i]];
        }
    }

    //to change the address receive payment
    function setRecipient(address _recipient) external onlyManager {
        require(_recipient != address(0), "!invalid _recipient");
        purchaseRecipient = _recipient;
    }

    //For private sale only
    // Whitelists will have a precise allocation per user
    function fund(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external onlyManager {
        require(
            _recipients.length == _amounts.length && _recipients.length > 0,
            "invalid _recipients or _amounts"
        );
        require(isAllocate, "fund all instead!");
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];
            require(recipient != address(0), "invalid recipient!");
            require(amount != 0, "invalid amount!");
            require(totalAmounts[recipient] == 0, "recipient already funded!");
            limitAmounts[recipient] = amount;
            totalAmount = totalAmount.add(amount);
            whitelist[recipient] = true;
            supply = supply.add(amount);
            emit Funded(recipient, amount);
        }

        token.safeTransferFrom(msg.sender, address(this), totalAmount);
    }

    //For pre-seed it's for whitelisted user
    //For public sale it's for everyone
    function fundAll(uint256 _supply) external onlyManager {
        require(!isAllocate, "allocate each user!");
        token.safeTransferFrom(msg.sender, address(this), _supply);
        supply = supply.add(_supply);
    }

    function changeVestingAddr(
        address oldAddr,
        address newAddr
    ) public onlyManager {
        require(totalAmounts[oldAddr] > 0, "Need user have amount");

        require(
            totalAmounts[newAddr] == 0,
            "New addr need to dont have any reward"
        );

        totalAmounts[newAddr] = totalAmounts[oldAddr];
        claimedAmounts[newAddr] = claimedAmounts[oldAddr];

        totalAmounts[oldAddr] = 0;
        claimedAmounts[oldAddr] = 0;

        emit TransferToAnotherAddress(oldAddr, newAddr);
    }

    /// @notice to withdraw remaining token funded but not sold out
    function withdraw() external onlyManager {
        uint256 endTime = startTime.add(lockDuration).add(releaseDuration);
        require(block.timestamp >= endTime, "can not withdraw this time");
        uint256 balance = IERC20(purchaseToken).balanceOf(address(this));
        IERC20(purchaseToken).transfer(msg.sender, balance);
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

    function buy(uint256 _usdAmount) external {
        uint256 tokenAmount = _usdAmount.mul(10 ** 18).div(tokenPrice);
        if (isWhitelist) {
            require(whitelist[msg.sender], "not in whitelist");
        }
        if (isAllocate) {
            require(
                tokenAmount <= limitAmounts[msg.sender],
                "buy exceeds limit!"
            );
        }
        require(block.timestamp < startTime, "can not buy this time!");
        require(_usdAmount >= minBuyAmount, "insufficient purchase amount!");
        sold = sold.add(tokenAmount);
        require(sold <= supply, "buy exceeds supply!");

        IERC20(purchaseToken).transferFrom(
            msg.sender,
            purchaseRecipient,
            _usdAmount
        );

        totalAmounts[msg.sender] = totalAmounts[msg.sender].add(tokenAmount);
        emit UserBought(msg.sender, tokenAmount);
    }
}
