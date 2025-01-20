// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Referral.sol";
import "./QMilesPts.sol";

contract PCSReferralCampaignLens is OwnableUpgradeable {
    struct RefMulti {
        uint256 fromAmountOfRef;
        uint256 toAmountOfRef;
        uint256 additionBase;
    }

    struct PointPerCakeStruct {
        uint256 fromAmount;
        uint256 toAmount;
        uint256 pointPerCake;
    }

    struct UserDataStruct {
        uint256 depositAmount;
        uint256 currentPointCake;
    }

    uint256 public constant BASE_REFERRAL = 10000;

    uint256 public minimumDepositToGetRef;
    uint256 public welcomeOfferMinDeposit;
    uint256 public welcomeOfferForReferredUser;

    address public referralAddress;
    address public qMileAddress;

    mapping(address => UserDataStruct) public userDepositedAmount;
    RefMulti[] public refMultiplier;
    PointPerCakeStruct[] public pointPerCake;

    mapping(address => string) public tempMapReferral;
    mapping(address => bool) public access;
    mapping(address => uint256) public userUnClaimedPTS;

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
        return refMultiplier;
    }

    function setParams(
        uint256 _minimumDepositToGetRef,
        uint256 _welcomeOfferForReferredUser,
        uint256 _welcomeOfferMinDeposit,
        address _referralAddress,
        address _qMileAddress,
        uint256[] memory _fromAmountOfRef,
        uint256[] memory _additionBase,
        uint256[] memory _fromAmount,
        uint256[] memory _pointPerCake
    ) external onlyOwner {
        minimumDepositToGetRef = _minimumDepositToGetRef;
        welcomeOfferMinDeposit = _welcomeOfferMinDeposit;
        welcomeOfferForReferredUser = _welcomeOfferForReferredUser;
        referralAddress = _referralAddress;
        qMileAddress = _qMileAddress;

        require(
            _fromAmountOfRef.length == _additionBase.length,
            "invalid length of refmulti struct"
        );

        require(
            _fromAmount.length == _pointPerCake.length,
            "invalid point per cake"
        );

        for (uint256 i = 0; i < _fromAmountOfRef.length; i++) {
            if (i != _fromAmountOfRef.length - 1) {
                refMultiplier.push(
                    RefMulti(
                        _fromAmountOfRef[i],
                        _fromAmountOfRef[i + 1] - 1,
                        _additionBase[i]
                    )
                );
            } else {
                refMultiplier.push(
                    RefMulti(_fromAmountOfRef[i], uint256(-1), _additionBase[i])
                );
            }
        }

        for (uint256 i = 0; i < _fromAmount.length; i++) {
            if (i != _fromAmount.length - 1) {
                pointPerCake.push(
                    PointPerCakeStruct(
                        _fromAmount[i],
                        _fromAmount[i + 1] - 1,
                        _pointPerCake[i]
                    )
                );
            } else {
                pointPerCake.push(
                    PointPerCakeStruct(
                        _fromAmount[i],
                        uint256(-1),
                        _pointPerCake[i]
                    )
                );
            }
        }
    }

    function _getTokenWillGetForUser(
        string memory _linkReferral,
        address _user,
        uint256 _stakeAmount
    ) internal returns (uint256 _welcomeOffer, uint256 ptsWillGet) {
        require(_stakeAmount > 0, "invalid stakeAmount");

        //get current staked amount
        uint256 currentStaked = userDepositedAmount[_user].depositAmount;

        // Frist case: get welcome, 2 conditions
        // 1. deposit amount > 200
        // 2. users have a refferral link
        (bool statusWelcome, ) = Referral(payable(referralAddress))
            .checkCanRegisterReferral(_linkReferral, _user);

        if (
            currentStaked < welcomeOfferMinDeposit &&
            currentStaked + _stakeAmount >= welcomeOfferMinDeposit &&
            keccak256(abi.encodePacked(_linkReferral)) !=
            keccak256(abi.encodePacked("")) &&
            statusWelcome
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
            uint256 i = userDepositedAmount[_user].currentPointCake;
            i < pointPerCake.length;
            i++
        ) {
            // calculate the token Cake stake with their status
            // First case that in the current data
            if (currentStaked + _stakeAmount <= pointPerCake[i].toAmount) {
                //two case
                // here that start point before current data
                if (currentStaked < pointPerCake[i].fromAmount) {
                    //                                      fromAmount       currentStake+amount           toAmount
                    //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                    //  |                                    |                   |                           |                                            |
                    //  |                         «-------addedAmount------------«                           |                                            |
                    //  |                         |          |                   |                           |                                            |
                    // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                    //                                       «------result-------«
                    ptsWillGet +=
                        ((currentStaked +
                            _stakeAmount -
                            pointPerCake[i].fromAmount) *
                            pointPerCake[i].pointPerCake) /
                        10 ** 18;

                    if (ptsWillGet < 0) break;
                    emit AmountOfTokenInStatus(
                        _user,
                        currentStaked +
                            _stakeAmount -
                            pointPerCake[i].fromAmount,
                        pointPerCake[i].pointPerCake
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

                    ptsWillGet +=
                        ((_stakeAmount) * pointPerCake[i].pointPerCake) /
                        10 ** 18;
                    emit AmountOfTokenInStatus(
                        _user,
                        _stakeAmount,
                        pointPerCake[i].pointPerCake
                    );
                }
                // update index of current status
                userDepositedAmount[_user].currentPointCake = i;
                break;
            } else {
                // case that start point in current data
                //                                      fromAmount                                  toAmount  currentStake+amount
                //  |--------pre-status------------------«-------------------current-status--------------«------------------next-status---------------«
                //  |                                    |                   |                           |                                            |
                //  |                                    |            «-------addedAmount----------------|----«                                       |
                //  |                                    |            |                                  |    |                                       |
                // ||------------------------------------||----------------------------------------------||-------------------------------------------||
                //
                ptsWillGet +=
                    ((pointPerCake[i].toAmount - currentStaked) *
                        pointPerCake[i].pointPerCake) /
                    10 ** 18;
                emit AmountOfTokenInStatus(
                    _user,
                    pointPerCake[i].toAmount - currentStaked,
                    pointPerCake[i].pointPerCake
                );
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
        //check can register for this address
        (bool canRegister, string memory errorString) = Referral(
            payable(referralAddress)
        ).checkCanRegisterReferral(linkReferral, _user);

        // for the case user already have a referral link dont need to save temp ref

        if (
            keccak256(abi.encodePacked("User already have referral")) !=
            keccak256(abi.encode(errorString))
        ) {
            require(canRegister, errorString);
            tempMapReferral[_user] = linkReferral;
        }
    }

    function deposit(
        string memory _linkReferral,
        address _user,
        uint256 _stakeAmount,
        string memory _newLinkToCreate
    ) public {
        require(access[msg.sender], "!auth");

        //if user have not stake yet and the link is valid
        if (
            userDepositedAmount[_user].depositAmount == 0 &&
            keccak256(abi.encodePacked(_linkReferral)) !=
            keccak256(abi.encodePacked(""))
        ) {
            // registry a link for user
            _registerTempRefLink(_linkReferral, _user);
        }

        uint256 oldDeposit = userDepositedAmount[_user].depositAmount;

        (uint256 _welcomeOffer, uint256 ptsWillGet) = _getTokenWillGetForUser(
            tempMapReferral[_user],
            _user,
            _stakeAmount
        );

        userUnClaimedPTS[_user] += ptsWillGet;

        if (_welcomeOffer > 0) {
            QMilesPts(qMileAddress).mint(_user, _welcomeOffer);
        }

        // check that user have link or not

        if (
            _stakeAmount + oldDeposit >= minimumDepositToGetRef &&
            oldDeposit < minimumDepositToGetRef &&
            keccak256(
                abi.encodePacked(
                    Referral(payable(referralAddress)).getLinkRefFromUser(_user)
                )
            ) ==
            keccak256(abi.encodePacked(""))
        ) {
            Referral(payable(referralAddress)).createReferralLink(
                _user,
                _newLinkToCreate
            );
        }
    }

    function claimPts() external {
        uint256 claimableAmount = userUnClaimedPTS[msg.sender];
        require(claimableAmount > 0, " Need to greater than 0");

        userUnClaimedPTS[msg.sender] = 0;

        QMilesPts(qMileAddress).mint(
            msg.sender,
            (claimableAmount * findRefMultiplier(msg.sender))
        );
    }

    function findRefMultiplier(address _user) public view returns (uint256) {
        uint256 getRefAmount = Referral(payable(referralAddress))
            .getRefAmountFromUser(_user);

        uint256 sum = BASE_REFERRAL;

        for (uint256 i = 0; i < refMultiplier.length; i++) {
            if (
                refMultiplier[i].fromAmountOfRef <= getRefAmount &&
                getRefAmount <= refMultiplier[i].toAmountOfRef
            ) {
                return
                    sum +=
                        (getRefAmount - refMultiplier[i].fromAmountOfRef + 1) *
                        refMultiplier[i].additionBase;
            } else if (refMultiplier[i].fromAmountOfRef > getRefAmount) {
                break;
            } else {
                sum +=
                    (refMultiplier[i].toAmountOfRef -
                        refMultiplier[i].fromAmountOfRef +
                        1) *
                    refMultiplier[i].additionBase;
            }
        }
        return sum;
    }
}
