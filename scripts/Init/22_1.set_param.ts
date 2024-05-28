// setParams

// contract WombatBooster
// _wom
// _voterProxy
// _womDepositor
// _qWom
// _quo
// _vlQuo
// _quoRewardPool
// _qWomRewardPool
// _treasury: Address

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
  const contract_address = "0x5b37CdFE77250F56A75c8550391F1D06912E05F0";
  const booster = "0x8DFA987C3bE619C8e8B8B68B12e2A38852E8a5FB";
  const pid = "0";
  const stakingToken = "0xA22e2f3047e7D1F0cD864A4EB9A89D298Ca171C5";
  const rewardToken = "0x7BFC90abeEB4138e583bfC46aBC69De34c9ABb8B";
  const BaseRewardPoolV1WithLockqWom = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/BaseRewardPoolV1WithLockqWom.sol/BaseRewardPoolV1WithLockqWom.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(BaseRewardPoolV1WithLockqWom);

  const txData = contract.methods
    .setParams(booster, pid, stakingToken, rewardToken)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: contract_address,
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
