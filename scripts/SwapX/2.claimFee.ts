// Set Access wombatBooster to contract QUO
// Contract QUO
// Accessable to wombatBooster

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { parseEther } from "ethers/lib/utils";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const swpxVoterProxy = "0xf928eb071248B8f79D435c6D0BfB0AbAA6803c06";

const fees = [
    "0xC79784CcD9B3Cdb41d954A1c63C2335453E7e28B",
    "0xbA04B1558e3E065aEed1390E8DaB248544a7b7F0",
    "0x6D271093330eaF0d19d18051940FE995f2132fdb",
    "0x5a91361daF7633FD8CE648A11D5c5D3b9c3f4553",
    "0x88C3C242909b00687be983c3335d0A60AB99a354",
    "0x40F3478074cC39B89fB489297d2Bcd2b083E6cB3"
];
const tokens = [
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70"],
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b"],
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b"]
];
async function main() {
  const SWPxVoterProxy = JSON.parse(
    fs.readFileSync(
      "artifacts/contracts/SWPxVoterProxy.sol/SWPxVoterProxy.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxVoterProxy);

  const txData = contract.methods
  .claimFees(fees, tokens)
  .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(10000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: swpxVoterProxy,
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
