// setParams

// Contract Wom depositor

// _wom: WOM token
// _voterProxy: wombatVoterProxy contract
// _qWOM: qWOM
// _qWomRewardPool

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const qWomRewardPoolLock = "0x5b37CdFE77250F56A75c8550391F1D06912E05F0";

async function main() {
  const wom_depositor = "0x9E27d59Cef58D08b8a3be3010478250B426d4705";

  const WomDepositor = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WomDepositor.sol/WomDepositor.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WomDepositor);

  const txData = contract.methods
    .setUpgradeParams(qWomRewardPoolLock)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: wom_depositor,
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
