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

  const campaign = "0x272de3b04288610E0aB48FCD1bf172f76f5d12Fc";

  const qThe = "0x0427df380aecdb4657b1334ab608da16b7526ab2";

  const the = "0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11";

  const thenaDepositor = "0xFbbC05A0AbC238FD27007884956ea3AC7F9325DD";

  const referralCampaignLens = "0x3B29DA50936922461bdf62a2D1f99D9AD8f0eCc1";

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
