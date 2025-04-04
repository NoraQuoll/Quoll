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

const thenaDelegatePool = "0x5d34F95157558af63dfD8091dA329D36Fe5C64b6";

const rewardPool  = "0xcDc6A14D995BC755B3DA8736308C0d0c34DA06eE";

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
        .setRewardPool(rewardPool)
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
