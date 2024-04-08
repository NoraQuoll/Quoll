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
    "0x7EEac069B71c6419e814A04E93205d8048d01919",
    "0xD4409d280B6EFA1365b18b3d5720E2084fFfEF5e",
    "0xf8faD8577F4A18228e679Cbd7B18910143784ABb",
    "0x54Ada2a3c47299191d9a3a7EE95Ddd6676039D9D",
    "0xA9f00bd0D01E5ba2C54E87076bE24A21F9Ef16eC",
    "0xdb6B5DA83fc1c68F94BFaB82bE242b4AE597e29c",
  ];

  const quollZap = "0x1EffF8c5157c7912c289a7EF721009f17504F940";

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
