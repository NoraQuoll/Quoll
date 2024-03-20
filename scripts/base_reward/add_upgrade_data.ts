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

const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
async function main() {
  const addressses = [
    "0x740373DEeDEf2427341E4a81ff59e64cB59c6113",
    "0x022F84442B2789051488A8Eb980D0E8E51B1a057",
    "0x86d9f986C7a2C54FDFA154EaA45E5849965fa3B5",
    "0x5C1bF3b637Ce9aA5Ef8A1619d24b173b8B56aE74",
    "0x9c813b456F7047F994f74cAddEb0E2C25989841d",
    "0x8b18bF89A3571c153cCa3235fc0d5b656E96deb6",
    "0xf477962327B94C9CE286480BF931D94428A153Fb",
    "0xDf1F204c626c0E8DdE279Ae85EeAA737bfc46d35",
    "0x09225fb450E7E820ffd7F3ae5e233CA130F4D377",
    "0x245ce08e0BD1C5E1Ff3f93204B9626c767017923",
    "0x4b3d5c2cD7a413d23C43E132dffA28b57175369D",
    "0x2eeE9A93De4e228Ebfd14eD1F8B2e0667DFA6f0C",
    "0x1C96b4Aaab7203874693a5D4F69C7dFdf570807F",
    "0xb91d28e498c65bC39d86197a4EF2A188a426844a",
    "0x065825c867131284Edd29E0995eb1F776d0c6B5b",
    "0x31B6Aa0c6E95e8Ce028efFB1DE9164CA89FB3028",
    "0x19F3Ec29F06473F3ca2A0c50090162E972e2f4De",
    "0x6Bf162Fa5480723a64dd4aDFFB6A0728E612C313",
    "0x8E83D1173331E0954B68e511a300FF47DCa278b1",
    "0xCD4b2D96c165e9c3dA03d7fCE487e660723233aa",
    "0x131088d5f3AabDbCfACC3D08EBC5fb130BA55662",
    "0x757F99c2FB3901Db59067aC3601beED21e6b232d",
    "0x17aB87772088d2495Ef6c0f1C9002A708820970b",
    "0x95A58AEC9ba44528A742a0DcA1ae23A1d9E1E616",
    "0x1787b212A96eBA9EAa8c55B30D4dB6e5bc6EBD8d",
    "0x4B0F4b2B77AEcbd7e010619B90040c194851E272",
    "0x1aF9d495576B26ec2307375Aeba8D6614cE64773",
    "0x099f9Cfb662E404a4857bD038f59CF587fA7EfF1",
    "0xa3686d769a206D52b6E05C19832b23f9b4355Cf9",
    "0xded6E7dA853930c46518E4C4F6eC8A41E2A744F9",
    "0xe312F21a0eA280B3c9D05A82F3b3719e9Ed859F5",
    "0x2486e5873a33d5Ff740f504D30B89f81AFc5b569",
    "0x3d8B149DAd4F0E84a3850cd4a072871Be4cE2830",
    "0x8766936cAB849031727f4fdD22149975C5b405b4",
    "0xEc9bf28098E407203869C62f1e893B20F663d4Bd",
    "0x51AE455C2a9F3C71CCEc3Fe0Ff32bAE82c204065",
    "0x10bB50651ba3a6959eEA23B0d0Dd0e4A26dfda95",
    "0xDeD19a90a9FB4EfEC1CBB0B600860E416E7d2968",
    "0x518328560Ff542aA1A51eCfF8530933BA17b92E7",
    "0x5746A4FdBD44Db23Ffe6c2ACFc2224417e7a301A",
    "0x971a34307b0A8C185F9E67bCf3D56dd12446eac1",
    "0x3C29304292B03511Fc47BA78017247F46f6d3f41",
    "0xb8799329A57E2218b1BAEC935D463284edb0AC05",
    "0x4dFf8d7691D45a52e1b3b1271496C3cAD7794F8F",
    "0x38A11FceFB97758Db0e5acdbe1ECD55a0AEF1F3C",
    "0x5aD6B955E991B2c1Fd4Bd4De619b61B13AB30d12",
    "0x067Ba47e85f036185C996014a624B36BBb2C6D8A",
    "0x43adaF12b2700E55c8f20dc4F68AC21f2242601b",
    "0xe9dA0ab48606Ddf7b623E730a47aa212Cb1F69ba",
    "0x0A9674E7ecd7Bd7286b010A3cf41d05c7fFD5390",
  ];

  const BaseRewardPool = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/BaseRewardPool.sol/BaseRewardPool.json",
      "utf-8"
    )
  ).abi;

  for (let i = 0; i < addressses.length; i++) {
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(BaseRewardPool, addressses[i]);

    const txData = contract.methods
      .addUpgradeData(pancakePath, pancakeRouter, USDT)
      .encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
      nonce: txCount,
      gasLimit: web3.utils.toHex("30000000"),
      data: txData,
      to: addressses[i],
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
