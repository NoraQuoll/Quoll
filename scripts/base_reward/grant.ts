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
    "0x921f5F899955168254f61BE9a98c359c3fa085E3",
    "0xa67181a5643Bf1d0778f849032214861Db462714",
    "0x92a5A6ce9D562000be824d27C3da66Ac92944dc5",
    "0x645AC47112251F7ca2519F8F93845a6408d06266",
    "0xC0967970b153D8f8DF7Cf9529c288CcCf258cEf0",
    "0xe189032a19e02745E1bf319914279e14731c2D62",
    "0xe6c19054a903D6A57ab0Ed07425949e168248868",
    "0x0aBd42Ac2Ef70c0D7AB012b6B5c00e25b35f5b1E",
  ];

  for (let i = 0; i < base_reward_pools.length; i++) {
    const BaseRewardPoolV2 = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/BaseRewardPoolV2.sol/BaseRewardPoolV2.json",
        "utf-8"
      )
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(BaseRewardPoolV2);

    const txData = contract.methods
      .grant("0xC17ADEE898ba323242B7C9654F617F7542128322", true)
      .encodeABI();
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
