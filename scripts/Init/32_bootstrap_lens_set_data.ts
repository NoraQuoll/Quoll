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
    const campaignLens = await getContracts()[process.env.NETWORK_NAME!][
      "ReferralBootstrapLens"
    ]["address"];

    const referral = await getContracts()[process.env.NETWORK_NAME!][
      "Referral"
    ]["address"];

    const qMilesPts = await getContracts()[process.env.NETWORK_NAME!][
      "QMilesPts"
    ]["address"];

  // const campaignLens = "0x92B667AC28773De43A3F831BCcDca2eF17a43722";

  // const referral = "0xf0f00b5f9fc4D33D4B2640Aa328f4780DF8AA9F9";

  // const qMilesPts = "0xCBD28bDF789422c3e4fF37834ADe0d0e804b8f50";

  const ReferralBootstrapLens = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/ReferralBootstrapLens.sol/ReferralBootstrapLens.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ReferralBootstrapLens);

  const txData = contract.methods
    .setParams(
      "1000",
      "500000000000000000000",
      "200",
      referral,
      qMilesPts,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "0",
        "1001",
        "5001",
        "10001",
        "50001",
        "100001",
      ],
      [
        "1000000000000000000",
        "1250000000000000000",
        "1500000000000000000",
        "3000000000000000000",
        "4000000000000000000",
        "5000000000000000000",
      ]
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("10000000"),
    data: txData,
    to: campaignLens,
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
