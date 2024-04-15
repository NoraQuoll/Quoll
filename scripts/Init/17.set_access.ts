// Set Access wombatBooster to contract QUO
// Contract QUO
// Accessable to wombatBooster

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
  const virtualReward = [
    "0x6A5D589B4AE82D13C740E8c55C72d3A21233a4a8",
    "0xC89915A33fC6BA13836ACF436128a0e0A0C00Ac0",
    "0x1E0316d611B533d9e86E76ff17Fc0ed4fc8a685c",
    "0x5d7B0d6Ea4Bcd11167c07A1eFCcAf0d61905fcE6",
  ];

  const voterProxy = "0xe96c48C5FddC0DC1Df5Cf21d68A3D8b3aba68046";

  for (let i = 0; i < virtualReward.length; i++) {
    const VirtualBalanceRewardPool = JSON.parse(
      fs.readFileSync(
        "./artifacts/contracts/VirtualBalanceRewardPool.sol/VirtualBalanceRewardPool.json",
        "utf-8"
      )
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VirtualBalanceRewardPool);

    const txData = contract.methods.setAccess(voterProxy, true).encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("3000000"),
      data: txData,
      to: virtualReward[i],
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
