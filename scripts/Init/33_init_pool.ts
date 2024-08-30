// setParams

// Contract Campaign
// _quo: quo
// _bribeManager: bribeManager
// _treasury: Address

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";
import { getGasPrice } from "web3/lib/commonjs/eth.exports";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const campaign = "0x7f676d86c367c1dCd5780381af48a3555367d748";

  const VeTHEbootstrap = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/Campaigns/VeTHEbootstrap.sol/VeTHEbootstrap.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VeTHEbootstrap);

  const txData = contract.methods
    .initPool(
      1723450389,
      1727683200
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(300000),
    data: txData,
    to: campaign,
    from: user,
    gasPrice: await web3.eth.getGasPrice()
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
