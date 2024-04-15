// setParams

// Contract Wom depositor

// _wom: WOM token 
// _voterProxy: wombatVoterProxy contract
// _qWOM: qWOM
// _qWomRewardPool


import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const wom = "0x7BFC90abeEB4138e583bfC46aBC69De34c9ABb8B";
const voterProxy = "0x81eFaFf9Ea94c424eB48c408303Ff37562e3E537";
const qWom = "0xA22e2f3047e7D1F0cD864A4EB9A89D298Ca171C5";
const qWomRewardPool = "0xC549B2917A1e4a5263eD9cF5950A417E3B3e8e87"

async function main() {
  const wom_depositor = "0x7a08F6e28D9508A812Ad2CCa1d6207B5eCf063C4"

  const WomDepositor = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WomDepositor.sol/WomDepositor.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WomDepositor);

  const txData = contract.methods
    .setParams(wom, voterProxy, qWom, qWomRewardPool)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: wom_depositor,
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
