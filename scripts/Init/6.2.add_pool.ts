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

// const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
// const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// const USDT = "0x55d398326f99059fF775485246999027B3197955";
// const masterWombat = "0x489833311676B566f888119c29bd997Dc6C95830";

// arb
const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const masterWombat = "0x62a83c6791a3d7950d823bb71a38e47252b6b6f4";

const data = {
  _masterWombatPid: "37",
  _token: "0xC9b6aCFB6BeB6Ee62e581D97290CEe0Ef375f796",
  _rewardPool: "0x2AF9E77432efa95b35B5d3ef3DC34f8863C4ABC2",
};
async function main() {
  const booster = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

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
