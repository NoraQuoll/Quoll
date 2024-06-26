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

  // const txData = contract.methods
  //   .setParams(
  //     process.env.WOM,
  //     voter_proxy,
  //     wom_depositor,
  //     qWom,
  //     quo,
  //     vlQuo,
  //     quoRewardPool,
  //     qWomRewardPool,
  //     process.env.TREASURY
  //   )
  //   .encodeABI();

  // testnet
  const txData = contract.methods
    .setParams(
      "0x7BFC90abeEB4138e583bfC46aBC69De34c9ABb8B",
      "0xF93620e056Fdd00fEF0ef52F3D0C6bBEd2f01a8D",
      "0x9E27d59Cef58D08b8a3be3010478250B426d4705",
      "0xA22e2f3047e7D1F0cD864A4EB9A89D298Ca171C5",
      "0x4F62160edB7584Bca1436e8eAD3F58325e6298eD",
      "0x494d1dC23e342156c3A3ea9007A70681B81928D7",
      "0x5B87ACabB607D4d14D2A795884Dbcb669A3b495A",
      "0xC549B2917A1e4a5263eD9cF5950A417E3B3e8e87",
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
