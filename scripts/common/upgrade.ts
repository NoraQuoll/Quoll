import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const proxyAdmin = await getContracts()[process.env.NETWORK_NAME!][
    "DefaultProxyAdmin"
  ]["address"];

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

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ProxyAdmin);

  const txData = contract.methods
    .upgrade(
      "0x944B7ee4113A0bd0b916cE752193D7A4A56e402d",
      "0x5b4338769dDC38Dad63a3aacE05a465C1e9B9943"
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: proxyAdmin,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
