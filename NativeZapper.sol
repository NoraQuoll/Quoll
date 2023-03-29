// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@shared/lib-contracts/contracts/Dependencies/TransferHelper.sol";
import "./Interfaces/INativeZapper.sol";
import "./Interfaces/IPancakePath.sol";
import "./Interfaces/Pancake/IPancakeRouter.sol";
import "./Interfaces/Thena/IThenaRouterV2.sol";

contract NativeZapper is INativeZapper, OwnableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public wNative;
    IPancakeRouter02 public pancakeRouter;
    IPancakePath public pancakePath;

    mapping(address => bool) public access;

    mapping(address => mapping(address => Dex)) public pairToDex;

    IThenaRouterV2 public thenaRouter;
    mapping(address => mapping(address => IThenaRouterV2.route[]))
        public thenaRoutes;

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

    function setThenaRouter(address _thenaRouter) external onlyOwner {
        thenaRouter = IThenaRouterV2(_thenaRouter);
    }

    function setThenaRoutes(
        address _from,
        address _to,
        address[] calldata _froms,
        address[] calldata _tos,
        bool[] calldata _stables
    ) external onlyOwner {
        require(
            _froms.length == _tos.length && _froms.length == _stables.length,
            "invalid routes"
        );

        delete thenaRoutes[_from][_to];
        for (uint256 i = 0; i < _froms.length; i++) {
            thenaRoutes[_from][_to].push(
                IThenaRouterV2.route(_froms[i], _tos[i], _stables[i])
            );
        }
    }

    function setPairDex(
        address _from,
        address _to,
        Dex _dex
    ) external onlyOwner {
        pairToDex[_from][_to] = _dex;
        emit PairToDexSet(_from, _to, _dex);
    }

    function getAmountOut(address _from, uint256 _amount)
        external
        view
        override
        returns (uint256)
    {
        Dex dex = pairToDex[_from][wNative];
        if (dex == Dex.PCS) {
            uint256[] memory amounts = pancakeRouter.getAmountsOut(
                _amount,
                _getPcsPath(_from, wNative)
            );
            return amounts[amounts.length - 1];
        }
        if (dex == Dex.Thena) {
            uint256[] memory amounts = thenaRouter.getAmountsOut(
                _amount,
                thenaRoutes[_from][wNative]
            );
            return amounts[amounts.length - 1];
        }
        revert("invalid dex");
    }

    function zapInToken(
        address _from,
        uint256 _amount,
        address _receiver
    ) external override returns (uint256 nativeAmount) {
        require(access[msg.sender], "!auth");

        if (_amount == 0) {
            return 0;
        }
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);

        Dex dex = pairToDex[_from][wNative];
        nativeAmount = _swapTokenForNative(dex, _from, _amount, _receiver);

        emit ZapIn(dex, _from, _amount, _receiver, nativeAmount);
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
            }(0, _getPcsPath(wNative, _to), _receiver, block.timestamp);
            amountOut = amounts[amounts.length - 1];
        } else {
            require(msg.value == 0, "invalid msg.value");
            IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
            _approveTokenIfNeeded(_from, address(pancakeRouter), _amount);
            uint256[] memory amounts = pancakeRouter.swapExactTokensForTokens(
                _amount,
                0,
                _getPcsPath(_from, _to),
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

    function _approveTokenIfNeeded(
        address _token,
        address _to,
        uint256 _amount
    ) internal {
        if (IERC20(_token).allowance(address(this), _to) < _amount) {
            IERC20(_token).safeApprove(_to, 0);
            IERC20(_token).safeApprove(_to, type(uint256).max);
        }
    }

    function _swapTokenForNative(
        Dex _dex,
        address _token,
        uint256 _amount,
        address _receiver
    ) internal returns (uint256) {
        if (_dex == Dex.PCS) {
            _approveTokenIfNeeded(_token, address(pancakeRouter), _amount);
            uint256[] memory amounts = pancakeRouter.swapExactTokensForETH(
                _amount,
                0,
                _getPcsPath(_token, wNative),
                _receiver,
                block.timestamp
            );
            return amounts[amounts.length - 1];
        }

        if (_dex == Dex.Thena) {
            _approveTokenIfNeeded(_token, address(thenaRouter), _amount);
            uint256[] memory amounts = thenaRouter.swapExactTokensForETH(
                _amount,
                0,
                thenaRoutes[_token][wNative],
                _receiver,
                block.timestamp
            );
            return amounts[amounts.length - 1];
        }
        revert("invalid dex");
    }

    function _getPcsPath(address _from, address _to)
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
