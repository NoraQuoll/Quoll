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
  const address = "0xc634c0a24bff88c015ff32145ce0f8d578b02f60";
  const vlPool = "0x956dbA3B34350a6cD662CF9281cbA54f074f48cf"

  const VlQuoV2 = JSON.parse(
    fs.readFileSync("./artifacts/contracts/VlQuoV2.sol/VlQuoV2.json", "utf-8")
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VlQuoV2);

  const txData = contract.methods
    .setRewardPool(vlPool)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("100000"),
    data: txData,
    to: address,
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
