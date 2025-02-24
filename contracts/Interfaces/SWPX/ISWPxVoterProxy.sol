// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface ISWPxVoterProxy {
    function lockSWPx(uint256 _lockDays) external;

    event RevenueSharingPoolAdded(address _revenueSharingPool);
    event BoosterUpdated(address _booster);
    event DepositorUpdated(address _depositor);
}
