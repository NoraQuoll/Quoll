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

//testnet
// const qwom_stakingToken = "0xA22e2f3047e7D1F0cD864A4EB9A89D298Ca171C5";
// const wom = "0x7bfc90abeeb4138e583bfc46abc69de34c9abb8b";
// const quo = "0x4F62160edB7584Bca1436e8eAD3F58325e6298eD";
// const wom_depositor = "0x7a08F6e28D9508A812Ad2CCa1d6207B5eCf063C4";
// const vlQuov2 = "0x494d1dC23e342156c3A3ea9007A70681B81928D7";
// const treasury = "0xc3a20F9D15cfD2224038EcCC8186C216366c4BFd";

// mainnet
const qwom_stakingToken = "0x0fE34B8aaAf3f522A6088E278936D10F934c0b19";
const wom = "0xAD6742A35fB341A9Cc6ad674738Dd8da98b94Fb1";
const quo = "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF";
const wom_depositor = "0xDFd69E83d4A5d2E15D5Dcf2F4f52CDdC44CB93Fc";
const vlQuov2 = "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60";
const treasury = "0xAB7ABCF6D4d1A75F00804dCBF5551794eB6c87B1";

const address = "0x25430b479EA82180b7F5fDadbBB27C311D61e778";

async function main() {
  const CampaignRewardPoolV2 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/Campaigns/CampaignRewardPoolV2.sol/CampaignRewardPoolV2.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(CampaignRewardPoolV2);

  const txData = contract.methods
    .setParams(qwom_stakingToken, wom, quo, wom_depositor, vlQuov2, treasury)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
    data: txData,
    to: address,
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
