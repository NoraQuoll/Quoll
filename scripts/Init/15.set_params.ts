// setParams

// Contract NativeZapper
// _wNative
// _pancakeRouter: 
// _pancakePath:

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
  const nativeZapper = await getContracts()[process.env.NETWORK_NAME!][
    "NativeZapper"
  ]["address"];

  const pancakePath = await getContracts()[process.env.NETWORK_NAME!][
    "PancakePath"
  ]["address"];

  const NativeZapper = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/NativeZapper.sol/NativeZapper.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(NativeZapper);

  const txData = contract.methods
    .setParams(
      process.env.WNATIVE,
      process.env.PANCAKE_ROUTER,
      pancakePath,
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: nativeZapper,
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
