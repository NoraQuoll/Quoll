
import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";


const web3 = new Web3(process.env.RPC!);
const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
    const veSWPxBootstrapLens = "0x78e5866E0790CF5f6379723355232E0679b3e109";


    const VeSWPxReferralBootstrapLens = JSON.parse(
        fs.readFileSync(
            "./artifacts/contracts/VeSWPxReferralBootstrapLens.sol/VeSWPxReferralBootstrapLens.json",
            "utf-8"
        )
    ).abi;


    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VeSWPxReferralBootstrapLens, veSWPxBootstrapLens);

    const txData = contract.methods
        .claimPts()
        .encodeABI();
    console.log(txData);

    //using ETH
    const calculateFeeData = await web3.eth.calculateFeeData()
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(2000000),
        gasPrice: (await web3.eth.getGasPrice()).toString(),
        data: txData,
        to: veSWPxBootstrapLens,
        from: user,

    };

    const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

    const result = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction!
    );
    console.log(result);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
