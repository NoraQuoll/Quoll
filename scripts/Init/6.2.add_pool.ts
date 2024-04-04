// addPool

// contract WombatBooster
// _masterWombat
// _masterWombatPid
// _token
// _rewardPool

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const masterWombat = "0x489833311676B566f888119c29bd997Dc6C95830";

const data = {
  _masterWombatPid: "55",
  _token: "0xAdb7E966a2C740A4FbA5da11F6aEBAe4D3b6fcAE",
  _rewardPool: "0x3B4e48265aD0806309F29E0776FB6DB5E6AE881c",
};
async function main() {
  const booster = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a";

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WombatBooster);

  const txData = contract.methods
    .addPool(
      masterWombat,
      data._masterWombatPid,
      data._token,
      data._rewardPool,
      pancakePath,
      pancakeRouter,
      USDT
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("700000"),
    data: txData,
    to: booster,
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
