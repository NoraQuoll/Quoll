
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
const cake = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
const qCake = "0x3f4066C900e66532780d2e367755ABbe1CBf0fBE";
const squad = "0x0a8901b0E25DEb55A87524f0cC164E9644020EBA";
const qMilesPts = "0xCBD28bDF789422c3e4fF37834ADe0d0e804b8f50";

/*PCS Bootstrap contracts*/
const campaignLens = "0x2484feB840fCdb505fc0739d86518CAc1F14e7B3";
const bootstrap = "0x3EdC82340720e89d7e799814Bb1517CACC2Fcc3B";
const voterProxy = "0x39088C414beca8977cC90247FE887Ea8b2E2dC6f";
const depositor = "0x0a47D6B3CeB8eaaa570fE8670183060382Cb5975";

/*Other contracts*/
const referral = "0x06B5c419ec807Acb6CdF2c2Fab91889cBe79302f";
const rewardPool = "0x6054501B371Cc8859ed5BcaD982b5952a46a0276";

const masterChef = "0x73feaa1eE314F8c655E354234017bE2193C9E24E";
const veCake = "0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB";
const booster = "0x1Ac09ecdf1aD811F0C3929FcDCb5520c99b43088";

/*to set up reward pool*/
const pid = "REPLACE-THIS-ADDRESS";
const stakingToken =  "REPLACE-THIS-ADDRESS";
const rewardToken = "REPLACE-THIS-ADDRESS";
const pancakePath = "REPLACE-THIS-ADDRESS";
const pancakeRouter = "REPLACE-THIS-ADDRESS";
const usdtAddress = "REPLACE-THIS-ADDRESS";

/**
 * CONTRACT ABI
 */
const ReferralCampaignLens = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/PCSReferralCampaignLens.sol/PCSReferralCampaignLens.json",
        "utf-8"
    )
).abi;

const PCSVoterProxy = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/PCSVoterProxy.sol/PCSVoterProxy.json",
        "utf-8"
    )
).abi;

const PCSBootstrap = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/Campaigns/PCSBootstrap.sol/PCSBootstrap.json",
        "utf-8"
    )
).abi;

const PCSDepositor = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/PCSDepositor.sol/PCSDepositor.json",
        "utf-8"
    )
).abi;

const Referral = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/Referral.sol/Referral.json",
        "utf-8"
    )
).abi;

const QMilePTS = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/QMilesPts.sol/QMilesPts.json",
        "utf-8"
    )
).abi;

const QuollExternalToken = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/QuollExternalToken.sol/QuollExternalToken.json",
        "utf-8"
    )
).abi;

const PCSBaseRewardPoolV1 = JSON.parse(
    fs.readFileSync(
       "./artifacts/contracts/PCSBaseRewardPoolV1.sol/BaseRewardPoolV1.json",
        "utf-8"
    )
).abi;

async function setParamsBoostrap() {
    console.log('setParamsBoostrap: ');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(PCSBootstrap);

    const txData = contract.methods.setParams(
        qCake,
        cake,
        depositor,
        campaignLens
    ).encodeABI();

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
    console.log('setParamsDepositor: ');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(PCSDepositor);

    const txData = contract.methods.setParams(
      cake,
      voterProxy,
      qCake,
      rewardPool
    ).encodeABI();

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
    console.log('setParamsVoterProxy');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(PCSVoterProxy);

    const txData = contract.methods.setParams(
        masterChef,
        cake,
        veCake,
        booster,
        depositor
    ).encodeABI();

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
    console.log('setParamsCampaignLens: ');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(ReferralCampaignLens);

    const txData = contract.methods
        .setParams(
            "1000000000000000000000",
            "500000000000000000000",
            "200000000000000000000",
            referral,
            qMilesPts,
            squad,
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
                "500000000000000000",
                "750000000000000000",
                "1000000000000000000",
                "2000000000000000000",
                "2500000000000000000",
                "3000000000000000000",
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

async function setParamsPCSBaseRewardPoolV1(){
    console.log('setParamsPCSBaseRewardPool');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(PCSBaseRewardPoolV1);

    const txData = contract.methods.setParams(
        booster,
        pid,
        stakingToken,
        rewardToken,
        pancakePath,
        pancakeRouter,
        usdtAddress

    ).encodeABI();

     //using ETH
     const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: rewardPool,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
}

async function addUpgradeDataPCSBaseRewardPoolV1 (){
    console.log('addUpgradeDataPCSBaseRewardPoolV1');
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(PCSBaseRewardPoolV1);

    const txData = contract.methods.addUpgradeData(
        pancakePath,
        pancakeRouter,
        usdtAddress
    ).encodeABI();

     //using ETH
     const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: rewardPool,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);

}

//set access for boostrap to call deposit
async function setAccessPCSRefferalCampaignLens () {
    console.log('setAccessPCSRefferalCampaignLens ');

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

// set access for PCSRefferalCampaignLens to call Referral
async function setAccessReferral() {
    console.log('setAccessReferral ');
    
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

//set access for PCSRefferalCampaignLens to mint QMIlesPTs
async function setAccessQMilePTS() {
    console.log('setAccessQMilePTS ');
  
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
    console.log('setOperator ');
    
    const txCount = await web3.eth.getTransactionCount(user);
    
    const contract = new web3.eth.Contract(QuollExternalToken);

    const txData = contract.methods.setOperator(depositor, true).encodeABI();

      //using ETH
      const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: qCake,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
    
}

async function initPool (startCampaign: number, endCampaign: number) {
    console.log('init Pool ');

      
    const txCount = await web3.eth.getTransactionCount(user);
    
    const contract = new web3.eth.Contract(PCSBootstrap);

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
    // await setParamsBoostrap();  // test ok 
    // await setParamsDepositor(); //test ok
    // await setParamsCampaignLens(); //test ok
    //await setParamsVoterProxy();  //test ok
    
    
    /*==============SET AUTH===============*/
    //set access for boostrap to call deposit - ok
    //await setAccessPCSRefferalCampaignLens(); 

    //set access for PCSRefferalCampaignLens to call Referral - ok
    //await setAccessReferral();

    //set access for PCSRefferalCampaignLens to mint QMIlesPTs - ok
    //await setAccessQMilePTS() 

    // allow Depositor to call mint qCake - ok
    //await setOperator();

    /*==================REWARD POOL ================= */
    //await setParamsPCSBaseRewardPoolV1();
    //await addUpgradeDataPCSBaseRewardPoolV1()
    /*=============START THE CAMPAIGN - ok===========*/
    //await initPool (1, 1000000000000); 
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
