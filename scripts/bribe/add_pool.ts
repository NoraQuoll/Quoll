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
  const bribeManager = "0x2906d3392d90563DaB2548C0F353a4491F8E9bCc";

  const BribeManager = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/BribeManager.sol/BribeManager.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(BribeManager);

  // lp + reward
  const txData = contract.methods
    .addPool(
      "0xdFDE04743d88B58F36dF1834BC0969DAc9B2A9b3",
      "0x5d7B0d6Ea4Bcd11167c07A1eFCcAf0d61905fcE6"
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: bribeManager,
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
