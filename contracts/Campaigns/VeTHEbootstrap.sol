// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../lib/ManagerUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../ReferralBootstrapLens.sol";
import "../Interfaces/IQuollExternalToken.sol";

contract VeTHEbootstrap is ManagerUpgradeable {
    address public voterProxy;
    address public qTHE;
    address public veTHE;
    uint256 public rate;
    address public bootstrapLens;

    bool public pause;

    uint256 public startCampaign;
    uint256 public endCampaign;

    event SetRate(uint256 newRate);

    event Convert(uint256 tokenId);

    function initialize(
        address _voterProxy,
        address _qTHE,
        address _veTHE,
        uint256 _rate,
        address _bootstrapLens
    ) public initializer {
        __ManagerUpgradeable_init();

        voterProxy = _voterProxy;
        qTHE = _qTHE;
        veTHE = _veTHE;
        rate = _rate;
        bootstrapLens = _bootstrapLens;
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

    function setUpRate(uint256 _rate) public onlyManager {
        require(rate != _rate, "Same old rate");
        require(_rate > 0, "rate should greater than 0");

        rate = _rate;

        emit SetRate(_rate);
    }

    function setPause(bool _pause) public onlyManager {
        pause = _pause;
    }

    function convert(uint256[] memory tokenIds, string memory _linkReferral,
        string memory _newLinkToCreate) public {
        require(tokenIds.length > 0, "Must convert greater than 0 nfts");

        require(rate > 0, "Rate not set yet");
        require(startCampaign > 0, "Only when Campaign ready");
        require(
            startCampaign <= block.timestamp && block.timestamp <= endCampaign,
            "Not in campaign times"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            ERC721(veTHE).transferFrom(msg.sender, voterProxy, tokenIds[i]);

            emit Convert(tokenIds[i]);
        }

        IQuollExternalToken(qTHE).mint(msg.sender, tokenIds.length * rate);

        ReferralBootstrapLens(bootstrapLens).deposit(
            _linkReferral,
            msg.sender,
            tokenIds.length,
            _newLinkToCreate
        );
    }
}
