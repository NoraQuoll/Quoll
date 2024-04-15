// Set Param

// contract masterChef
// _quo,
// _rewardPerBlock: 100000000000000000000
// _startBlock: 0
// _bonusEndBlock: 0

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const _rewardPerBlock = "100000000000000000000";
const _startBlock = 0;
const _bonusEndBlock = 0;

async function main() {
  const master_chef = await getContracts()[process.env.NETWORK_NAME!][
    "QuollMasterChef"
  ]["address"];

  const quo = await getContracts()[process.env.NETWORK_NAME!]["QUO"]["address"];

  const QuollMasterChef = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollMasterChef.sol/QuollMasterChef.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollMasterChef);

  const txData = contract.methods
    .setParams(quo, _rewardPerBlock, _startBlock, _bonusEndBlock)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: master_chef,
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
