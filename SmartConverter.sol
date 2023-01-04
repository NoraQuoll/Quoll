// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Interfaces/ISmartConvertor.sol";
import "./Interfaces/IWomDepositor.sol";
import "./Interfaces/Wombat/IWombatRouter.sol";
import "./Interfaces/Wombat/IAsset.sol";
import "./Interfaces/Wombat/IPool.sol";

contract SmartConvertor is ISmartConvertor, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public wom;
    address public qWom;
    address public womDepositor;

    address public router;
    address public pool;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public buyThreshold;
    uint256 public buyPercent;
    uint256 public womCR;
    uint256 public qWomCR;
    uint256 public slippagePct;

    event QWomObtained(
        address _user,
        uint256 _depositedWom,
        uint256 _obtainedQWom
    );

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _wom,
        address _qWom,
        address _womDepositor,
        address _router,
        address _pool
    ) external onlyOwner {
        require(wom == address(0), "params have already been set");
        require(_wom != address(0), "invalid _wom!");
        require(_qWom != address(0), "invalid _qWom!");
        require(_womDepositor != address(0), "invalid _womDepositor!");
        require(_router != address(0), "invalid _router!");
        require(_pool != address(0), "invalid _pool!");

        wom = _wom;
        qWom = _qWom;
        womDepositor = _womDepositor;

        router = _router;
        pool = _pool;

        buyThreshold = 10530;
        buyPercent = 10000;
        womCR = 12000;
        qWomCR = 8000;
        slippagePct = 500;

        IERC20(wom).safeApprove(router, type(uint256).max);
        IERC20(wom).safeApprove(womDepositor, type(uint256).max);
    }

    function setBuyThreshold(uint256 newValue) external onlyOwner {
        buyThreshold = newValue;
    }

    function setBuyPercent(uint256 newValue) external onlyOwner {
        require(newValue >= 0 && newValue <= DENOMINATOR, "Not in range");
        buyPercent = newValue;
    }

    function setWomCR(uint256 newValue) external onlyOwner {
        womCR = newValue;
    }

    function setQWomCR(uint256 newValue) external onlyOwner {
        qWomCR = newValue;
    }

    function setSlippage(uint256 newValue) external onlyOwner {
        require(newValue >= 0 && newValue <= DENOMINATOR, "Not in range");
        slippagePct = newValue;
    }

    /// @notice estimates the amount of qWom recieved if bought on wombat
    function estimateOutAmount(uint256 amountSold)
        public
        view
        returns (uint256 amountOut)
    {
        (amountOut, ) = IWombatRouter(router).getAmountOut(
            _getTokenPath(),
            _getPoolPath(),
            int256(amountSold)
        );
    }

    function maxAmountToBuy() public view returns (uint256) {
        IAsset womAsset = IAsset(IPool(pool).addressOfAsset(wom));
        if (
            uint256(womAsset.cash()) >=
            uint256(womAsset.liability()).mul(womCR).div(DENOMINATOR)
        ) {
            return 0;
        }
        uint256 maxWom = uint256(womAsset.liability())
            .mul(womCR)
            .div(DENOMINATOR)
            .sub(uint256(womAsset.cash()));
        IAsset qWomAsset = IAsset(IPool(pool).addressOfAsset(qWom));
        if (
            uint256(qWomAsset.cash()) <=
            uint256(qWomAsset.liability()).mul(qWomCR).div(DENOMINATOR)
        ) {
            return 0;
        }
        uint256 maxQWom = uint256(qWomAsset.cash()).sub(
            uint256(qWomAsset.liability()).mul(qWomCR).div(DENOMINATOR)
        );
        (uint256 maxWomIn, ) = IWombatRouter(router).getAmountIn(
            _getTokenPath(),
            _getPoolPath(),
            maxQWom
        );
        return Math.min(maxWom, maxWomIn);
    }

    function estimateTotalConversion(uint256 _amount)
        external
        view
        returns (uint256 minimumEstimatedTotal)
    {
        minimumEstimatedTotal = _amount;
        if (
            estimateOutAmount(_amount) >=
            _amount.mul(buyThreshold).div(DENOMINATOR)
        ) {
            uint256 amountToBuy = minimumEstimatedTotal.mul(buyPercent).div(
                DENOMINATOR
            );
            uint256 maxAmountToRespectPriceImpact = maxAmountToBuy();
            if (amountToBuy > maxAmountToRespectPriceImpact) {
                amountToBuy = maxAmountToRespectPriceImpact;
            }
            if (amountToBuy == 0) {
                return minimumEstimatedTotal;
            }
            uint256 estimatedOutAmount = estimateOutAmount(amountToBuy);
            if (amountToBuy < estimatedOutAmount) {
                minimumEstimatedTotal = minimumEstimatedTotal.sub(amountToBuy);
                minimumEstimatedTotal = minimumEstimatedTotal.add(
                    estimatedOutAmount
                );
            }
        }
    }

    function _depositFor(uint256 _amount, address _for)
        internal
        returns (uint256 obtainedAmount)
    {
        IERC20(wom).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 amountToConvert = _amount;
        if (
            estimateOutAmount(_amount) >=
            _amount.mul(buyThreshold).div(DENOMINATOR)
        ) {
            uint256 amountToBuy = amountToConvert.mul(buyPercent).div(
                DENOMINATOR
            );
            uint256 maxAmountToRespectPriceImpact = maxAmountToBuy();
            if (amountToBuy > maxAmountToRespectPriceImpact) {
                amountToBuy = maxAmountToRespectPriceImpact;
            }
            if (amountToBuy > 0) {
                uint256 estimatedOutAmount = estimateOutAmount(amountToBuy);
                if (amountToBuy < estimatedOutAmount) {
                    obtainedAmount = IWombatRouter(router)
                        .swapExactTokensForTokens(
                            _getTokenPath(),
                            _getPoolPath(),
                            amountToBuy,
                            estimatedOutAmount
                                .mul(DENOMINATOR.sub(slippagePct))
                                .div(DENOMINATOR),
                            _for,
                            block.timestamp
                        );
                    require(
                        obtainedAmount > amountToBuy,
                        "Transaction is disadvantageous"
                    );
                    amountToConvert = amountToConvert.sub(amountToBuy);
                }
            }
        }
        if (amountToConvert > 0) {
            obtainedAmount = obtainedAmount.add(amountToConvert);
            IWomDepositor(womDepositor).deposit(amountToConvert, false);
            IERC20(qWom).safeTransfer(_for, amountToConvert);
        }
        emit QWomObtained(_for, _amount, obtainedAmount);
    }

    function deposit(uint256 _amount)
        external
        override
        returns (uint256 obtainedAmount)
    {
        obtainedAmount = _depositFor(_amount, msg.sender);
    }

    function depositFor(uint256 _amount, address _for)
        external
        override
        returns (uint256 obtainedAmount)
    {
        obtainedAmount = _depositFor(_amount, _for);
    }

    function _getTokenPath() internal view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = wom;
        path[1] = qWom;
        return path;
    }

    function _getPoolPath() internal view returns (address[] memory) {
        address[] memory path = new address[](1);
        path[0] = pool;
        return path;
    }
}
