// setBribeCallerFee

// Contract wombatVoterProxy
// _bribeCallerFee: 50

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const _bribeCallerFee = 50;

async function main() {
  const wombatVoterProxy = await getContracts()[process.env.NETWORK_NAME!][
    "WombatVoterProxy"
  ]["address"];

  const WombatVoterProxy = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatVoterProxy.sol/WombatVoterProxy.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WombatVoterProxy);

  const txData = contract.methods
    .setBribeCallerFee(_bribeCallerFee)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: wombatVoterProxy,
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
