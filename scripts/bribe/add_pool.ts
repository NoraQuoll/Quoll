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
  const bribeManager = "0x9bB0cE4a4000c1127E3D420713E0c77d7E32086b";

  const lps = [
    "0x9a24055aF7dc84df05906aCfbf5DE694cd3e975D",
    "0x9121af8B7Bbdd76dc6f67051c417D007483C6BE2",
    "0x35876Fd35cfe001c9Ff20d96E9e3C40D21dC6563",
    "0x08C6E91BDF4b7133381a3CC06e497bF14Bd3Fd4D",
    "0x87800497C0f2b565578A483E6Ea06744F15eD525"
  ];
  const rewards = [
    "0x450D7c3090CECB5448ab42407B4aa683C3e15395",
    "0xe9d76b3Bb66fB5a438067d216F49b9A20f0183B2",
    "0xEeC7eB3Aa3e1C50297b2aa2B8AfBd9440746a809",
    "0x5CC1e4fa464F7adcF6f4d1DE76E761Dc54ab8eE3",
    "0xD03a0671b5F52A5287ce876CC61990fADdC8265a",
  ];

  for (let i = 0; i < lps.length; i++) {
    const BribeManager = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/BribeManager.sol/BribeManager.json",
        "utf-8"
      )
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(BribeManager);

    // lp + reward
    const txData = contract.methods.addPool(lps[i], rewards[i]).encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("3000000"),
      data: txData,
      to: bribeManager,
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
