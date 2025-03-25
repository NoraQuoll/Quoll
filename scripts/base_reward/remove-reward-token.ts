// Set Voter

// Contract wombatVoterProxy
// voter: voter contract from wombat

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const index = 0;

async function main() {
  const address = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

  const SWPxBaseRewardPoolV1 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/SWPxBaseRewardPoolV1.sol/SWPxBaseRewardPoolV1.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxBaseRewardPoolV1);

  const txData = contract.methods.removeRewardToken(index).encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(8000000),
    gasPrice: await web3.eth.getGasPrice(),
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
