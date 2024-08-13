// setAccess

// Contract vlQuoV2
// address: wombatBooster
// status: true

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
  const addresses = [
    "0x087BEf4508cd453C4e586ab049766F4d2bCdbD91",
    "0x5E5829e2B7896D2Bf51A5B7228F0E7a8eB77c3BE",
    "0x00565c5122A4019Ca94FAD315768A4A8Ee73d9d3",
  ]; // address of rewarder
  const wombatBooster = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a";

  for (let i = 0; i < addresses.length; i++) {
    const VlQuoV2 = JSON.parse(
      fs.readFileSync("./artifacts/contracts/VlQuoV2.sol/VlQuoV2.json", "utf-8")
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlQuoV2);

    const txData = contract.methods.setAccess(wombatBooster, true).encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("300000"),
      data: txData,
      to: addresses[i],
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
