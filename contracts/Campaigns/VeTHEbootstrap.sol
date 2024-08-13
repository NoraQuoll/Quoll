// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../lib/ManagerUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../ReferralBootstrapLens.sol";
import "../Interfaces/IQuollExternalToken.sol";
import "../Interfaces/IVotingEscrow.sol";

contract VeTHEbootstrap is ManagerUpgradeable {
    address public voterProxy;
    address public qTHE;
    address public veTHE;
    address public bootstrapLens;

    bool public pause;

    uint256 public startCampaign;
    uint256 public endCampaign;

    event SetRate(uint256 newRate);

    event Convert(address indexed _user, uint256 tokenId, uint256 veTHEHolding);

    function initialize(
        address _voterProxy,
        address _qTHE,
        address _veTHE,
        address _bootstrapLens
    ) public initializer {
        __ManagerUpgradeable_init();

        voterProxy = _voterProxy;
        qTHE = _qTHE;
        veTHE = _veTHE;
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

    function setPause(bool _pause) public onlyManager {
        pause = _pause;
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
            uint256 veTheHoldingIn = IVotingEscrow(veTHE).balanceOfNFT(
                tokenIds[i]
            );
            sum += veTheHoldingIn;
            ERC721(veTHE).transferFrom(msg.sender, voterProxy, tokenIds[i]);

            emit Convert(msg.sender, tokenIds[i], veTheHoldingIn);
        }

        IQuollExternalToken(qTHE).mint(msg.sender, sum);

        ReferralBootstrapLens(bootstrapLens).deposit(
            _linkReferral,
            msg.sender,
            sum,
            _newLinkToCreate
        );
    }
}
