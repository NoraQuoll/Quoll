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
  const contract_address = "0x9eFD7DB4cd66C4b8B7Ef89bfcCd4eB47B08227BF";
  const booster = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a";
  const pid = "0";
  const stakingToken = "0x0fE34B8aaAf3f522A6088E278936D10F934c0b19";
  const rewardToken = "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF";
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
    gasLimit: web3.utils.toHex("300000"),
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
