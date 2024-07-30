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

    function checkCanRegisterReferral(
        string memory linkReferral,
        address _user
    ) public view returns (bool, string memory) {
        if (
            keccak256(abi.encodePacked(referral[_user])) !=
            keccak256(abi.encodePacked(""))
        ) {
            return (false, "User already have referral");
        }

        if (
            keccak256(abi.encodePacked(linkReferral)) ==
            keccak256(abi.encodePacked(""))
        ) {
            return (false, "Invalid Referral Link");
        }

        if (usedLink[linkReferral] == address(0)) {
            return (false, "Can not find referralLink");
        }

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

    receive() external payable {}
}
