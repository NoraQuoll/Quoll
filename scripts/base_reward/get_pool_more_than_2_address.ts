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
  const booster = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a";

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const contract = new web3.eth.Contract(WombatBooster, booster);

  // get all pool from 0 to 50
  for (let i = 0; i < 100; i++) {
    const data = await contract.methods.poolInfo(i).call();
    // console.log(data);
    const BaseRewardPoolV2 = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/BaseRewardPoolV2.sol/BaseRewardPoolV2.json",
        "utf-8"
      )
    ).abi;

    const contract_reward = new web3.eth.Contract(
      BaseRewardPoolV2,
      data.rewardPool
    );

    const dataReward = await contract_reward.methods.getRewardTokens().call();

    const ERC20 = JSON.parse(
      fs.readFileSync(
        "./artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json",
        "utf-8"
      )
    ).abi;

    const contract_lp = new web3.eth.Contract(ERC20, data.lptoken);

    const lp_name = await contract_lp.methods.name().call();

    console.log(
      i,
      ":",
      data.lptoken,
      ":",
      lp_name,
      ":",
      data.rewardPool,
      ":",
      dataReward,
      ":",
      data.masterWombatPid
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
