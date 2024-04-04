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
  const base_reward_pools = [
    "0x525fEd1fce20e64baAf27f5883C37b31773eb729",
    "0x83998D9DDBa0281102f15f2B08eCa9B3400886CE",
    "0x8C8194b75cE095124A32dCfA05B7a41e8F23d1BE",
    "0x255436BC0f2e9000565671F106bb20DbcBc2A83D",
    "0xfD8b81786e714Bc2DbA94Af89d8566e85fb98EBF",
    "0x98cAFa03c410B8F1E4Be7AF1863Cc05976C7a2Fd",
    "0x3B4e48265aD0806309F29E0776FB6DB5E6AE881c",
  ];

  const quollZap = "0xC17ADEE898ba323242B7C9654F617F7542128322";

  for (let i = 0; i < base_reward_pools.length; i++) {
    const BaseRewardPoolV2 = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/BaseRewardPoolV2.sol/BaseRewardPoolV2.json",
        "utf-8"
      )
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(BaseRewardPoolV2);

    const txData = contract.methods.grant(quollZap, true).encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("3000000"),
      data: txData,
      to: base_reward_pools[i],
      from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction!
    );
    console.log(result);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
