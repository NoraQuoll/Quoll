// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../lib/ManagerUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../ReferralBootstrapLens.sol";
import "../Interfaces/IQuollExternalToken.sol";
import "../Interfaces/IVotingEscrow.sol";

contract VeSWPxBootstrap is ManagerUpgradeable {
    address public voterProxy;
    address public qSWPx;
    address public veSWPx;
    address public bootstrapLens;

    bool public pause;

    uint256 public startCampaign;
    uint256 public endCampaign;

    event SetRate(uint256 newRate);

    event Convert(
        address indexed _user,
        uint256 tokenId,
        uint256 veSWPxHolding
    );

    function initialize() public initializer {
        __ManagerUpgradeable_init();
    }

    function setParams(
        address _voterProxy,
        address _qSWPx,
        address _veSWPx,
        address _bootstrapLens
    ) external onlyOwner {
        voterProxy = _voterProxy;
        qSWPx = _qSWPx;
        veSWPx = _veSWPx;
        bootstrapLens = _bootstrapLens;
    }

    function initPool(
        uint256 _startCampaign,
        uint256 _endCampaign
    ) external onlyManager {
        require(_startCampaign > 0, "invalid _startCampaign");
        require(_endCampaign > 0, "invalid _endCampaign");
        require(
            _startCampaign < _endCampaign,
            "_endCampaign must be greater than _startCampaign"
        );

        startCampaign = _startCampaign;
        endCampaign = _endCampaign;
    }

    function convert(
        uint256[] memory tokenIds,
        string memory _linkReferral,
        string memory _newLinkToCreate
    ) public {
        require(tokenIds.length > 0, "Must convert greater than 0 nfts");
        require(startCampaign > 0, "Only when Campaign ready");
         require(
            startCampaign <= block.timestamp && block.timestamp <= endCampaign,
            "Not in campaign times"
        );

        uint256 sum;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 veSWPxHoldingIn = IVotingEscrow(veSWPx).balanceOfNFT(tokenIds[i]);
            sum+= veSWPxHoldingIn;

            ERC721(veSWPx).safeTransferFrom(msg.sender, voterProxy, tokenIds[i]);

            emit Convert(msg.sender, tokenIds[i], veSWPxHoldingIn);
        }

        IQuollExternalToken(qSWPx).mint(msg.sender, sum);

        ReferralBootstrapLens(bootstrapLens).deposit(_linkReferral, msg.sender, sum, _newLinkToCreate);


    }
}
