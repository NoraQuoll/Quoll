import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { parseEther } from "ethers/lib/utils";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const contractAddress = "0x88264D50AB1F633277dE60A981Bc532440bf7577";
const whitelist = [
    "0x3e8734ec146c981e3ed1f6b582d447dde701d90c",
    "0x3E8eDbB38a52b0299Ef8fdf585bd45Bee4886f61",
    "0xde8e0c378b50118b30512386dee6b0475d96173a"
] 
async function main() {
  const ICOPreseedSale = JSON.parse(
    fs.readFileSync(
    "./artifacts/contracts/ICO/ICOPreseed.sol/ICOPreseedSale.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ICOPreseedSale);

  const txData = contract.methods.addWhitelist(whitelist).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: contractAddress,
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
