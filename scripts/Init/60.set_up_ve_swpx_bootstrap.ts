import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

// /**
// * MAINNET
//  * CONTRACT ADDRESS - REPLACE THESE ADDRESSES
//  */

// /*Token contracts*/
// const swpx = "0xa04bc7140c26fc9bb1f36b1a604c7a5a88fb0e70";
// const qSWPx = "0x448eb327112eEc55a08d8ED8500B89ec71e4ee32";
// const sqMilesPts = "0xc0325375D8C4a88f4e03fF293037a4262ded3343";

// /*PCS Bootstrap contracts*/
// const campaignLens = "0x62bf17dfBE4E1041687c92b9454F5e9a7aD579C9";
// const bootstrap = "0x0B474368f3c9D546c1887d6CF14687e495c92440";
// const voterProxy = "0x6Ecd3eBe8E4A8Fd474E2D4e10a09dC81d40bBb94";
// const depositor = "0x277Cd4b508aFbb75d182870409bBf610AFab5c7b";

// /*Other contracts*/
// const referral = "0x7BAd956Ad61CB21960Ff647B8fF4c291b44A6FD2";
// const rewardPool = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

// const masterChef = "0x0000000000000000000000000000000000000000"; //no masterchef yet
// const veSWPx = "0xaa30f0977620d4d46b3bb3cf0794fe645d576ca3";
// const booster = "0x0000000000000000000000000000000000000000"; // //no masterchef yet


// /*to set up reward pool*/
// const pid = "0";
// const rewardToken = "0xF02b3b6dE7a3f1ED2651e34812eA10C9850cAf19";
// const pancakePath = "0x3e981541d489B8ac5dE9016a0A67f3c2Eb369E66";
// const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";


/**
 * TESTNET
 * CONTRACT ADDRESS - REPLACE THESE ADDRESSES
 */

/*Token contracts*/
const swpx = "0x1bE1008A72433fd70718411211e49394Cd05Fc23";
const qSWPx = "0xE95384994aC95EDbf9DC1d755F8911709DDb1763";
const sqMilesPts = "0x3064973973495B319180E173E7133104DB2fA588";

/*PCS Bootstrap contracts*/
const campaignLens = "0xC8aC40E38a5CBe503B8e8d63C88DABEcCcccAc28";

const veSWPxBootstrapLens = "0x78e5866E0790CF5f6379723355232E0679b3e109";
const bootstrap = "0xbae85db6F51A300f799b86E7d1a3E244B6f8225C";
const veSWPxBootstrap = "0x2347337880f5a428deC100Be1e1efB5b5C024F32";
const voterProxy = "0xEbB82F097fEE2c641d6dC71F8b7C330CA108dF8C";
const depositor = "0xF1B13460Fadbac9C41c49EF481A90150eEac8486";

/*Other contracts*/
const referral = "0x69214E26a85e36A859474CbAf84f8a3998B8012b";
const rewardPool = "0xabc0f051f0c1E5C901C8833ae11336c21B5AF31d";

const masterChef = "0x0000000000000000000000000000000000000000"; //no masterchef yet
const veSWPx = "0x727B9feC11B1216dc2dDDFb93037D6F0342854d5";
const booster = "0x0000000000000000000000000000000000000000"; // //no masterchef yet


/*to set up reward pool*/
const pid = "0";
const rewardToken = "0x27DA92438996FbC6Bc3bEbA3d92610b2Ff3dC37a"; //quo
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

const VeSWPxBootstrap = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/Campaigns/VeSWPxBootstrap.sol/VeSWPxBootstrap.json",
    "utf-8"
  )
).abi;


const VeSWPxReferralBootstrapLens = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/VeSWPxReferralBootstrapLens.sol/VeSWPxReferralBootstrapLens.json",
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

const SQMilePTS = JSON.parse(
  fs.readFileSync("./artifacts/contracts/SQMilesPTS.sol/SQMilesPts.json", "utf-8")
).abi;

//qSWPx
const QuollExternalToken = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/QuollExternalToken.sol/QuollExternalToken.json",
    "utf-8"
  )
).abi;

