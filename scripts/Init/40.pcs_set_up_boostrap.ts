
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
const cake = "0x05545432189eF90BAFCAE7858c84dE9FADc7f772";
const qCake = "0x7308A30dE50da10367d2a12Ab4408B2681Bd0Ec7";
const squad = "0xE2cC38f99a0Da2c1E6575dB349C5541aaf118121";
const qMilesPts = "0xd36B8A9cEb69C288B393A31Cd7e0e8946F8E900c";

/*PCS Bootstrap contracts*/
const campaignLens = "0x373e6aA1055124DE64642A8cda35E598Ec0089E3";
const bootstrap = "0x1Ac09ecdf1aD811F0C3929FcDCb5520c99b43088";
const voterProxy = "0x11fa1099e6c16D5e48849818b6d88Ab833A8c1de";
const depositor = "0x360bd6D54975B0d130139f481cE0D87190b43178";

/*Other contracts*/
const referral = "0xE129e385b7399622C9666C51025C3FdEf85f6c30";
const rewardPool = "0xBa530ACBe7Af1c820192A31AdFd0858E333Affb0";

const masterChef = "0x73feaa1eE314F8c655E354234017bE2193C9E24E";
const veCake = "0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB";
const booster = "0x1Ac09ecdf1aD811F0C3929FcDCb5520c99b43088";


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

    
    /*=============START THE CAMPAIGN - ok===========*/
    //await initPool (1, 1000000000000); 
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
