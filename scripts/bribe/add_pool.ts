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
    "0xb4bEb0fDf0163a39D39b175942E7973da2c336Fb",
    "0xbCd5E80dAc3925416A8605b158Cac3a2cc1EBd6E",
    "0xbCf4C3AC471686E4bf7Bf2E38b2141eE1A47A661",
    "0xC46111930c0dE926A9B19264cABB9C588Bc2F1cF",
    "0xa3a1D6CdCCa1c755C08FF6a7aff103DacF7f31B1",
    "0x604D7B993d44Ff7Bf1c21b061454e5B98934D60c",
  ];
  const rewards = [
    "0x68177b01492E5fc3414756998558A3964c2dBcF2",
    "0x69BE05b0a198510014632Cd7b247879E2abF65CD",
    "0x4e1051121DD743214Ea7529CaEaaF72682217778",
    "0x9005b5437aE6633F14fF70Ff8177718b74A3CdED",
    "0xcdc18c87fcbc9b62ac1a0c6941a0eab682f36088",
    "0xe3008a234A7bf80398bb1BFbD4A18DE63d968e2f",
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
