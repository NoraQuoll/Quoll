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

async function main() {
  const booster = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const contract = new web3.eth.Contract(WombatBooster, booster);

  // get all pool from 0 to 50
  for (let i = 0; i < 52; i++) {
    const data = await contract.methods.poolInfo(i).call();
    // console.log(data);
    const BaseRewardPool = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/BaseRewardPool.sol/BaseRewardPool.json",
        "utf-8"
      )
    ).abi;

    const contract_reward = new web3.eth.Contract(
      BaseRewardPool,
      data.rewardPool
    );

    const dataReward = await contract_reward.methods.getRewardTokens().call();

    console.log(i, ":", data.lptoken, ":", data.rewardPool, ":", dataReward);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
