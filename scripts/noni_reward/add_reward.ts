import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const users = [
  "0x2Aa20A96e8a00Ce6e38EF215B2310efc539dC87D",
  "0x3f3c56118f54bfDE0d0f752074F094E42d708a9F",
  "0x5ab345eFDb9A2A1f9753f73fDaA684dc9133D214",
];

const data = ["6000", "7000", "8000"];

const rewardsToken = [
  "0xab1a4d4f1d656d2450692d237fdd6c7f9146e814",
  "0x3826f9505a039c5f92d3a2f4f1ae743934207ffb",
];
const rewardsAmount = ["10000000", "20000000"];

async function main() {
  const contract_address = "0x84e7fFb28Ddfb41B780BEeDEeC14fC04343f6533";

  const NoniHolderReward = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/NoniHolderReward.sol/NoniHolderReward.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(NoniHolderReward);
  //7776000
  const txData = contract.methods
    .addRewardForUser(users, data, rewardsToken, rewardsAmount)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: contract_address,
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
