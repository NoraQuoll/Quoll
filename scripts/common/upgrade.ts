import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const upgradesContract = ["0x81eFaFf9Ea94c424eB48c408303Ff37562e3E537"];
async function main() {
  const proxyAdmin = "0xd8751F87f90D7459A3500D974C9363302c67E7e8";

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
        "0x353E47a6af1B2D7EFEb81eC12EB54BC85413179C"
      )
      .encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("3000000"),
      data: txData,
      to: proxyAdmin,
      from: user,
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
