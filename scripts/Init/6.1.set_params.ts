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
  const booster = await getContracts()[process.env.NETWORK_NAME!][
    "WombatBooster"
  ]["address"];

  const voter_proxy = await getContracts()[process.env.NETWORK_NAME!][
    "WombatVoterProxy"
  ]["address"];

  const wom_depositor = await getContracts()[process.env.NETWORK_NAME!][
    "WomDepositor"
  ]["address"];

  const qWom = await getContracts()[process.env.NETWORK_NAME!]["qWOM"][
    "address"
  ];

  const quo = await getContracts()[process.env.NETWORK_NAME!]["QUO"]["address"];

  const vlQuo = await getContracts()[process.env.NETWORK_NAME!]["VlQuoV2"][
    "address"
  ];

  const quoRewardPool = await getContracts()[process.env.NETWORK_NAME!][
    "QuoRewardPool"
  ]["address"];

  const qWomRewardPool = await getContracts()[process.env.NETWORK_NAME!][
    "qWOMReward"
  ]["address"];

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WombatBooster);

  const txData = contract.methods
    .setParams(
      process.env.WOM,
      voter_proxy,
      wom_depositor,
      qWom,
      quo,
      vlQuo,
      quoRewardPool,
      qWomRewardPool,
      process.env.TREASURY
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
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
