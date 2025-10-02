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

const bootstrap = "0x63bDD4feaCBA482ee1eAAb1d2f494f57f907a1bF";

async function main() {
  const VeTHEbootstrap = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/Campaigns/CampaignRewardPoolV3.sol/CampaignRewardPoolV3.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VeTHEbootstrap);

  const txData = contract.methods
    .setParams(
      "0x0427dF380aECdB4657b1334aB608DA16b7526Ab2",
      "0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11",
      "0x7ca6a84eb52478df142981a590c7836d5b49d179",
      "0x92B667AC28773De43A3F831BCcDca2eF17a43722"
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    // gasLimit: web3.utils.toHex("30000"),
    data: txData,
    to: bootstrap,
    gas: web3.utils.toHex(80000),
    gasPrice: await web3.eth.getGasPrice(),
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
