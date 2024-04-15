import * as dotenv from "dotenv";
import Web3 from "web3";

dotenv.config();

import * as fs from "fs";
import { getContracts } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const cakeLpLocker = "0x30EA75B12d8Ba911A028694b90ef1B9D4DE3673d";

  const CakeLpLocker = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/CakeLpLocker.sol/CakeLpLocker.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(CakeLpLocker);

  const txData = contract.methods.setBlock(true).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: cakeLpLocker,
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
