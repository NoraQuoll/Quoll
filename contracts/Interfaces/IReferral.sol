// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IReferral {
    event ReferralRegister(
        address userRegister,
        string linkReferral,
        address userReferer
    );

    event CreateReferralLink(address user, string linkReferral);
    event RemoveReferralLink(address user, string linkReferral);
    event AccessSet(address indexed _address, bool _status);

    function setAccess(address _address, bool _status) external;
}
