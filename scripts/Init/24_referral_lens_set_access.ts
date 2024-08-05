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
//   const quoll_token = await getContracts()[process.env.NETWORK_NAME!][
//     "ReferralCampaignLens"
//   ]["address"];

//   const operator = await getContracts()[process.env.NETWORK_NAME!][
//     "CampaignRewardPoolV3"
//   ]["address"];

  const quoll_token = "0x92B667AC28773De43A3F831BCcDca2eF17a43722"

  const operator = "0x63bDD4feaCBA482ee1eAAb1d2f494f57f907a1bF"

  const QuollToken = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollToken);

  const txData = contract.methods.setAccess(operator, true).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("10000000"),
    data: txData,
    to: quoll_token,
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
