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
  // const campaignLens = await getContracts()[process.env.NETWORK_NAME!][
  //   "ReferralBootstrapLens"
  // ]["address"];

  // const referral = await getContracts()[process.env.NETWORK_NAME!]["Referral"][
  //   "address"
  // ];

  // const qMilesPts = await getContracts()[process.env.NETWORK_NAME!][
  //   "QMilesPts"
  // ]["address"];

  const campaignLens = "0xeE68e08e79DCb2458A3423C926e1E992675B9341";

  const referral = "0xE54b7AcA99c5F4996Ffe5946FAD88d536A200011";

  const qMilesPts = "0xd36B8A9cEb69C288B393A31Cd7e0e8946F8E900c";

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
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral,
      qMilesPts,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "0",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
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
