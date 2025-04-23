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

const users = [
    '0x4015786119590E79Bc0C28Be82f64c3e9A7c01d0',
    '0x7F5362951c7Ba111c5e196b7DC6c8F61b876e345',
    '0xfA2a6Feb4D3e11c650ba067ea53e24a42EC935Eb',
    '0x7307E16a2C4d197AFd2498E42F5327Ee0b72e78F',
    '0x429AD64Fec22Bc0616D56ED2A48D32dBc9C8D0D6',
    '0xd6B8BbcD887f2FF49465e4624E11D2bBf42E1c41',
    '0xC1F466b79bd98Fb0b14a9504eAae0b41acb2AB82',
    '0x78C12f471dd8227E96fe0989cAA4cB7e17b29fE0'
];
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
        .resetDelegateVoteByOwner(users)
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
