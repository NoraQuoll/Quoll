// Set Access wombatBooster to contract QUO
// Contract QUO
// Accessable to wombatBooster

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { parseEther } from "ethers/lib/utils";
dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const thenaDelegatePool = "0xf928eb071248B8f79D435c6D0BfB0AbAA6803c06";

const pools = [
    "0xdE9e9B9F2FE180A40908aCbb144b15ac6bA54E54",
    "0x959664AEF4656c425E362df9B705293dcB9f8f4d",
];
const weights = [50, 50];

async function main() {
    const ThenaDelegatePool = JSON.parse(
        fs.readFileSync(
            "./artifacts/contracts/qThe/ThenaDelegatePool.sol/ThenaDelegatePool.json",
            "utf-8"
        )
    ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(ThenaDelegatePool);

    const txData = contract.methods
        .updateWeights(pools, weights)
        .encodeABI();
    console.log(txData);

    //using ETH
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(10000000),
        gasPrice: await web3.eth.getGasPrice(),
        data: txData,
        to: thenaDelegatePool,
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
