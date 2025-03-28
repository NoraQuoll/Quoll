
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

const bribes = [
    "0xdE9e9B9F2FE180A40908aCbb144b15ac6bA54E54", 
    "0x959664AEF4656c425E362df9B705293dcB9f8f4d", 
    "0xd2Fb9082591df7bE105B38a4c76264f190a30dc2",
    "0x167B0cFbE74F5271d192DB81552f3b5a7c13861f",
    "0xf3c2BbC729e9a171905cfD5861239F16A75a8d40",
    "0xB23298b45a669128E290289Af13e3217b07eE0a7"
];
const tokens = [
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70", "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70", "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"],
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70", "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"],
    ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70", "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"],
    ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", " 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70"]
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
  .claimBribes(bribes, tokens)
  .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
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
