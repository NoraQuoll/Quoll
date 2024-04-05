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
    // "0xeE7BED6C37b8cDA71Ac56099996daC3F51508EBe",
    "0xe94259F185Aa1824E82Ee46317A1877d59C7BF07",
    "0xFe4a7B6623e8ea70ED3317b7eFfE1D2Cb5f3C754",
    "0xE08d8f553Ad90F351a41De61Dc472252cE248aa7",
    "0x2AF9E77432efa95b35B5d3ef3DC34f8863C4ABC2",
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
