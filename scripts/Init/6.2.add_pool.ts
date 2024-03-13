// addPool

// contract WombatBooster
// _masterWombat
// _masterWombatPid
// _token
// _rewardPool

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;


const _rewardPool = "0x13405dd07a4b1DA46d38044Cb36Db2006e230aCA";

const data = {
  _masterWombatPid: "4",
  _token: "0x51A6c3D50C6Cff243fED2EFc62c13c7e0472AC18"
}
async function main() {
  const booster = await getContracts()[process.env.NETWORK_NAME!][
    "WombatBooster"
  ]["address"];


  const pancakePath = await getContracts()[process.env.NETWORK_NAME!][
    "PancakePath"
  ]["address"];

  const WombatBooster = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(WombatBooster);

  const txData = contract.methods
    .addPool(
      process.env.WOMBAT_MASTERCHEF,
      data._masterWombatPid,
      data._token,
      _rewardPool,
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
    to: booster,
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
