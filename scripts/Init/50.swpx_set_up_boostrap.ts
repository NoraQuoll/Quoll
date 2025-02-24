import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

/**
 * CONTRACT ADDRESS - REPLACE THESE ADDRESSES
 */

/*Token contracts*/
const swpx = "0xa04bc7140c26fc9bb1f36b1a604c7a5a88fb0e70";
const qSWPx = "0x448eb327112eEc55a08d8ED8500B89ec71e4ee32";
const qMilesPts = "0x52e56c4cA847b50fb3AE18a78e41396036A799BB";

/*PCS Bootstrap contracts*/
const campaignLens = "0x62bf17dfBE4E1041687c92b9454F5e9a7aD579C9";
const bootstrap = "0xd88D9a5Fe5cb9D9839c3205D89dA1BF82c318fC6";
const voterProxy = "0x6Ecd3eBe8E4A8Fd474E2D4e10a09dC81d40bBb94";
const depositor = "0x7b42F9679ECf4A947F3Eda2c44BDA4CB1114662E";

/*Other contracts*/
const referral = "0x01e6ef4913F9Dc4530dE8135f9579D3acD932935";
const rewardPool = "0xabc0f051f0c1E5C901C8833ae11336c21B5AF31d";

const masterChef = "0x0000000000000000000000000000000000000000";
const veSWPx = "0xaa30f0977620d4d46b3bb3cf0794fe645d576ca3";
const booster = "0x0000000000000000000000000000000000000000";

/*to set up reward pool*/
const pid = "0";
const rewardToken = "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF";
const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";

/**
 * CONTRACT ABI
 */
const ReferralCampaignLens = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/SWPxReferralCampaignLens.sol/SWPxReferralCampaignLens.json",
    "utf-8"
  )
).abi;

const SWPxVoterProxy = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/SWPxVoterProxy.sol/SWPxVoterProxy.json",
    "utf-8"
  )
).abi;

const SWPxBootstrap = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/Campaigns/SWPxBoostrap.sol/SWPxBoostrap.json",
    "utf-8"
  )
).abi;

const SWPxDepositor = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/SWPxDepositor.sol/SWPxDepositor.json",
    "utf-8"
  )
).abi;

const Referral = JSON.parse(
  fs.readFileSync("./artifacts/contracts/Referral.sol/Referral.json", "utf-8")
).abi;

const QMilePTS = JSON.parse(
  fs.readFileSync("./artifacts/contracts/QMilesPts.sol/QMilesPts.json", "utf-8")
).abi;

const QuollExternalToken = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/QuollExternalToken.sol/QuollExternalToken.json",
    "utf-8"
  )
).abi;

const PCSBaseRewardPoolV1 = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/PCSBaseRewardPoolV1.sol/PCSBaseRewardPoolV1.json",
    "utf-8"
  )
).abi;

async function setParamsBoostrap() {
  console.log("setParamsBoostrap: ");
  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxBootstrap);

  const txData = contract.methods
    .setParams(qSWPx, swpx, depositor, campaignLens)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: bootstrap,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

async function setParamsDepositor() {
  console.log("setParamsDepositor: ");
  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxDepositor);

  const txData = contract.methods
    .setParams(swpx, voterProxy, qSWPx, rewardPool)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: depositor,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

async function setParamsVoterProxy() {
  console.log("setParamsVoterProxy");
  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxVoterProxy);

  const txData = contract.methods
    .setParams(masterChef, swpx, veSWPx, booster, depositor)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: voterProxy,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

async function setParamsCampaignLens() {
  console.log("setParamsCampaignLens: ");
  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ReferralCampaignLens);

  const txData = contract.methods
    .setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral,
      qMilesPts,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "0",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
      ],
      [
        "1000000000000000000",
        "1250000000000000000",
        "1500000000000000000",
        "3000000000000000000",
        "4000000000000000000",
        "5000000000000000000",
      ]
    )
    .encodeABI();
  //console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: campaignLens,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

// async function setParamsPCSBaseRewardPoolV1() {
//   console.log("setParamsPCSBaseRewardPool");
//   const txCount = await web3.eth.getTransactionCount(user);

//   const contract = new web3.eth.Contract(PCSBaseRewardPoolV1);

//   const txData = contract.methods
//     .setParams(
//       booster,
//       pid,
//       qCake,
//       rewardToken,
//       pancakePath,
//       pancakeRouter,
//       usdtAddress
//     )
//     .encodeABI();

//   //using ETH
//   const txObj = {
//     nonce: txCount,
//     gas: web3.utils.toHex(1000000),
//     gasPrice: await web3.eth.getGasPrice(),
//     data: txData,
//     to: rewardPool,
//     from: user,
//   };

//   const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

//   const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
//   console.log(result);
// }

// async function addUpgradeDataPCSBaseRewardPoolV1() {
//   console.log("addUpgradeDataPCSBaseRewardPoolV1");
//   const txCount = await web3.eth.getTransactionCount(user);

//   const contract = new web3.eth.Contract(PCSBaseRewardPoolV1);

//   const txData = contract.methods
//     .addUpgradeData(pancakePath, pancakeRouter, usdtAddress)
//     .encodeABI();

//   //using ETH
//   const txObj = {
//     nonce: txCount,
//     gas: web3.utils.toHex(1000000),
//     gasPrice: await web3.eth.getGasPrice(),
//     data: txData,
//     to: rewardPool,
//     from: user,
//   };

//   const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

//   const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
//   console.log(result);
// }

//set access for boostrap to call deposit
async function setAccessSWPxRefferalCampaignLens() {
  console.log("setAccessSWPxRefferalCampaignLens ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ReferralCampaignLens);

  const txData = contract.methods.setAccess(bootstrap, true).encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: campaignLens,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

// set access for SWPxRefferalCampaignLens to call Referral
async function setAccessReferral() {
  console.log("setAccessReferral ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(Referral);

  const txData = contract.methods.setAccess(campaignLens, true).encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: referral,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

//set access for SWPxRefferalCampaignLens to mint QMIlesPTs
async function setAccessQMilePTS() {
  console.log("setAccessQMilePTS ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QMilePTS);

  const txData = contract.methods.setAccess(campaignLens, true).encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: qMilesPts,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}
// allow Depositor to call mint qCake
async function setOperator() {
  console.log("setOperator ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollExternalToken);

  const txData = contract.methods.setOperator(depositor, true).encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: qSWPx,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

async function initPool(startCampaign: number, endCampaign: number) {
  console.log("init Pool ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(SWPxBootstrap);

  const txData = contract.methods
    .initPool(startCampaign, endCampaign)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: bootstrap,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

async function main() {
  /*==============SET PARAMS===============*/
 // await setParamsBoostrap(); // test ok done 

  //await setParamsDepositor(); //test ok done
  //await setParamsCampaignLens(); //test ok
  //await setParamsVoterProxy(); //test ok
  /*==============SET AUTH===============*/
  //   set access for boostrap to call deposit - ok
  //await setAccessSWPxRefferalCampaignLens(); //done
  //   set access for PCSRefferalCampaignLens to call Referral - ok
  //await setAccessReferral();
  //   set access for PCSRefferalCampaignLens to mint QMIlesPTs - ok
  await setAccessQMilePTS(); //-done
  //   allow Depositor to call mint qCake - ok
   await setOperator(); // done
  /*==================REWARD POOL ================= */
  //await setParamsPCSBaseRewardPoolV1();
  //await addUpgradeDataPCSBaseRewardPoolV1()
  /*=============START THE CAMPAIGN - ok===========*/
 //await initPool(1, 1000000000000);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
