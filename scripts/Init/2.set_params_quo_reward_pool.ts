// Set Param

// contract quoRewardPool
// _stakingToken: ..
// WOM
// _womDepositor: womDepositor contract
// _qWomRewards: qWOMReward Contract
// _qWomToken
// _booster: wombatBooster contract

// Set Access wombatBooster to contract QUO
// Contract QUO
// Accessable to wombatBooster

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
  const quoll_reward_pool = await getContracts()[process.env.NETWORK_NAME!][
    "QuoRewardPool"
  ]["address"];

  const quoll = await getContracts()[process.env.NETWORK_NAME!]["QUO"][
    "address"
  ];

  const wom_depositor = await getContracts()[process.env.NETWORK_NAME!][
    "WomDepositor"
  ]["address"];

  const q_wom_reward = await getContracts()[process.env.NETWORK_NAME!][
    "qWOMReward"
  ]["address"];

  const q_wom = await getContracts()[process.env.NETWORK_NAME!]["qWOM"][
    "address"
  ];

  const booster = await getContracts()[process.env.NETWORK_NAME!][
    "WombatBooster"
  ]["address"];

  const QuoRewardPool = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuoRewardPool.sol/QuoRewardPool.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuoRewardPool);

  const txData = contract.methods
    .setParams(
      quoll,
      process.env.WOM,
      wom_depositor,
      q_wom_reward,
      q_wom,
      booster
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: quoll_reward_pool,
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
