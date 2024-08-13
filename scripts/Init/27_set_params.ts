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

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  //   const campaign = await getContracts()[process.env.NETWORK_NAME!][
  //     "CampaignRewardPoolV3"
  //   ]["address"];

  //   const qThe = await getContracts()[process.env.NETWORK_NAME!]["qTHE"][
  //     "address"
  //   ];

  //   const the = await getContracts()[process.env.NETWORK_NAME!]["THE"]["address"];

  //   const thenaDepositor = await getContracts()[process.env.NETWORK_NAME!][
  //     "ThenaDepositor"
  //   ]["address"];

  //   const referralCampaignLens = await getContracts()[process.env.NETWORK_NAME!][
  //     "ReferralCampaignLens"
  //   ]["address"];

  const campaign = "0xeBb023beD168ceFF7DC45a825C58A9027bc5758d";

  const qThe = "0x342435347F5FEd4F9ACd18185883C1E2F6E26d1A";

  const the = "0x386c7Aee7641D2D10969a3b2DE04209AAE370212";

  const thenaDepositor = "0x776B65B6f8dD03CD98460c9E9afbF7cA61481A10";

  const referralCampaignLens = "0x43FcD7a4f33F7a234cfE3641A7B98E8723954249";

  const CampaignRewardPoolV3 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/Campaigns/CampaignRewardPoolV3.sol/CampaignRewardPoolV3.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(CampaignRewardPoolV3);

  const txData = contract.methods
    .setParams(qThe, the, thenaDepositor, referralCampaignLens)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
    data: txData,
    to: campaign,
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
