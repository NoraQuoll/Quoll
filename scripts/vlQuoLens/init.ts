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
  const vlLens = "";
  const root = "0xca9f1f6e6a6e2f24a761c8a824e2ac4a2406e81ec69a04cb39959088ee03ffb3";
  const sum = 0;
  const startTime = "";
  const QUO = "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF";
  const penalty = 50;
  const vlQUOV2 = "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60";

  const VlQuoV2Lens = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/VlQuoV2Lens.sol/VlQuoV2Lens.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VlQuoV2Lens);

  const txData = contract.methods
    .initUserGetReward(root, sum, startTime, QUO, penalty, vlQUOV2)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: vlLens,
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
