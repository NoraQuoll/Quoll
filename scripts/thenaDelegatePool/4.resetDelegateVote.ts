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
        '0x80b3D7735bbaa17B27D45Acc17c3c233c32f4a59',
        '0x4229F5429301aB35a079Ca91db550d40FC43eB19',
        '0x28aa4F9ffe21365473B64C161b566C3CdeAD0108',
        '0x4015786119590E79Bc0C28Be82f64c3e9A7c01d0',
        '0x7F5362951c7Ba111c5e196b7DC6c8F61b876e345',
        '0xb7077d09D5969037F716659d4E96c336Bf0d8654',
        '0x51bb4bd9be3d250F25D8717678BD4dB681270450',
        '0xfA2a6Feb4D3e11c650ba067ea53e24a42EC935Eb',
        '0x7307E16a2C4d197AFd2498E42F5327Ee0b72e78F',
        '0x3D6991085Ab1ae3926cB96f25684C40a364B6856',
        '0x429AD64Fec22Bc0616D56ED2A48D32dBc9C8D0D6',
        '0xF1C3e6007B157f92E26589adFb98A9496E6B4169',
        '0x57F80991F3ea04E6E84A936eD3539F4B6C2605e2',
        '0xd6B8BbcD887f2FF49465e4624E11D2bBf42E1c41',
        '0xD4cD9eE834971a462bEcf5E7088594f656A572A7',
        '0xD852B04757BA2a21AD6c63913aE6ee6Bb899a5E7',
        '0xC1F466b79bd98Fb0b14a9504eAae0b41acb2AB82',
        '0xaDF5349Df8186379A4E8C919c5d6fb447F8956F0',
        '0x78C12f471dd8227E96fe0989cAA4cB7e17b29fE0',
        '0x927d81b91c41D1961e3A7d24847b95484e60C626',
        '0xaF0114811527B29E07B374EcA3114dBE20992c79',
        '0xDBafa316C236c090e7633Cf7CF5EbDd2947B50A1',
        '0x5d34F95157558af63dfD8091dA329D36Fe5C64b6',
        '0x164572AcFf302AC81C257299fC5c2a074f069C34'
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
