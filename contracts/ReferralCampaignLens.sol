// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Referral.sol";
import "./QMilesPts.sol";

contract ReferralCampaignLens is OwnableUpgradeable {
    struct RefMulti {
        uint256 fromAmountOfRef;
        uint256 toAmountOfRef;
        uint256 additionBase;
    }

    struct PointPerTHEStruct {
        uint256 fromAmount;
        uint256 toAmount;
        uint256 pointPerTHE;
    }

    struct UserDataStruct {
        uint256 depositAmount;
        uint256 currentPointThe;
    }

    uint256 public constant BASE_REFERRAL = 10000;

    uint256 public minimumDepositToGetRef;
    uint256 public welcomeOfferMinDeposit;
    uint256 public welcomeOfferForReferredUser;
    // uint256 public minimumDepositToGetOffer;
    address public referralAddress;
    address public qMileAddress;

    mapping(address => UserDataStruct) public userDepositedAmount;

    RefMulti[] public refMuliplier;
    PointPerTHEStruct[] public pointPerTHE;

    mapping(address => string) public tempMapReferral;

    mapping(address => bool) public access;

    event AmountOfTokenInStatus(
        address user,
        uint256 amount,
        uint256 multiplier
    );
    event UserGetWelcomePoint(address user, uint256 amount);
    event AccessSet(address indexed _address, bool _status);

    function initialize() public initializer {
        __Ownable_init();
    }

    function getRefMultiplier() public view returns (RefMulti[] memory) {
        return refMuliplier;
    }

    function setParams(
        uint256 _minimumDepositToGetRef,
        uint256 _welcomeOfferForReferredUser,
        uint256 _welcomeOfferMinDeposit,
        // uint256 _minimumDepositToGetOffer,
        address _referralAddress,
        address _qMileAddress,
        uint256[] memory _fromAmountOfRef,
        uint256[] memory _additionBase,
        uint256[] memory _fromAmount,
        uint256[] memory _pointPerTHE
    ) external onlyOwner {
        minimumDepositToGetRef = _minimumDepositToGetRef;
        welcomeOfferMinDeposit = _welcomeOfferMinDeposit;
        // minimumDepositToGetOffer = _minimumDepositToGetOffer;
        welcomeOfferForReferredUser = _welcomeOfferForReferredUser;
        referralAddress = _referralAddress;
        qMileAddress = _qMileAddress;

        require(
            _fromAmountOfRef.length == _additionBase.length,
            "invalid length of refmulti struct"
        );
        require(
            _fromAmount.length == _pointPerTHE.length,
            "invalid point per the"
        );

        for (uint256 i = 0; i < _fromAmountOfRef.length; i++) {
            if (i != _fromAmountOfRef.length - 1) {
                refMuliplier.push(
                    RefMulti(
                        _fromAmountOfRef[i],
                        _fromAmountOfRef[i + 1] - 1,
                        _additionBase[i]
                    )
                );
            } else {
                refMuliplier.push(
                    RefMulti(_fromAmountOfRef[i], uint256(-1), _additionBase[i])
                );
            }
        }

        for (uint256 i = 0; i < _fromAmount.length; i++) {
            if (i != _fromAmount.length - 1) {
                pointPerTHE.push(
                    PointPerTHEStruct(
                        _fromAmount[i],
                        _fromAmount[i + 1] - 1,
                        _pointPerTHE[i]
                    )
                );
            } else {
                pointPerTHE.push(
                    PointPerTHEStruct(
                        _fromAmount[i],
                        uint256(-1),
                        _pointPerTHE[i]
                    )
                );
            }
        }
    }

    function _getTokenWillGetForUser(
        string memory _linkReferral,
        address _user,
        uint256 _stakeAmount
    ) internal returns (uint256 _welcomeOffer, uint256 theWillGet) {
        require(_stakeAmount > 0, "invalid stakeAmount");
        // get current staked amount
        uint256 currentStaked = userDepositedAmount[_user].depositAmount;

        // Frist case: get welcome, 2 conditions
        // 1. deposit amount > 200
        // 2. users have a refferral link
        if (
            currentStaked < welcomeOfferMinDeposit &&
            currentStaked + _stakeAmount >= welcomeOfferMinDeposit &&
            keccak256(abi.encodePacked(_linkReferral)) !=
            keccak256(abi.encodePacked(""))
        ) {
            _welcomeOffer = welcomeOfferForReferredUser;
            emit UserGetWelcomePoint(_user, _welcomeOffer);

            // call to referral to register Ref for user to came to limit
            Referral(payable(referralAddress)).referralRegister(
                _linkReferral,
                _user
            );
        } else {
            _welcomeOffer = 0;
        }

        for (
            uint256 i = userDepositedAmount[_user].currentPointThe;
            i < pointPerTHE.length;
            i++
        ) {
            // calculate the token The stake with their status
            // First case that in the current data
            if (currentStaked + _stakeAmount <= pointPerTHE[i].toAmount) {
                // two case
                // here that start point before current data
                if (currentStaked < pointPerTHE[i].fromAmount) {
                    //                                      fromAmount       currentStake+amount           toAmount
                    //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                    //  |                                    |                   |                           |                                            |
                    //  |                         «-------addedAmount------------«                           |                                            |
                    //  |                         |          |                   |                           |                                            |
                    // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                    //                                       «------result-------«

                    theWillGet +=
                        ((currentStaked +
                            _stakeAmount -
                            pointPerTHE[i].fromAmount) *
                            pointPerTHE[i].pointPerTHE) /
                        10 ** 18;

                    if (theWillGet < 0) break;

                    emit AmountOfTokenInStatus(
                        _user,
                        currentStaked +
                            _stakeAmount -
                            pointPerTHE[i].fromAmount,
                        pointPerTHE[i].pointPerTHE
                    );
                } else {
                    // case that start point in current data
                    //                                      fromAmount                  currentStake+amount  toAmount
                    //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                    //  |                                    |                   |               |           |                                            |
                    //  |                                         «-------addedAmount------------«           |                                            |
                    //  |                                    |    |                              |           |                                            |
                    // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                    //                                            «------result-------------------«
                    theWillGet +=
                        ((_stakeAmount) * pointPerTHE[i].pointPerTHE) /
                        10 ** 18;

                    emit AmountOfTokenInStatus(
                        _user,
                        _stakeAmount,
                        pointPerTHE[i].pointPerTHE
                    );
                }

                // update index of current status
                userDepositedAmount[_user].currentPointThe = i;
                break;
            } else {
                // case that not in current data
                // two case
                // here that start point before current data

                //                                      fromAmount                                  toAmount  currentStake+amount
                //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                //  |                                    |                   |                           |                                            |
                //  |                         «-------addedAmount----------------------------------------|----«                                       |
                //  |                         |          |                                               |    |                                       |
                // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                //                                       «------result-----------------------------------«
                if (currentStaked < pointPerTHE[i].fromAmount) {
                    theWillGet +=
                        ((pointPerTHE[i].toAmount - pointPerTHE[i].fromAmount) *
                            pointPerTHE[i].pointPerTHE) /
                        10 ** 18;

                    emit AmountOfTokenInStatus(
                        _user,
                        pointPerTHE[i].toAmount - pointPerTHE[i].fromAmount,
                        pointPerTHE[i].pointPerTHE
                    );
                } else {
                    // case that start point in current data
                    //                                      fromAmount                                  toAmount  currentStake+amount
                    //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                    //  |                                    |                   |                           |                                            |
                    //  |                                    |            «-------addedAmount----------------|----«                                       |
                    //  |                                    |            |                                  |    |                                       |
                    // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                    //                                                    «------result----------------------«
                    theWillGet +=
                        ((pointPerTHE[i].toAmount - currentStaked) *
                            pointPerTHE[i].pointPerTHE) /
                        10 ** 18;

                    emit AmountOfTokenInStatus(
                        _user,
                        pointPerTHE[i].toAmount - currentStaked,
                        pointPerTHE[i].pointPerTHE
                    );
                }
            }
        }

        userDepositedAmount[_user].depositAmount += _stakeAmount;
    }

    function setAccess(address _address, bool _status) external onlyOwner {
        require(_address != address(0), "invalid _address!");

        access[_address] = _status;
        emit AccessSet(_address, _status);
    }

    function _registerTempRefLink(
        string memory linkReferral,
        address _user
    ) private {
        // check can register for this address
        (bool canRegisRef, string memory errorString) = Referral(
            payable(referralAddress)
        ).checkCanRegisterReferral(linkReferral, _user);

        require(canRegisRef, errorString);

        tempMapReferral[_user] = linkReferral;
    }

    function deposit(
        string memory _linkReferral,
        address _user,
        uint256 _stakeAmount,
        string memory _newLinkToCreate
    ) public {
        require(access[msg.sender], "!auth");

        // if user have not stake yet and the link is valid
        if (
            userDepositedAmount[_user].depositAmount == 0 &&
            keccak256(abi.encodePacked(_linkReferral)) !=
            keccak256(abi.encodePacked(""))
        ) {
            // registry a link for user
            _registerTempRefLink(_linkReferral, _user);
        }

        (uint256 _welcomeOffer, uint256 theWillGet) = _getTokenWillGetForUser(
            tempMapReferral[_user],
            _user,
            _stakeAmount
        );

        uint256 mintPtsAmount = _welcomeOffer +
            (theWillGet * findRefMultiplier(_user)) /
            BASE_REFERRAL;

        QMilesPts(qMileAddress).mint(_user, mintPtsAmount);

        if (
            _stakeAmount + userDepositedAmount[_user].depositAmount >=
            minimumDepositToGetRef
        ) {
            Referral(payable(referralAddress)).createReferralLink(
                _user,
                _newLinkToCreate
            );
        }
    }

    function findRefMultiplier(address _user) public view returns (uint256) {
        uint256 getRefAmount = Referral(payable(referralAddress))
            .getRefAmountFromUser(_user);

        uint256 sum = BASE_REFERRAL;

        for (uint256 i = 0; i < refMuliplier.length; i++) {
            if (
                refMuliplier[i].fromAmountOfRef <= getRefAmount &&
                getRefAmount <= refMuliplier[i].toAmountOfRef
            ) {
                return
                    sum +=
                        (getRefAmount - refMuliplier[i].fromAmountOfRef + 1) *
                        refMuliplier[i].additionBase;
            } else if (refMuliplier[i].fromAmountOfRef > getRefAmount) {
                break;
            } else {
                sum +=
                    (refMuliplier[i].toAmountOfRef -
                        refMuliplier[i].fromAmountOfRef +
                        1) *
                    refMuliplier[i].additionBase;
            }
        }

        return sum;
    }
}
