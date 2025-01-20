// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../lib/TransferHelper.sol";
import "../lib/ManagerUpgradeable.sol";
import "../Interfaces/IVlQuoV2.sol";
import "../Interfaces/IPCSDepositor.sol";

import "../PCSReferralCampaignLens.sol";

contract PCSBootstrap is ManagerUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using TransferHelper for address;

    uint256 public constant BASE_MULTIPLIER = 10;

    IERC20 public stakingToken; //qCake
    address public cake;
    address public squad; //nft Pancake Squad
    address public cakeDepositor;
    address public referralLensAddress;

    uint256 public startCampaign;
    uint256 public endCampaign;

    event Convert(address indexed _user, uint _amount);

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _stakingToken,
        address _cake,
        address _squad,
        address _cakeDepositor,
        address _referalLensAddress
    ) external onlyOwner {
        require(_stakingToken != address(0), "invalid_stakingToken!");
        require(_cake != address(0), "invalid_cake!");
        require(_cakeDepositor != address(0), "invalid_cakeDepositor!");
        require(
            _referalLensAddress != address(0),
            "invalid _refferalLensAddress"
        );

        stakingToken = IERC20(_stakingToken);
        cake = _cake;
        squad = _squad;
        cakeDepositor = _cakeDepositor;
        referralLensAddress = _referalLensAddress;
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
        require(_amount > 0, "RewardPool : Cannot stake 0");
        require(startCampaign > 0, "Only when Campaign ready");
        require(
            startCampaign <= block.timestamp && block.timestamp <= endCampaign,
            "Not in campaign times"
        );

        IERC20(cake).safeTransferFrom(msg.sender, address(this), _amount);
        _approveTokenIfNeeded(cake, cakeDepositor, _amount);
        uint256 multiplier = hasSquadNFT(msg.sender) ? 11 : BASE_MULTIPLIER;
        uint256 finalAmount =  (multiplier * _amount) / BASE_MULTIPLIER;
        IPCSDepositor(cakeDepositor).deposit(finalAmount, false);
        
        IERC20(stakingToken).safeTransfer(
            msg.sender,
            (multiplier * _amount) / BASE_MULTIPLIER
        );

        PCSReferralCampaignLens(referralLensAddress).deposit(
            _linkReferral,
            msg.sender,
            _amount,
            _newLinkToCreate
        );

        emit Convert(msg.sender, _amount);
    }

    function hasSquadNFT(address account) internal view returns (bool) {
        return IERC721(squad).balanceOf(account) > 0;
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
}
