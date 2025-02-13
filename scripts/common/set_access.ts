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
  const quoll_token = "0xCBD28bDF789422c3e4fF37834ADe0d0e804b8f50";
  
  const QuollToken = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollToken);

  const txData = contract.methods.setAccess("0x3c6767DEE1699c24DFf92A11c4CC526C3D290915", true).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    data: txData,
    to: quoll_token,
    from: user,
    gasPrice: await web3.eth.getGasPrice(),
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
