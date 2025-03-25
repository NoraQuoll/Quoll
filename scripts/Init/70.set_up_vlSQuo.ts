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
const squo = "0xF02b3b6dE7a3f1ED2651e34812eA10C9850cAf19";
const vlSQuoV2 = "0x761b6C73831685d2b38b9CaC3eE6E0f18E539C02";
const vlSQuoRewardPool = "0x34a03F63Ef4144BEb8A726e16868f692Ea71C8e7";

//Other contract
// const swapxVoterProxy = "0xb0dB2a7Bc69D168C0b940e8AcF6F2AD7E1F566DC";
const treasury = "0xA4d81496E03f2449D2002632652d9b277f141345";


/**
 * CONTRACT ABI
 */

const VlSQuoV2 = JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/VlSQuoV2.sol/VlSQuoV2.json",
        "utf-8"
    )
).abi;

const VlSQuoRewardPool =  JSON.parse(
    fs.readFileSync(
        "./artifacts/contracts/VlSQuoRewardPool.sol/VlSQuoRewardPool.json",
        "utf-8"
    )
).abi;

async function setParamsVlSQuoV2() {
    console.log("setParamsVlSQuoV2: ");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlSQuoV2);

    const txData = contract.methods
        .setParams(squo, treasury)
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: vlSQuoV2,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
}

async function setAccessVlSQuoRewardPool () {
    console.log("setAccessVlSQuoRewardPool: ");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlSQuoRewardPool);

    const txData = contract.methods
        .setAccess(vlSQuoV2, true)
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: vlSQuoRewardPool,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);

}

async function setRewardPool(){
    console.log("setRewarPool");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlSQuoV2);

    const txData = contract.methods
        .setRewardPool(vlSQuoRewardPool)
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: vlSQuoV2,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
}

async function main() {
    /*==============SET PARAMS===============*/
    await setParamsVlSQuoV2();
    await setRewardPool();


    /*==============SET AUTH===============*/
    await setAccessVlSQuoRewardPool();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
