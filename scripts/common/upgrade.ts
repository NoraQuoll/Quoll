import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const upgradesContract = ["0xF49f0A8AF5d9BB380AF2c2724b9EA3f9e75732c4"];
async function main() {
  const proxyAdmin = "0x887a9c74EC188829d09c2Eaf77d41fB9DD97bFc5";

  const ProxyAdmin: any = [
    {
      inputs: [
        { internalType: "address", name: "initialOwner", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "contract TransparentUpgradeableProxy",
          name: "proxy",
          type: "address",
        },
        { internalType: "address", name: "newAdmin", type: "address" },
      ],
      name: "changeProxyAdmin",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract TransparentUpgradeableProxy",
          name: "proxy",
          type: "address",
        },
      ],
      name: "getProxyAdmin",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract TransparentUpgradeableProxy",
          name: "proxy",
          type: "address",
        },
      ],
      name: "getProxyImplementation",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract TransparentUpgradeableProxy",
          name: "proxy",
          type: "address",
        },
        { internalType: "address", name: "implementation", type: "address" },
      ],
      name: "upgrade",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract TransparentUpgradeableProxy",
          name: "proxy",
          type: "address",
        },
        { internalType: "address", name: "implementation", type: "address" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "upgradeAndCall",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ];

  for (let i = 0; i < upgradesContract.length; i++) {
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(ProxyAdmin);

    const txData = contract.methods
      .upgrade(
        upgradesContract[i],
        // contract booster
        // addPool
        // "0x91c0855ca33807619599c50867e4D9E0FC5c617a",
        // current
        // "0xb91d28e498c65bc39d86197a4ef2a188a426844a"
        "0xa79e5Fd69E8C3E312f7f23cB34a5F07FF29B3599"
      )
      .encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gas: web3.utils.toHex(1000000),
      data: txData,
      to: proxyAdmin,
      from: user,
      gasPrice: await web3.eth.getGasPrice()
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction!
    );
    console.log(result);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
