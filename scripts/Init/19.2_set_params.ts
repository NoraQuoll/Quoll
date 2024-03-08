// setParams

// contract WombatBooster
// _wom
// _voterProxy
// _womDepositor
// _qWom
// _quo
// _vlQuo
// _quoRewardPool
// _qWomRewardPool
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

async function main() {
  const contract_address = "0x18c7ED62ADB937e51928ECc9E4234103C0Fb1Fa8";
  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const booster = await getContracts()[process.env.NETWORK_NAME!][
    "WombatBooster"
  ]["address"];

  const pancakePath = await getContracts()[process.env.NETWORK_NAME!][
    "PancakePath"
  ]["address"];

  const contract = new web3.eth.Contract(WombatBooster);

  const txData = contract.methods
    .setParams(
      booster,
      2,
      "0x5f451d5143511FF27c4C252E974Fd2e69c4EfBEB",
      process.env.USDT,
      pancakePath,
      process.env.PANCAKE_ROUTER,
      process.env.USDT
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: contract_address,
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
