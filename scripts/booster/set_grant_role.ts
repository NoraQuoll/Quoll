// setAccess

// Contract vlQuoV2
// address: wombatBooster
// status: true

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
  const addresses = [
    "0xCE0A901a04F8b8d3FC2977373b6a6cdEE0bc0289",
    "0x996B4c9ce1EA2c798E760f7D512964d0020b0127",
    "0xd75dE26B0e850cFd70f1F8C701e15cD8214bfc09",
  ]; // address of rewarder
  const quollZap = "0x1EffF8c5157c7912c289a7EF721009f17504F940";
  // booster and quollZap 

  for (let i = 0; i < addresses.length; i++) {
    const VlQuoV2 = JSON.parse(
      fs.readFileSync("./artifacts/contracts/BaseRewardPoolV2.sol/BaseRewardPoolV2.json", "utf-8")
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlQuoV2);

    const txData = contract.methods.grant(quollZap, true).encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("300000"),
      data: txData,
      to: addresses[i],
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
