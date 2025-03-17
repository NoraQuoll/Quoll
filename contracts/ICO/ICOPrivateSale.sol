// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/ManagerUpgradeable.sol";

/// @notice In private sale, whitelists will have a precise allocation per user
contract ICOPrivateSale is ManagerUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 public usdt; //USDT

    uint256 public tokenPrice; //10000 = 0.01 USDT
    uint256 public minBuyAmount;

    uint256 public sold;

    //user can buy in this period
    uint256 public startTime; 
    uint256 public endTime;

    address recipient; //receive payment

    mapping(address => uint256) public limitAmounts;
    mapping(address => uint256) public totalAmounts;
    event UserBought(address indexed _user, uint256 _amount);

      function initialize(
        address _usdt,
        uint256 _tokenPrice,
        uint256 _minBuyAmount,
        uint256 _startTime,
        uint256 _endTime,
        address _recipient
    ) public initializer {
        __Ownable_init();
        require(_usdt != address(0), "invalid _usdt!");
        require(_tokenPrice > 0, "invalid _tokenPrice");
        require(_minBuyAmount > 0, "invalid _minBuyAmount");
        require(_endTime > block.timestamp, "invalid _endTime");
        require(_recipient != address(0), "invalid _recipient");

        usdt = IERC20(_usdt);
        tokenPrice = _tokenPrice;
        minBuyAmount = _minBuyAmount;
        startTime = _startTime;
        endTime = _endTime;
        recipient = _recipient;
    }

    function allocate(address[] calldata _users, uint256[] calldata _limitAmounts) external onlyManager {
        for (uint i = 0; i < _users.length; i++) {
            require(limitAmounts[_users[i]]==0, " already allocated");
            limitAmounts[_users[i]] = _limitAmounts[i];
        }
    }


    //to change the address receive payment
    function setRecipient(address _recipient) external onlyManager {
        require(_recipient != address(0), "!invalid _recipient");
        recipient = _recipient;
    }


    function buy(uint256 _usdAmount) external {
        uint256 tokenAmount = _usdAmount.mul(10 ** 18).div(tokenPrice);

        require(tokenAmount <= limitAmounts[msg.sender], "exceeds allocated amount");
        require(block.timestamp > startTime && block.timestamp < endTime, "can not buy this time!");

        sold = sold.add(tokenAmount);
        require(recipient != address(0), "!invalid _recipient");
        usdt.transferFrom(msg.sender, recipient, _usdAmount);
        totalAmounts[msg.sender] = totalAmounts[msg.sender].add(tokenAmount);
        emit UserBought(msg.sender, tokenAmount);
    }
}
