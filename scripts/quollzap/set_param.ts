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
  const quoll_zap = "0xC17ADEE898ba323242B7C9654F617F7542128322";

  const QuollToken = JSON.parse(
    fs.readFileSync("./artifacts/contracts/QuollZap.sol/QuollZap.json", "utf-8")
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollToken, quoll_zap);

  const oldwNative = await contract.methods.wNative().call();
  const oldwNativeRelayer = await contract.methods.wNativeRelayer().call();
  const booster = await contract.methods.booster().call();

  console.log({ oldwNative, oldwNativeRelayer, booster });

  const txData = contract.methods
    .setParams(
      oldwNative,
      oldwNativeRelayer,
      booster,
      "0x61C855f3a9A1B3FeFD065DbE53c9DAf630F29Df8",
      "0x55d398326f99059fF775485246999027B3197955",
      "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF"
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: quoll_zap,
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
