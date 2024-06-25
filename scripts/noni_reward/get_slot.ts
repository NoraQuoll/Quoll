import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

async function main() {
  const contract_address = "0x84e7fFb28Ddfb41B780BEeDEeC14fC04343f6533";

  const NoniHolderReward = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/NoniHolderReward.sol/NoniHolderReward.json",
      "utf-8"
    )
  ).abi;

  const contract = new web3.eth.Contract(NoniHolderReward, contract_address);
  //7776000
  const txData = await contract.methods.claimRewardSlot("0x2Aa20A96e8a00Ce6e38EF215B2310efc539dC87D").call();
  console.log(txData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
