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

const referral = "0x7bad956ad61cb21960ff647b8ff4c291b44a6fd2";

async function main() {
  const Referral = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Referral.sol/Referral.json", "utf-8")
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(Referral);

  const txData = contract.methods
    .createReferralLinkByOwner(
      [
        "0xB7391a758869f5a9950506BA403366f03caF3a29",
        "0x2bD239af25E8b13c23A7c25265766A48eCa00663",
        "0xD515119740FB47d8Cf5D2a629993fE5Dd1e62ae1",
        "0xf0b1E4C87A1aD06a30D32225d79A899A89E1339B",
        "0x94bB26991e1D2c25feb6553ce968525cA4D405dE",
        "0x57f3BF353bDD865b5281A0dcc9515715a40a3c3b",
      ],
      [
        "1b96bc9a-55e5-4f82-a280-af3b51f7585f",
        "2e02d4cd-3e61-40e2-a6c1-a94fc06056d2",
        "328772bc-be11-4deb-bbab-7f565af54ab1",
        "8885339f-667a-43e2-8a2f-00351266ffa7",
        "edae00fc-771f-48e4-9ed3-04c734c2d548",
        "f2a90b7d-51ce-43c4-9f27-487fbc151e9b",
        "2f399166-5783-427a-a1f7-d5c616d461de",
        "2ca6bebd-dcd3-41df-9ac2-f223c4b01128",
        "b7e69285-cd2e-4091-bc19-9325230263f3",
        "bf747371-37d5-4afb-a8b2-729a94301f7d",
        "1db9748b-b62c-4767-8031-021ade085c29",
        "2f9da15f-a28b-4d7d-ad21-8e3d22b8f39c",
        "c035a15c-48bb-4c69-9927-aebdb6904164",
        "d646a149-f8cb-4a8a-a408-322101c5c445",
        "7ab444b2-f0f5-46ad-9f9d-8e56826a328f",
      ]
    )
    .encodeABI();
  console.log(txData);

//   //using ETH
//   const txObj = {
//     nonce: txCount,
//     gasLimit: web3.utils.toHex("3000000"),
//     data: txData,
//     to: referral,
//     from: user,
//   };

//   const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

//   const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
//   console.log(result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
