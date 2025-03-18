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

const contractAddress = "0x7c2487882F36B5Dcc1be07eE5e62303E89238bA3";
const newRecipient = "0xC822DcaD6f4e7CD8B6e80CAd1AFA3F97ae8579CD" 
async function main() {
  const ICOPreseedSale = JSON.parse(
    fs.readFileSync(
    "./artifacts/contracts/ICO/ICOPreseed.sol/ICOPreseedSale.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ICOPreseedSale);

  const txData = contract.methods.setRecipient(newRecipient).encodeABI();
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
