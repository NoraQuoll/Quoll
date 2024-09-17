import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

import * as fs from "fs";

dotenv.config();

const web3 = new Web3(process.env.RPC!);

const address = "0x956dbA3B34350a6cD662CF9281cbA54f074f48cf";

async function main() {
  const VlQuoRewardPool = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/VlQuoRewardPool.sol/VlQuoRewardPool.json",
      "utf-8"
    )
  ).abi;

  const contract = new web3.eth.Contract(VlQuoRewardPool, address);

  const txData = await contract.methods
    .getReward()
    .call({ from: "0x5c137F6A5C4983D49EfA2D5e02d1313fda1B27AB" });

  console.log(txData);
}

main();
