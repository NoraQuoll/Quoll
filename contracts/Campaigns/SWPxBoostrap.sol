// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../lib/ManagerUpgradeable.sol";
import "../lib/TransferHelper.sol";

import "../Interfaces/SWPX/ISWPxDepositor.sol";
import "../SWPxReferralCampaignLens.sol";

contract SWPxBoostrap is ManagerUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using TransferHelper for address;

    IERC20 public stakingToken; //qSWPx
    address public swpx;
    address public swpxDepositor;
    address public referralLensAddress;

    uint256 public startCampaign;
    uint256 public endCampaign;

    event Convert(address indexed _user, uint _amount);

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _stakingToken,
        address _swpx,
        address _swpxDepositor,
        address _referralLensAddress
    ) external onlyOwner {
        require(_stakingToken != address(0), "invalid _stakingToken!");
        require(_swpx != address(0), "invalid _swpx");
        require(_swpxDepositor != address(0), "invalid _swpx_depositor");
        require(_referralLensAddress != address(0), "invalid _referralLens");

        stakingToken = IERC20(_stakingToken);
        swpx = _swpx;
        swpxDepositor = _swpxDepositor;
        referralLensAddress = _referralLensAddress;
    }

    function initPool(
        uint256 _startCampaign,
        uint256 _endCampaign
    ) external onlyManager {
        require(_startCampaign > 0, "invalid _startCampaign!");
        require(_endCampaign > 0, "invalid _endCampaign!");

        startCampaign = _startCampaign;
        endCampaign = _endCampaign;
    }

    function convert(
        uint256 _amount,
        string memory _linkReferral,
        string memory _newLinkToCreate
    ) external {
        require(startCampaign > 0, "Only when Campaign ready");
        require(
            startCampaign <= block.timestamp && block.timestamp <= endCampaign,
            "Not in campaign times"
        );
        IERC20(swpx).transferFrom(msg.sender, address(this), _amount);
        _approveTokenIfNeeded(swpx, swpxDepositor, _amount);
        ISWPxDepositor(swpxDepositor).deposit(_amount, false);

        IERC20(stakingToken).safeTransfer(msg.sender, _amount);

        SWPxReferralCampaignLens(referralLensAddress).deposit(
            _linkReferral,
            msg.sender,
            _amount,
            _newLinkToCreate
        );

        emit Convert(msg.sender, _amount);
    }

    function _approveTokenIfNeeded(
        address _token,
        address _to,
        uint256 _amount
    ) internal {
        if (IERC20(_token).allowance(address(this), _to) < _amount) {
            IERC20(_token).approve(_to, 0);
            IERC20(_token).approve(_to, type(uint256).max);
        }
    }
}
