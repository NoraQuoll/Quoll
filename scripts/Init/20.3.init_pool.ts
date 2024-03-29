// setAccess

// Contract Campaign
// address: wombatBooster
// status: true

// Quo_amount: 10M
// lockWeeks: 26
// penalty: 70%
// duration: 15 days

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
  const address = "0x25430b479ea82180b7f5fdadbbb27c311d61e778";

  const CampaignRewardPoolV2 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/Campaigns/CampaignRewardPoolV2.sol/CampaignRewardPoolV2.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(CampaignRewardPoolV2);

  const txData = contract.methods.initPool(26, 7000, 1296000).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
    data: txData,
    to: address,
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
