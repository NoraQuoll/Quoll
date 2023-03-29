// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@shared/lib-contracts/contracts/Dependencies/TransferHelper.sol";
import "./Interfaces/INativeZapper.sol";
import "./Interfaces/IPancakePath.sol";
import "./Interfaces/Pancake/IPancakeRouter.sol";

contract NativeZapper is INativeZapper, OwnableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public wNative;
    IPancakeRouter02 public pancakeRouter;
    IPancakePath public pancakePath;

    mapping(address => bool) public access;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setParams(
        address _wNative,
        address _pancakeRouter,
        address _pancakePath
    ) external onlyOwner {
        require(wNative == address(0), "params have already been set");

        wNative = _wNative;
        pancakeRouter = IPancakeRouter02(_pancakeRouter);
        pancakePath = IPancakePath(_pancakePath);
    }

    function getAmountOut(address _from, uint256 _amount)
        external
        view
        override
        returns (uint256)
    {
        uint256[] memory amounts = pancakeRouter.getAmountsOut(
            _amount,
            _getSwapPath(_from, wNative)
        );
        return amounts[amounts.length - 1];
    }

    function zapInToken(
        address _from,
        uint256 _amount,
        address _receiver
    ) external override returns (uint256 nativeAmount) {
        require(access[msg.sender], "!auth");

        if (_amount > 0) {
            _approveTokenIfNeeded(_from, _amount);
            IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
            nativeAmount = _swapTokenForNative(_from, _amount, _receiver);

            emit ZapIn(_from, _amount, _receiver, nativeAmount);
        }
    }

    function swapToken(
        address _from,
        address _to,
        uint256 _amount,
        address _receiver
    ) external payable override returns (uint256) {
        require(access[msg.sender], "!auth");

        if (_amount == 0) {
            return 0;
        }

        uint256 amountOut;
        if (AddressLib.isPlatformToken(_from)) {
            require(_amount == msg.value, "invalid amount");
            uint256[] memory amounts = pancakeRouter.swapExactETHForTokens{
                value: _amount
            }(0, _getSwapPath(wNative, _to), _receiver, block.timestamp);
            amountOut = amounts[amounts.length - 1];
        } else {
            require(msg.value == 0, "invalid msg.value");
            IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
            _approveTokenIfNeeded(_from, _amount);
            uint256[] memory amounts = pancakeRouter.swapExactTokensForTokens(
                _amount,
                0,
                _getSwapPath(_from, _to),
                _receiver,
                block.timestamp
            );
            amountOut = amounts[amounts.length - 1];
        }
        emit Swapped(_from, _to, _amount, _receiver, amountOut);

        return amountOut;
    }

    function setAccess(address _address, bool _status) external onlyOwner {
        require(_address != address(0), "invalid _address!");

        access[_address] = _status;
        emit AccessSet(_address, _status);
    }

    function _approveTokenIfNeeded(address _token, uint256 _amount) internal {
        if (
            IERC20(_token).allowance(address(this), address(pancakeRouter)) <
            _amount
        ) {
            IERC20(_token).safeApprove(address(pancakeRouter), 0);
            IERC20(_token).safeApprove(
                address(pancakeRouter),
                type(uint256).max
            );
        }
    }

    function _swapTokenForNative(
        address _token,
        uint256 _amount,
        address _receiver
    ) internal returns (uint256) {
        uint256[] memory amounts = pancakeRouter.swapExactTokensForETH(
            _amount,
            0,
            _getSwapPath(_token, wNative),
            _receiver,
            block.timestamp
        );
        return amounts[amounts.length - 1];
    }

    function _getSwapPath(address _from, address _to)
        internal
        view
        returns (address[] memory)
    {
        address[] memory path = pancakePath.getPath(_from, _to);
        if (path.length == 0) {
            path = new address[](2);
            path[0] = _from;
            path[1] = _to;
        }
        return path;
    }

    receive() external payable {}
}
