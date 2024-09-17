// setParams

// Contract BaseRewardPool
// _booster: wombatBooster contract
// _pid:
// staking token: qWOM
// _rewardToken: WOM

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const booster = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a";
const pid = "0";
const stakingToken = "0x0427dF380aECdB4657b1334aB608DA16b7526Ab2";
const rewardToken = "0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11";
const pancakePath = "0x0000000000000000000000000000000000000000";
const pancakeRouter = "0x0000000000000000000000000000000000000000";
const usdtAddress = "0x0000000000000000000000000000000000000000";

async function main() {
  const qTHERewarder = "0xF7aa5CdF9469144AcdFA322b274BCed5Fc2937B5";

  const BaseRewardPoolV1 = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/BaseRewardPoolV1.sol/BaseRewardPoolV1.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(BaseRewardPoolV1);

  const txData = contract.methods
    .setParams(
      booster,
      pid,
      stakingToken,
      rewardToken,
      pancakePath,
      pancakeRouter,
      usdtAddress
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    data: txData,
    to: qTHERewarder,
    from: user,
    gasPrice: await web3.eth.getGasPrice(),
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
