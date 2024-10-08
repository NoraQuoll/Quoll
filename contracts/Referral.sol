// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/IReferral.sol";

contract Referral is IReferral, OwnableUpgradeable {
    mapping(address => bool) public access;

    mapping(string => address) public usedLink;

    struct UserReferalData {
        string refLink;
        uint256 refAmount;
    }
    mapping(address => UserReferalData) public referralLinkFromUser;

    mapping(address => string) public referral;

    function initialize() public initializer {
        __Ownable_init();
    }

    function getRefAmountFromUser(address _user) public view returns (uint256) {
        return referralLinkFromUser[_user].refAmount;
    }

    function getLinkRefFromUser(
        address _user
    ) public view returns (string memory) {
        return referralLinkFromUser[_user].refLink;
    }

    function setAccess(
        address _address,
        bool _status
    ) external override onlyOwner {
        require(_address != address(0), "invalid _address!");

        access[_address] = _status;
        emit AccessSet(_address, _status);
    }

    function createReferralLink(address user, string memory link) public {
        require(access[msg.sender], "!auth");

        require(
            keccak256(abi.encodePacked(link)) !=
                keccak256(abi.encodePacked("")),
            "Invalid Referral Link"
        );

        require(usedLink[link] == address(0), "link already used");
        require(
            keccak256(abi.encodePacked(referralLinkFromUser[user].refLink)) ==
                keccak256(abi.encodePacked("")),
            "Already init a link for that user"
        );

        referralLinkFromUser[user].refLink = link;
        usedLink[link] = user;

        emit CreateReferralLink(user, link);
    }

    function changeReferralLink(
        string memory oldLink,
        string memory newLink
    ) public onlyOwner {
        address user = usedLink[oldLink];
        referralLinkFromUser[user].refLink = newLink;
        usedLink[oldLink] = address(0);
        usedLink[newLink] = user;
    }

    function checkCanRegisterReferral(
        string memory linkReferral,
        address _user
    ) public view returns (bool, string memory) {
        // check is user that have a referral link before
        if (
            keccak256(abi.encodePacked(referral[_user])) !=
            keccak256(abi.encodePacked(""))
        ) {
            return (false, "User already have referral");
        }

        // check is that link is a empty link
        if (
            keccak256(abi.encodePacked(linkReferral)) ==
            keccak256(abi.encodePacked(""))
        ) {
            return (false, "Invalid Referral Link");
        }

        // check is that link, link to a user
        if (usedLink[linkReferral] == address(0)) {
            return (false, "Can not find referralLink");
        }

        // user could not invite themself
        if (usedLink[linkReferral] == _user) {
            return (false, "Can not referral for yourselve");
        }

        return (true, "");
    }

    function _referralRegister(
        string memory linkReferral,
        address _user
    ) private {
        (
            bool canRegisRef,
            string memory errorString
        ) = checkCanRegisterReferral(linkReferral, _user);

        require(canRegisRef, errorString);

        referral[_user] = linkReferral;

        referralLinkFromUser[usedLink[linkReferral]].refAmount++;

        emit ReferralRegister(_user, linkReferral, usedLink[linkReferral]);
    }

    function referralRegister(
        string memory _linkReferral,
        address _user
    ) public {
        require(access[msg.sender], "!auth");

        _referralRegister(_linkReferral, _user);
    }

    receive() external payable {}
}
