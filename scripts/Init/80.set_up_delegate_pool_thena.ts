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
const quo = "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF";
const vlQuoV2 = "0x584F3fa0466f369d1Ba5635dFcF507aA956274c7";

//Other contract
const thenaVoterProxy = "0xc0cd42017380cf4dc76adb8535cdF76b8f3fE398";
const nativeZapper = "0x61C855f3a9A1B3FeFD065DbE53c9DAf630F29Df8"
const thenaDelegatePool = "0xA94ad5201d4AEFe96d970a3c614199aBC685D782";
const treasury = "";

/**
 * CONTRACT ABI
 */

const VlQuoV2 = JSON.parse(
    fs.readFileSync(
       "./artifacts/contracts/VlQuoV2.sol/VlQuoV2.json",
        "utf-8"
    )
).abi;

const NativeZapper =  JSON.parse(
    fs.readFileSync(
       "./artifacts/contracts/NativeZapper.sol/NativeZapper.json",
        "utf-8"
    )
).abi;

const ThenaDelegatePool =  JSON.parse(
    fs.readFileSync(
       "./artifacts/contracts/qThe/ThenaDelegatePool.sol/ThenaDelegatePool.json",
        "utf-8"
    )
).abi;



async function setVoterProxyAtVlQuoV2 () {
    console.log("setVoterProxyAtVlQuoV2: ");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VlQuoV2);

    const txData = contract.methods
        .setVoterProxy(vlQuoV2, true)
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: vlQuoV2,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);

}

async function setAccessNativeZapper () {
    console.log("setVoterProxyAtVlQuoV2: ");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(NativeZapper);

    const txData = contract.methods
        .setAccess(thenaDelegatePool, true)
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: nativeZapper,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
}


async function setParamsDelegatePool () {
    console.log("setParamsDelegatePool: ");
    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(ThenaDelegatePool);

    const txData = contract.methods
        .setParams(
            quo,
            thenaVoterProxy,
            thenaDelegatePool,
            nativeZapper,
            treasury
        )
        .encodeABI();

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(1000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: thenaDelegatePool,
        from: user,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
    console.log(result);
}


async function main() {
    setParamsDelegatePool();
    setAccessNativeZapper();
    setVoterProxyAtVlQuoV2();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
