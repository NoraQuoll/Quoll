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

    uint256 public supply;
    uint256 public sold;

    //user can buy in this period
    uint256 public startTime; 
    uint256 public endTime;

    address recipient; //receive payment

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public totalAmounts;
    event UserBought(address indexed _user, uint256 _amount);

      function initialize(
        address _usdt,
        uint256 _tokenPrice,
        uint256 _supply,
        uint256 _startTime,
        uint256 _endTime,
        address _recipient
    ) public initializer {
        __Ownable_init();
        require(_usdt != address(0), "invalid _usdt!");
        require(_tokenPrice > 0, "invalid _tokenPrice");
        require(_startTime > 0, "invalid _startTime");
        require(_endTime > _startTime, "invalid _endTime");
        require(_recipient != address(0), "invalid _recipient");

        usdt = IERC20(_usdt);
        tokenPrice = _tokenPrice;
        startTime = _startTime;
        endTime = _endTime;
        supply = _supply;
        recipient = _recipient;
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
        recipient = _recipient;
    }


    function buy(uint256 _usdAmount) external {
        uint256 tokenAmount = _usdAmount.mul(10 ** 18).div(tokenPrice);
        
        require(whitelist[msg.sender], "not in whitelist");
        require(block.timestamp > startTime && block.timestamp < endTime, "can not buy this time!");

        sold = sold.add(tokenAmount);
        require(sold <= supply, "buy exceeds supply!");
        require(recipient != address(0), "!invalid _recipient");
        usdt.transferFrom(msg.sender, recipient, _usdAmount);
        totalAmounts[msg.sender] = totalAmounts[msg.sender].add(tokenAmount);
        emit UserBought(msg.sender, tokenAmount);
    }
}
