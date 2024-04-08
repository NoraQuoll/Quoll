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

const datas = [
  // {
  //   _masterWombatPid: "31",
  //   _token: "0x2427b7226D0B938C99f8d7deE0B393f74a20A633",
  //   _rewardPool: "0x7EEac069B71c6419e814A04E93205d8048d01919",
  // },
  // {
  //   _masterWombatPid: "39",
  //   _token: "0x1388Dec2096B0d4F63c9a72CA9f843e19C75Feba",
  //   _rewardPool: "0xD4409d280B6EFA1365b18b3d5720E2084fFfEF5e",
  // },
  // {
  //   _masterWombatPid: "40",
  //   _token: "0x8f617D85dD96429C6D2d9f575e539988C84fa743",
  //   _rewardPool: "0xf8faD8577F4A18228e679Cbd7B18910143784ABb",
  // },
  // {
  //   _masterWombatPid: "41",
  //   _token: "0xD91aD58305C266aC38288DfBc600a5ef50d3F3aa",
  //   _rewardPool: "0x54Ada2a3c47299191d9a3a7EE95Ddd6676039D9D",
  // },
  {
    _masterWombatPid: "42",
    _token: "0xA9AE4B5d5BDDc61436d50fcEc067D149737A9200",
    _rewardPool: "0xA9f00bd0D01E5ba2C54E87076bE24A21F9Ef16eC",
  },
  {
    _masterWombatPid: "43",
    _token: "0x199415b8cEdd4b561A313ffBb4832999b71A3B49",
    _rewardPool: "0xdb6B5DA83fc1c68F94BFaB82bE242b4AE597e29c",
  },
];
async function main() {
  const booster = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  for (let i = 0; i < datas.length; i++) {
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(WombatBooster);

    const txData = contract.methods
      .addPool(
        masterWombat,
        datas[i]._masterWombatPid,
        datas[i]._token,
        datas[i]._rewardPool,
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
