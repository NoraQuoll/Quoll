import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

import * as fs from "fs";

dotenv.config();

const web3 = new Web3(process.env.RPC!);

const address = "0x3c6767DEE1699c24DFf92A11c4CC526C3D290915";

async function main() {
  const QMilesPool = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QMilesPool.sol/QMilesPool.json",
      "utf-8"
    )
  ).abi;

  const contract = new web3.eth.Contract(QMilesPool, address);

  const txData = await contract.methods
    .getStakingData("0x4401386f002d82eaaF1bE0CCa5b64D7a5e2c66E7")
    .call();

  console.log(txData);
}

main();
