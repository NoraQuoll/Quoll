// setParams

// Contract vlQuoV2
// _quo: quo
// _bribeManager: bribeManager
// _treasury: Address


import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const quo = "0x4F62160edB7584Bca1436e8eAD3F58325e6298eD";
const bribeManager = "0x37F8168Ba41a2265cCB05a6C1FC295b599ae2AC3";
const treasury = "0xc3a20F9D15cfD2224038EcCC8186C216366c4BFd";

async function main() {
  const address = "0x494d1dC23e342156c3A3ea9007A70681B81928D7"

  const VlQuoV2 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/VlQuoV2.sol/VlQuoV2.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VlQuoV2);

  const txData = contract.methods
    .setParams(quo, bribeManager, treasury)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
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