const SWPxBaseRewardPoolV1 = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/SWPxBaseRewardPoolV1.sol/SWPxBaseRewardPoolV1.json",
    "utf-8"
  )
).abi;

async function setVeSWPxParamsBoostrap() {
  console.log("setVeSWPxParamsBoostrap: ");
  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VeSWPxBootstrap);

  const txData = contract.methods
    .setParams(voterProxy, qSWPx, veSWPx, campaignLens)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: veSWPxBootstrap,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}


async function setParamsVeSWPxReferralBootstrapLens(){
  console.log('setParamsVeSWPxReferralBootstrapLens');
    const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(VeSWPxReferralBootstrapLens);

  const txData = contract.methods
    .setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral,
      sqMilesPts,
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

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: veSWPxBootstrapLens,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);

}

// async function setParamsVoterProxy() {
//   console.log("setParamsVoterProxy");
//   const txCount = await web3.eth.getTransactionCount(user);

//   const contract = new web3.eth.Contract(SWPxVoterProxy);

//   const txData = contract.methods
//     .setParams(masterChef, swpx, veSWPx, booster, depositor)
//     .encodeABI();

//   //using ETH
//   const txObj = {
//     nonce: txCount,
//     gas: web3.utils.toHex(1000000),
//     gasPrice: await web3.eth.getGasPrice(),
//     data: txData,
//     to: voterProxy,
//     from: user,
//   };

//   const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

//   const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
//   console.log(result);
// }



//set access for veSWPxboostrap to call deposit
async function setAccessSWPxRefferalCampaignLens() {
  console.log("setAccessSWPxRefferalCampaignLens ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ReferralCampaignLens);

  const txData = contract.methods.setAccess(veSWPxBootstrap, true).encodeABI();

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


// allow VeSWPxBootstrap to call mint qSWPx
async function setOperator() {
  console.log("setOperator ");

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(QuollExternalToken);

  const txData = contract.methods.setOperator(veSWPxBootstrap, true).encodeABI();

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

  const contract = new web3.eth.Contract(VeSWPxBootstrap);

  const txData = contract.methods
    .initPool(startCampaign, endCampaign)
    .encodeABI();

  //using ETH
  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(1000000),
    gasPrice: await web3.eth.getGasPrice(),
    data: txData,
    to: veSWPxBootstrap,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}


// async function upgradeProxy() {
//   const proxyAddress = "0xEbB82F097fEE2c641d6dC71F8b7C330CA108dF8C";
//   const newImplementation = "0xA064985863F004C7c7B2b267f8E3Aaf0e868604b";
//   const proxyAdminAddress = "0xeB13Bb97e0cBE5562a0b01812cB9D35E35Bf9b9c";
//   const ProxyAdminABI = [
//       {
//           "inputs": [
//               { "internalType": "address", "name": "proxy", "type": "address" },
//               { "internalType": "address", "name": "implementation", "type": "address" }
//           ],
//           "name": "upgrade",
//           "outputs": [],
//           "stateMutability": "nonpayable",
//           "type": "function"
//       }
//   ];
//   const proxyAdmin = new web3.eth.Contract(ProxyAdminABI, proxyAdminAddress);

//   const txData = proxyAdmin.methods.upgrade(proxyAddress, newImplementation).encodeABI();

//   const txCount = await web3.eth.getTransactionCount(user);
//   const gasPrice = await web3.eth.getGasPrice();

//   const txObj = {
//       nonce: txCount,
//       gas: web3.utils.toHex(2000000),
//       gasPrice: gasPrice,
//       data: txData,
//       to: proxyAdminAddress,
//       from: user,
//   };

//   const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);
//   const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
//   console.log("Upgrade successful:", result.transactionHash);
// }


async function main() {
  /*==============SET PARAMS===============*/

  //await setVeSWPxParamsBoostrap();
  setParamsVeSWPxReferralBootstrapLens();
  
  
  /*==============SET AUTH===============*/
 
  // await setAccessSWPxRefferalCampaignLens();  //   set access for VeSWPxBoostrap to call deposit
  // await setOperator(); // allow VeSWPxBootstrap to call mint qSWPx
  
  
  /*=============START THE CAMPAIGN - ok===========*/
 //await initPool(1, 1000000000000);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
