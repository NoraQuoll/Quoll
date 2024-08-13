// set operator

// contract qWOM
// _operator: womDepositor contract

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
    // const qWom = await getContracts()[process.env.NETWORK_NAME!]["qTHE"][
    //   "address"
    // ];

    // const operator = await getContracts()[process.env.NETWORK_NAME!][
    //   "VeTHEbootstrap"
    // ]["address"];

  const qWom = "0x342435347F5FEd4F9ACd18185883C1E2F6E26d1A";

  const operator = "0x95F2caA1d11122245B0Ad1c638C466e60AA4426E";

  const QuollExternalToken = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollExternalToken.sol/QuollExternalToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollExternalToken);

  const txData = contract.methods.setOperator(operator, true).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: qWom,
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
