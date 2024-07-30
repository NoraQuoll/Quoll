// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

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

    uint256 public constant BASE_REFERRAL = 10000;

    uint256 public minimumDepositToGetRef;
    uint256 public welcomeOfferMinDeposit;
    uint256 public welcomeOfferForReferredUser;
    uint256 public minimumDepositToGetOffer;
    address public referralAddress;

    struct UserDataStruct {
        uint256 depositAmount;
        uint256 currentPointThe;
    }

    mapping(address => UserDataStruct) public userDepositedAmount;

    RefMulti[] public refMuliplier;
    PointPerTHEStruct[] public pointPerTHE;

    mapping(address => string) public tempMapReferral;

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
        uint256 _minimumDepositToGetOffer,
        address _referralAddress,
        uint256[] memory _fromAmountOfRef,
        uint256[] memory _additionBase,
        uint256[] memory _fromAmount,
        uint256[] memory _pointPerTHE
    ) external onlyOwner {
        minimumDepositToGetRef = _minimumDepositToGetRef;
        welcomeOfferMinDeposit = _welcomeOfferMinDeposit;
        minimumDepositToGetOffer = _minimumDepositToGetOffer;
        welcomeOfferForReferredUser = _welcomeOfferForReferredUser;
        referralAddress = _referralAddress;

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

    function getTokenWillGetForUser(
        string memory _linkReferral,
        address _user,
        uint256 _stakeAmount
    )
        public
        view
        returns (uint256 _welcomeOffer, uint256[] memory, uint256[] memory)
    {
        // get current staked amount
        uint256 currentStaked = userDepositedAmount[_user];

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
        } else {
            _welcomeOffer = 0;
        }

        for (
            uint256 i = userDepositedAmount[_user].currentPointThe;
            i < pointPerTHE.length;
            i++
        ) {

            
        }
    }
}
