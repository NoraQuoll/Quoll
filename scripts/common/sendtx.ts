import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk =
  "9c215d4b98cb403170438b835c556540d241b9a64b76016c1ff1184b023f8bfb";

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const contract = "0x5b37CdFE77250F56A75c8550391F1D06912E05F0";

  const operator = await getContracts()[process.env.NETWORK_NAME!][
    "WombatBooster"
  ]["address"];

  const QuollToken = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const txData =
    "0xa69df4b5";
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: contract,
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
